import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { notifications } from '@/lib/notifications';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as { id?: string }).id;
        const body = await request.json();
        const { ledgerId } = body;

        if (!ledgerId) {
            return NextResponse.json({ success: false, error: 'Missing ledger ID' }, { status: 400 });
        }

        // Fetch Ledger Entry
        const ledger = await prisma.transactionLedger.findUnique({
            where: { id: ledgerId },
        });

        if (!ledger) {
            return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
        }

        if (ledger.landlordId !== userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
        }

        if (ledger.status !== 'PENDING') {
            return NextResponse.json({ success: false, error: 'Transaction is not pending' }, { status: 400 });
        }

        // Fetch properties to get active charges
        const lease = await prisma.lease.findUnique({
            where: { id: ledger.leaseId },
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

        // Create Payment Record
        const payment = await prisma.payment.create({
            data: {
                tenantId: ledger.tenantId,
                leaseId: ledger.leaseId,
                amount: ledger.amount,
                method: ledger.paymentMethod,
                datePaid: ledger.createdAt, // Use original upload date or now? original seems fairer.
                reference: ledger.reference,
                // proofUrl? retrieved from ActivityLog? 
                // For simplicity, we skip proofUrl copy for now unless we fetch it from logs.
            },
        });

        // Allocate to Rent Charges
        let remainingAmount = ledger.amount;
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

        // Update Ledger
        await prisma.transactionLedger.update({
            where: { id: ledgerId },
            data: {
                status: 'SUCCESS',
                paymentId: payment.id,
            },
        });



        // ... (inside POST function, near the end)

        // Notify Tenant via DB
        // (Fetch tenant user ID first)
        const tenant = await prisma.tenant.findUnique({
            where: { id: ledger.tenantId },
            include: { user: true }, // Include User for email
        });

        if (tenant) {
            // DB Notification
            await prisma.notification.create({
                data: {
                    userId: tenant.userId,
                    type: 'PAYMENT_RECEIVED',
                    title: 'Payment Approved',
                    message: `Your payment of R${ledger.amount.toLocaleString()} (Ref: ${ledger.reference}) has been approved.`,
                    actionUrl: '/tenant/payments',
                },
            });

            // Email Notification
            await notifications.sendEmail({
                to: tenant.user.email,
                subject: 'Payment Approved - RentPilot',
                html: `
                    <h1>Payment Approved</h1>
                    <p>Dear ${tenant.fullName},</p>
                    <p>Your payment of <strong>R${ledger.amount.toLocaleString()}</strong> with reference <strong>${ledger.reference}</strong> has been successfully approved and applied to your account.</p>
                    <p>Thank you,</p>
                    <p>The Landlord</p>
                `
            });
        }

        return NextResponse.json({ success: true, data: payment });

    } catch (error) {
        console.error('Error approving payment:', error);
        return NextResponse.json({ success: false, error: 'Failed to approve payment' }, { status: 500 });
    }
}
