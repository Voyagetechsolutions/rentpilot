import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { initializePayment, generateReference } from '@/lib/paystack';

// POST /api/payments/initiate - Initialize a payment for tenant
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as { id?: string; email?: string }).id;
        const userEmail = (session.user as { email?: string }).email;

        if (!userEmail) {
            return NextResponse.json({ success: false, error: 'User email not found' }, { status: 400 });
        }

        // Get tenant profile with property landlord info
        const tenant = await prisma.tenant.findUnique({
            where: { userId },
            include: {
                leases: {
                    where: { status: 'ACTIVE' },
                    include: {
                        unit: {
                            include: {
                                property: {
                                    include: {
                                        landlord: {
                                            include: {
                                                settings: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        rentCharges: {
                            where: { status: { in: ['UNPAID', 'PARTIAL', 'OVERDUE'] } },
                            orderBy: { dueDate: 'asc' },
                        },
                    },
                },
            },
        });

        if (!tenant) {
            return NextResponse.json({ success: false, error: 'Tenant profile not found' }, { status: 404 });
        }

        const activeLease = tenant.leases[0];
        if (!activeLease) {
            return NextResponse.json({ success: false, error: 'No active lease found' }, { status: 400 });
        }

        const body = await request.json();
        let { amount } = body;

        // If no amount specified, calculate from unpaid charges
        if (!amount) {
            const unpaidCharges = activeLease.rentCharges;
            if (unpaidCharges.length === 0) {
                return NextResponse.json({ success: false, error: 'No outstanding balance' }, { status: 400 });
            }
            amount = unpaidCharges.reduce((sum, charge) => sum + (charge.amountDue - charge.amountPaid), 0);
        }

        if (amount <= 0) {
            return NextResponse.json({ success: false, error: 'Invalid payment amount' }, { status: 400 });
        }

        // Generate unique reference
        const reference = generateReference();

        // Get callback URL
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const callbackUrl = `${baseUrl}/tenant/pay/callback?reference=${reference}`;

        // Get landlord's subaccount code for direct payout
        const landlordSettings = activeLease.unit.property.landlord.settings;
        const subaccountCode = landlordSettings?.paystackSubaccountCode || undefined;

        // Initialize payment with Paystack (with subaccount for split payment)
        const paystackResponse = await initializePayment({
            email: userEmail,
            amount: amount,
            reference: reference,
            callbackUrl: callbackUrl,
            subaccountCode: subaccountCode, // Money goes directly to landlord!
            metadata: {
                tenantId: tenant.id,
                leaseId: activeLease.id,
                tenantName: tenant.fullName,
                unit: activeLease.unit.unitNumber,
                property: activeLease.unit.property.name,
                landlordId: activeLease.unit.property.landlordId,
            },
        });

        if (!paystackResponse.status) {
            return NextResponse.json({
                success: false,
                error: paystackResponse.message || 'Failed to initialize payment'
            }, { status: 500 });
        }

        // Store pending payment in database
        await prisma.onlinePayment.create({
            data: {
                tenantId: tenant.id,
                leaseId: activeLease.id,
                amount: amount,
                reference: reference,
                accessCode: paystackResponse.data.access_code,
                authorizationUrl: paystackResponse.data.authorization_url,
                status: 'PENDING',
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                authorizationUrl: paystackResponse.data.authorization_url,
                accessCode: paystackResponse.data.access_code,
                reference: reference,
                amount: amount,
                directPayout: !!subaccountCode, // Let frontend know if direct payout is enabled
            },
        });
    } catch (error) {
        console.error('Error initializing payment:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to initialize payment'
        }, { status: 500 });
    }
}
