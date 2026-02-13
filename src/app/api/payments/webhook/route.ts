import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPayment, verifyWebhookSignature } from '@/lib/paystack';

const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET || '';
const PLATFORM_FEE_PERCENT = 2; // 2% platform fee

// POST /api/payments/webhook - Handle Paystack webhook events
export async function POST(request: NextRequest) {
    try {
        const payload = await request.text();
        const signature = request.headers.get('x-paystack-signature');

        // Verify webhook signature
        if (PAYSTACK_WEBHOOK_SECRET && signature) {
            const isValid = verifyWebhookSignature(payload, signature, PAYSTACK_WEBHOOK_SECRET);
            if (!isValid) {
                return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
            }
        }

        const event = JSON.parse(payload);

        // Handle different event types
        if (event.event === 'charge.success') {
            const { reference, amount, paid_at, channel } = event.data;

            // Find the pending payment
            const onlinePayment = await prisma.onlinePayment.findUnique({
                where: { reference },
                include: {
                    tenant: true,
                    lease: {
                        include: {
                            unit: { include: { property: true } },
                            rentCharges: {
                                where: { status: { in: ['UNPAID', 'PARTIAL', 'OVERDUE'] } },
                                orderBy: { dueDate: 'asc' },
                            },
                        },
                    },
                },
            });

            if (!onlinePayment) {
                console.error('Payment not found:', reference);
                return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
            }

            if (onlinePayment.status === 'SUCCESS') {
                // Already processed (idempotent)
                return NextResponse.json({ message: 'Already processed' });
            }

            const paidAmount = amount / 100; // Convert from kobo/cents
            const platformFee = paidAmount * (PLATFORM_FEE_PERCENT / 100);
            const netAmount = paidAmount - platformFee;
            const landlordId = onlinePayment.lease.unit.property.landlordId;
            const propertyId = onlinePayment.lease.unit.property.id;

            // Update online payment status
            await prisma.onlinePayment.update({
                where: { id: onlinePayment.id },
                data: {
                    status: 'SUCCESS',
                    paidAt: new Date(paid_at),
                    gatewayResponse: JSON.stringify(event.data),
                },
            });

            // Create actual Payment record (what landlord sees)
            const payment = await prisma.payment.create({
                data: {
                    tenantId: onlinePayment.tenantId,
                    leaseId: onlinePayment.leaseId,
                    amount: paidAmount,
                    method: 'ONLINE',
                    datePaid: new Date(paid_at),
                    reference: `${reference} - Paystack`,
                },
            });

            // Allocate payment to rent charges
            let remainingAmount = paidAmount;
            const allocatedMonths: string[] = [];
            for (const charge of onlinePayment.lease.rentCharges) {
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

            // Create Transaction Ledger entry (central financial truth)
            await prisma.transactionLedger.create({
                data: {
                    tenantId: onlinePayment.tenantId,
                    landlordId,
                    propertyId,
                    leaseId: onlinePayment.leaseId,
                    paymentId: payment.id,
                    onlinePaymentId: onlinePayment.id,
                    amount: paidAmount,
                    platformFee,
                    netAmount,
                    paymentMethod: channel?.toUpperCase() || 'ONLINE',
                    status: 'SUCCESS',
                    reference,
                },
            });

            // Create Payout tracking record (auto-completed via Paystack split)
            await prisma.payout.create({
                data: {
                    landlordId,
                    amount: paidAmount,
                    platformFee,
                    netAmount,
                    status: 'COMPLETED', // Instant via Paystack subaccount split
                    reference: `PAYOUT_${reference}`,
                    processedAt: new Date(paid_at),
                },
            });

            // Create notifications
            const propertyName = onlinePayment.lease.unit.property.name;
            const unitNumber = onlinePayment.lease.unit.unitNumber;

            // Notify tenant
            await prisma.notification.create({
                data: {
                    userId: onlinePayment.tenant.userId,
                    type: 'PAYMENT_RECEIVED',
                    title: 'Payment Successful',
                    message: `Your payment of R${paidAmount.toLocaleString()} for ${propertyName} Unit ${unitNumber} has been received.`,
                    actionUrl: '/tenant/payments',
                },
            });

            // Notify landlord
            const landlord = await prisma.user.findUnique({ where: { id: landlordId } });
            if (landlord) {
                await prisma.notification.create({
                    data: {
                        userId: landlord.id,
                        type: 'PAYMENT_RECEIVED',
                        title: 'Payment Received',
                        message: `${onlinePayment.tenant.fullName} paid R${paidAmount.toLocaleString()} for ${propertyName} Unit ${unitNumber}. Net payout: R${netAmount.toLocaleString()}.`,
                        actionUrl: '/payments',
                    },
                });
            }

            // Activity log
            await prisma.activityLog.create({
                data: {
                    userId: onlinePayment.tenant.userId,
                    action: 'PAYMENT_RECEIVED',
                    entityType: 'Payment',
                    entityId: payment.id,
                    details: JSON.stringify({
                        amount: paidAmount,
                        method: 'ONLINE',
                        reference,
                        tenant: onlinePayment.tenant.fullName,
                        property: propertyName,
                        unit: unitNumber,
                        allocatedMonths,
                    }),
                },
            });

            console.log('Payment processed successfully:', reference);
        }

        return NextResponse.json({ message: 'Webhook received' });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}

// Handle payment verification callback
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const reference = searchParams.get('reference');

        if (!reference) {
            return NextResponse.json({ success: false, error: 'Reference required' }, { status: 400 });
        }

        // Verify with Paystack
        const verification = await verifyPayment(reference);

        return NextResponse.json({
            success: verification.status,
            data: {
                status: verification.data.status,
                amount: verification.data.amount / 100,
                reference: verification.data.reference,
                paidAt: verification.data.paid_at,
            },
        });
    } catch (error) {
        console.error('Verification error:', error);
        return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 500 });
    }
}
