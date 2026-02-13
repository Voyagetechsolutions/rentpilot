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
        const tenant = await prisma.tenant.findUnique({
            where: { userId },
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

        // Get all successful online payments
        const onlinePayments = await prisma.onlinePayment.findMany({
            where: {
                tenantId: tenant.id,
                status: 'SUCCESS',
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

        // Combine and format for the frontend
        const formattedPayments = payments.map(p => ({
            id: p.id,
            amount: p.amount,
            date: p.datePaid,
            method: p.method,
            reference: p.reference,
            property: p.lease.unit.property.name,
            unit: p.lease.unit.unitNumber,
            months: p.allocations.map(a => a.rentCharge.month),
            source: 'manual' as const,
        }));

        // Only add online payments that don't already have a matching Payment record
        // (webhook creates both OnlinePayment + Payment, so we check by reference)
        const paymentRefs = new Set(payments.map(p => p.reference).filter(Boolean));
        const uniqueOnlinePayments = onlinePayments
            .filter(op => !paymentRefs.has(`${op.reference} - Paystack`))
            .map(op => ({
                id: op.id,
                amount: op.amount,
                date: op.paidAt || op.createdAt,
                method: 'ONLINE',
                reference: op.reference,
                property: op.lease.unit.property.name,
                unit: op.lease.unit.unitNumber,
                months: [],
                source: 'online' as const,
            }));

        const allPayments = [...formattedPayments, ...uniqueOnlinePayments]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

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
