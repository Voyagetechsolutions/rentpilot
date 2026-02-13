import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/tenant/payments - Get all payments for the tenant
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as { id?: string }).id;

        // Get tenant profile
        // Get tenant profile with active leases for property info lookup
        const tenant = await prisma.tenant.findUnique({
            where: { userId },
            include: {
                leases: {
                    include: {
                        unit: {
                            include: {
                                property: true
                            }
                        }
                    }
                }
            }
        });

        if (!tenant) {
            return NextResponse.json({ success: false, error: 'Tenant profile not found' }, { status: 404 });
        }

        // Get all manual payments
        const payments = await prisma.payment.findMany({
            where: { tenantId: tenant.id },
            orderBy: { datePaid: 'desc' },
            include: {
                lease: {
                    include: {
                        unit: {
                            include: { property: { select: { name: true } } }
                        }
                    }
                },
                allocations: {
                    include: {
                        rentCharge: { select: { month: true } }
                    }
                }
            }
        });

        // Get all online payments (all statuses)
        const onlinePayments = await prisma.onlinePayment.findMany({
            where: {
                tenantId: tenant.id,
            },
            orderBy: { paidAt: 'desc' },
            include: {
                lease: {
                    include: {
                        unit: {
                            include: { property: { select: { name: true } } }
                        }
                    }
                }
            }
        });

        // Get pending manual payments (Proof of Payment) from Ledger
        const pendingLedgerPayments = await prisma.transactionLedger.findMany({
            where: {
                tenantId: tenant.id,
                status: 'PENDING',
                paymentId: null,
                onlinePaymentId: null
            },
            orderBy: { createdAt: 'desc' }
        });

        // Helper to find property name
        const getPropertyName = (leaseId: string) => {
            const lease = tenant.leases.find(l => l.id === leaseId);
            return lease?.unit.property.name || 'Unknown Property';
        };

        const getUnitNumber = (leaseId: string) => {
            const lease = tenant.leases.find(l => l.id === leaseId);
            return lease?.unit.unitNumber || 'Unknown Unit';
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedPayments = payments.map((p: any) => ({
            id: p.id,
            amount: p.amount,
            datePaid: p.datePaid,
            method: p.method,
            reference: p.reference,
            status: 'SUCCESS',
            property: p.lease.unit.property.name,
            unit: p.lease.unit.unitNumber,
            allocations: p.allocations.map((a: { rentCharge: { month: string }; amount: number }) => ({
                month: a.rentCharge.month,
                amount: a.amount,
            })),
            source: 'manual' as const,
        }));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const paymentRefs = new Set(payments.map((p: any) => p.reference).filter(Boolean));
        const uniqueOnlinePayments = onlinePayments
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter((op: any) => !paymentRefs.has(`${op.reference} - Paystack`))
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((op: any) => ({
                id: op.id,
                amount: op.amount,
                datePaid: op.paidAt || op.createdAt,
                method: 'ONLINE',
                reference: op.reference,
                status: op.status,
                property: op.lease.unit.property.name,
                unit: op.lease.unit.unitNumber,
                allocations: [] as { month: string; amount: number }[],
                source: 'online' as const,
            }));

        const formattedPendingPayments = pendingLedgerPayments.map(p => ({
            id: p.id,
            amount: p.amount,
            datePaid: p.createdAt,
            method: p.paymentMethod,
            reference: p.reference,
            status: p.status,
            property: getPropertyName(p.leaseId),
            unit: getUnitNumber(p.leaseId),
            allocations: [] as { month: string; amount: number }[],
            source: 'manual' as const,
        }));

        const allPayments = [...formattedPayments, ...uniqueOnlinePayments, ...formattedPendingPayments]
            .sort((a, b) => new Date(b.datePaid).getTime() - new Date(a.datePaid).getTime());

        const totalPaid = allPayments.reduce((sum, p) => p.status === 'SUCCESS' ? sum + p.amount : sum, 0);

        return NextResponse.json({
            success: true,
            data: {
                payments: allPayments,
                totalPaid,
                count: allPayments.length,
            }
        });
    } catch (error) {
        console.error('Error fetching tenant payments:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch payments' }, { status: 500 });
    }
}
