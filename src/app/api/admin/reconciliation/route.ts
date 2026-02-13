import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/admin/reconciliation - Compare expected vs actual payments
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userRole = (session.user as { role?: string }).role;
        if (userRole !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
        }

        // Get all rent charges with their payment info
        const rentCharges = await prisma.rentCharge.findMany({
            include: {
                lease: {
                    include: {
                        tenant: { select: { fullName: true } },
                        unit: {
                            include: {
                                property: { select: { name: true, landlordId: true } },
                            },
                        },
                    },
                },
                allocations: {
                    include: {
                        payment: { select: { method: true, datePaid: true } },
                    },
                },
            },
            orderBy: { dueDate: 'desc' },
        });

        const summary = {
            totalExpected: 0,
            totalCollected: 0,
            totalOutstanding: 0,
            overdueCount: 0,
            overdueAmount: 0,
            partialCount: 0,
            paidCount: 0,
            unpaidCount: 0,
        };

        const discrepancies: Array<{
            tenant: string;
            property: string;
            unit: string;
            month: string;
            expected: number;
            received: number;
            outstanding: number;
            status: string;
            dueDate: string;
        }> = [];

        for (const charge of rentCharges) {
            summary.totalExpected += charge.amountDue;
            summary.totalCollected += charge.amountPaid;
            const outstanding = charge.amountDue - charge.amountPaid;

            if (charge.status === 'OVERDUE') {
                summary.overdueCount++;
                summary.overdueAmount += outstanding;
            } else if (charge.status === 'PARTIAL') {
                summary.partialCount++;
            } else if (charge.status === 'PAID') {
                summary.paidCount++;
            } else {
                summary.unpaidCount++;
            }

            // Flag discrepancies (unpaid, partial, overdue)
            if (outstanding > 0) {
                summary.totalOutstanding += outstanding;
                discrepancies.push({
                    tenant: charge.lease.tenant.fullName,
                    property: charge.lease.unit.property.name,
                    unit: charge.lease.unit.unitNumber,
                    month: charge.month,
                    expected: charge.amountDue,
                    received: charge.amountPaid,
                    outstanding,
                    status: charge.status,
                    dueDate: charge.dueDate.toISOString(),
                });
            }
        }

        const collectionRate = summary.totalExpected > 0
            ? Math.round((summary.totalCollected / summary.totalExpected) * 1000) / 10
            : 0;

        return NextResponse.json({
            success: true,
            data: {
                summary: {
                    ...summary,
                    collectionRate,
                },
                discrepancies: discrepancies.slice(0, 50), // Limit to 50
            },
        });
    } catch (error) {
        console.error('Error fetching reconciliation data:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch reconciliation data' }, { status: 500 });
    }
}
