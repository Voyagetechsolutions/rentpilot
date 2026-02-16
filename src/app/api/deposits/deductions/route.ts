import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/deposits/deductions - Create a deposit deduction
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { depositId, reason, description, amount } = body;

        if (!depositId || !reason || !description || !amount) {
            return NextResponse.json(
                { success: false, error: 'Deposit ID, reason, description, and amount are required' },
                { status: 400 }
            );
        }

        // Verify deposit exists and landlord owns it
        const deposit = await prisma.deposit.findUnique({
            where: { id: depositId },
            include: {
                lease: {
                    include: {
                        unit: {
                            include: { property: true },
                        },
                        tenant: { include: { user: true } },
                    },
                },
                deductions: true,
            },
        });

        if (!deposit) {
            return NextResponse.json(
                { success: false, error: 'Deposit not found' },
                { status: 404 }
            );
        }

        if (deposit.lease.unit.property.landlordId !== session.user.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Check if deduction amount exceeds remaining deposit
        const totalExistingDeductions = deposit.deductions.reduce((sum, d) => sum + d.amount, 0);
        const remainingDeposit = deposit.amount + deposit.accruedInterest - totalExistingDeductions;

        if (amount > remainingDeposit) {
            return NextResponse.json(
                { success: false, error: `Deduction amount exceeds remaining deposit (R${remainingDeposit.toFixed(2)})` },
                { status: 400 }
            );
        }

        const deduction = await prisma.depositDeduction.create({
            data: {
                depositId,
                reason: reason.toUpperCase(),
                description,
                amount,
            },
        });

        // Notify tenant about the deduction
        if (deposit.lease.tenant) {
            await prisma.notification.create({
                data: {
                    userId: deposit.lease.tenant.userId,
                    type: 'MAINTENANCE_UPDATE',
                    title: 'Deposit Deduction Added',
                    message: `A deduction of R${amount.toLocaleString()} has been applied to your deposit for ${deposit.lease.unit.property.name} - Unit ${deposit.lease.unit.unitNumber}. Reason: ${reason} - ${description}`,
                    actionUrl: '/tenant',
                },
            });
        }

        return NextResponse.json({ success: true, data: deduction }, { status: 201 });
    } catch (error) {
        console.error('Error creating deposit deduction:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create deposit deduction' },
            { status: 500 }
        );
    }
}
