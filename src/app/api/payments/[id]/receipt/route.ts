import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/payments/[id]/receipt - Get receipt for a specific payment
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as { id?: string; role?: string }).id;
        const userRole = (session.user as { role?: string }).role;

        const payment = await prisma.payment.findUnique({
            where: { id: params.id },
            include: {
                tenant: {
                    include: {
                        user: { select: { email: true } },
                    },
                },
                lease: {
                    include: {
                        unit: {
                            include: {
                                property: {
                                    include: {
                                        landlord: {
                                            select: { name: true, email: true },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                allocations: {
                    include: {
                        rentCharge: {
                            select: { month: true, amountDue: true },
                        },
                    },
                },
            },
        });

        if (!payment) {
            return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 });
        }

        // Authorization: tenant can see own receipts, landlord can see their property payments, admin sees all
        const isOwner = payment.tenant.userId === userId;
        const isLandlord = payment.lease.unit.property.landlordId === userId;
        const isAdmin = userRole === 'ADMIN';

        if (!isOwner && !isLandlord && !isAdmin) {
            return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
        }

        const receipt = {
            receiptNumber: `RCP-${payment.id.substring(0, 8).toUpperCase()}`,
            transactionId: payment.id,
            date: payment.datePaid,
            amount: payment.amount,
            method: payment.method,
            reference: payment.reference,
            status: 'PAID',
            tenant: {
                name: payment.tenant.fullName,
                email: payment.tenant.user.email,
            },
            landlord: {
                name: payment.lease.unit.property.landlord.name || 'N/A',
                email: payment.lease.unit.property.landlord.email,
            },
            property: {
                name: payment.lease.unit.property.name,
                address: payment.lease.unit.property.address,
                unit: payment.lease.unit.unitNumber,
            },
            allocations: payment.allocations.map((a: { amount: number; rentCharge: { month: string; amountDue: number } }) => ({
                month: a.rentCharge.month,
                amount: a.amount,
                rentDue: a.rentCharge.amountDue,
            })),
            generatedAt: new Date().toISOString(),
        };

        return NextResponse.json({ success: true, data: receipt });
    } catch (error) {
        console.error('Error generating receipt:', error);
        return NextResponse.json({ success: false, error: 'Failed to generate receipt' }, { status: 500 });
    }
}
