import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/deposits - List deposits
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const leaseId = searchParams.get('leaseId');

        // Get properties owned by landlord
        const landlordProperties = await prisma.property.findMany({
            where: { landlordId: session.user.id },
            select: { id: true },
        });
        const propertyIds = landlordProperties.map((p) => p.id);

        const where: Record<string, unknown> = {
            lease: {
                unit: {
                    propertyId: { in: propertyIds },
                },
            },
        };

        if (status) where.status = status;
        if (leaseId) where.leaseId = leaseId;

        const deposits = await prisma.deposit.findMany({
            where,
            include: {
                lease: {
                    include: {
                        tenant: true,
                        unit: {
                            include: { property: true },
                        },
                    },
                },
                deductions: true,
                disputes: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ success: true, data: deposits });
    } catch (error) {
        console.error('Error fetching deposits:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch deposits' },
            { status: 500 }
        );
    }
}

// POST /api/deposits - Create deposit record
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { leaseId, amount, paidDate, bankName, accountNumber, interestRate } = body;

        if (!leaseId || !amount) {
            return NextResponse.json(
                { success: false, error: 'Lease and amount are required' },
                { status: 400 }
            );
        }

        // Verify lease ownership
        const lease = await prisma.lease.findFirst({
            where: {
                id: leaseId,
                unit: {
                    property: { landlordId: session.user.id },
                },
            },
        });

        if (!lease) {
            return NextResponse.json(
                { success: false, error: 'Lease not found or not authorized' },
                { status: 404 }
            );
        }

        // Check if deposit already exists
        const existingDeposit = await prisma.deposit.findUnique({
            where: { leaseId },
        });

        if (existingDeposit) {
            return NextResponse.json(
                { success: false, error: 'Deposit record already exists for this lease' },
                { status: 400 }
            );
        }

        // SA Prime Rate (as of 2026) - typically around 11.75%
        const saPrimeRate = interestRate || 11.75;

        const deposit = await prisma.deposit.create({
            data: {
                leaseId,
                amount,
                paidDate: paidDate ? new Date(paidDate) : null,
                bankName: bankName || null,
                accountNumber: accountNumber || null,
                interestRate: saPrimeRate,
                status: paidDate ? 'HELD' : 'PENDING',
            },
            include: {
                lease: {
                    include: {
                        tenant: true,
                        unit: {
                            include: { property: true },
                        },
                    },
                },
            },
        });

        return NextResponse.json({ success: true, data: deposit }, { status: 201 });
    } catch (error) {
        console.error('Error creating deposit:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create deposit' },
            { status: 500 }
        );
    }
}
