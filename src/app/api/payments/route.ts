import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateReference } from '@/lib/paystack';

// GET /api/payments - List all payments for authenticated user's properties (manual + online)
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as { id?: string }).id;
        const { searchParams } = new URL(request.url);
        const method = searchParams.get('method');

        // Get manual/webhook-created payments
        const payments = await prisma.payment.findMany({
            where: {
                lease: { unit: { property: { landlordId: userId } } },
                ...(method && { method: method.toUpperCase() }),
            },
            include: {
                tenant: true,
                lease: {
                    include: {
                        unit: { include: { property: true } },
                    },
                },
                allocations: {
                    include: {
                        rentCharge: { select: { month: true } },
                    },
                },
            },
            orderBy: { datePaid: 'desc' },
        });

        // Also get online payments for this landlord's properties
        const onlinePayments = await prisma.onlinePayment.findMany({
            where: {
                lease: { unit: { property: { landlordId: userId } } },
                ...(method && method !== 'ONLINE' ? { status: '__NONE__' } : {}), // filter out if method filter is not ONLINE
            },
            include: {
                tenant: { select: { id: true, fullName: true, userId: true } },
                lease: {
                    include: {
                        unit: { include: { property: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // De-duplicate: exclude online payments already linked via webhook Payment records
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const paymentRefs = new Set(payments.map((p: any) => p.reference).filter(Boolean));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const uniqueOnline = onlinePayments.filter((op: any) => !paymentRefs.has(`${op.reference} - Paystack`));

        // Format online payments to match Payment shape
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedOnline = uniqueOnline.map((op: any) => ({
            id: op.id,
            tenantId: op.tenantId,
            leaseId: op.leaseId,
            amount: op.amount,
            method: 'ONLINE',
            datePaid: op.paidAt || op.createdAt,
            reference: op.reference,
            proofUrl: null,
            status: op.status,
            source: 'online',
            tenant: op.tenant,
            lease: op.lease,
            allocations: [],
            createdAt: op.createdAt,
            updatedAt: op.updatedAt,
        }));

        // Get pending manual payments (Proof of Payment) from Ledger
        const pendingLedgerPayments = await prisma.transactionLedger.findMany({
            where: {
                landlordId: userId,
                status: 'PENDING',
                paymentId: null,
                onlinePaymentId: null
            },
            orderBy: { createdAt: 'desc' },
            // We need tenant and lease/property info.
            // But TransactionLedger only has IDs.
            // We can't include relations because they don't exist in schema for Ledger.
            // So we have to fetch them or carefuly map.
            // Actually, we can fetch all related tenants/properties? Expensive.
            // Or just fetch the specific ones for these payments?
            // Let's use a Promise.all to fetch details for each pending payment or filtered list.
        });

        const pendingPaymentDetails = await Promise.all(pendingLedgerPayments.map(async (p) => {
            const lease = await prisma.lease.findUnique({
                where: { id: p.leaseId },
                include: {
                    tenant: true,
                    unit: { include: { property: true } }
                }
            });
            return {
                ...p,
                lease,
                tenant: lease?.tenant
            };
        }));

        const formattedPending = pendingPaymentDetails.map(p => ({
            id: p.id,
            tenantId: p.tenantId,
            leaseId: p.leaseId,
            amount: p.amount,
            method: p.paymentMethod,
            datePaid: p.createdAt,
            reference: p.reference,
            proofUrl: null, // Ledger doesn't have proofUrl directly? 
            // Wait, ActivityLog might have it. 
            // Or we just show "Pending" and don't show proof URL in list yet?
            status: p.status,
            source: 'ledger',
            tenant: p.tenant,
            lease: p.lease,
            allocations: [],
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
        }));

        // Merge and sort by date
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allPayments = [...payments.map((p: any) => ({ ...p, source: 'manual', status: 'SUCCESS' })), ...formattedOnline, ...formattedPending]
            .sort((a, b) => new Date(b.datePaid).getTime() - new Date(a.datePaid).getTime());

        return NextResponse.json({ success: true, data: allPayments });
    } catch (error) {
        console.error('Error fetching payments:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch payments' }, { status: 500 });
    }
}


// POST /api/payments - Log a manual payment
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as { id?: string }).id;
        const body = await request.json();
        const { tenantId, leaseId, amount, method, datePaid, reference, proofUrl } = body;

        if (!tenantId || !leaseId || !amount || !method) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        // Verify lease ownership and get unpaid rent charges + property info
        const lease = await prisma.lease.findFirst({
            where: { id: leaseId, unit: { property: { landlordId: userId } } },
            include: {
                unit: { include: { property: true } },
                rentCharges: {
                    where: { status: { in: ['UNPAID', 'PARTIAL', 'OVERDUE'] } },
                    orderBy: { dueDate: 'asc' },
                },
            },
        });
        if (!lease) {
            return NextResponse.json({ success: false, error: 'Lease not found' }, { status: 404 });
        }

        const paymentRef = reference || generateReference();

        const payment = await prisma.payment.create({
            data: {
                tenantId,
                leaseId,
                amount,
                method: method.toUpperCase(),
                datePaid: datePaid ? new Date(datePaid) : new Date(),
                reference: paymentRef,
                proofUrl,
            },
        });

        // Allocate payment to unpaid rent charges (oldest first)
        let remainingAmount = amount;
        const allocatedMonths: string[] = [];
        for (const charge of lease.rentCharges) {
            if (remainingAmount <= 0) break;

            const outstanding = charge.amountDue - charge.amountPaid;
            const allocation = Math.min(outstanding, remainingAmount);

            await prisma.paymentAllocation.create({
                data: {
                    paymentId: payment.id,
                    rentChargeId: charge.id,
                    amount: allocation,
                },
            });

            const newAmountPaid = charge.amountPaid + allocation;
            await prisma.rentCharge.update({
                where: { id: charge.id },
                data: {
                    amountPaid: newAmountPaid,
                    status: newAmountPaid >= charge.amountDue ? 'PAID' : 'PARTIAL',
                },
            });

            allocatedMonths.push(charge.month);
            remainingAmount -= allocation;
        }

        // Create Transaction Ledger entry for manual payment
        await prisma.transactionLedger.create({
            data: {
                tenantId,
                landlordId: userId!,
                propertyId: lease.unit.property.id,
                leaseId,
                paymentId: payment.id,
                amount,
                platformFee: 0, // No fee for manual payments
                netAmount: amount,
                paymentMethod: method.toUpperCase(),
                status: 'SUCCESS',
                reference: paymentRef,
            },
        });

        // Get tenant user for notification
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { userId: true, fullName: true },
        });

        if (tenant) {
            await prisma.notification.create({
                data: {
                    userId: tenant.userId,
                    type: 'PAYMENT_RECEIVED',
                    title: 'Payment Recorded',
                    message: `A payment of R${amount.toLocaleString()} for ${lease.unit.property.name} Unit ${lease.unit.unitNumber} has been recorded by your landlord.`,
                    actionUrl: '/tenant/payments',
                },
            });
        }

        // Activity log
        await prisma.activityLog.create({
            data: {
                userId: userId!,
                action: 'PAYMENT_LOGGED',
                entityType: 'Payment',
                entityId: payment.id,
                details: JSON.stringify({
                    amount,
                    method: method.toUpperCase(),
                    reference: paymentRef,
                    tenant: tenant?.fullName,
                    property: lease.unit.property.name,
                    unit: lease.unit.unitNumber,
                    allocatedMonths,
                }),
            },
        });

        return NextResponse.json({ success: true, data: payment }, { status: 201 });
    } catch (error) {
        console.error('Error logging payment:', error);
        return NextResponse.json({ success: false, error: 'Failed to log payment' }, { status: 500 });
    }
}
