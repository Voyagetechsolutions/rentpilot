import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getBanks, verifyBankAccount, createSubaccount } from '@/lib/paystack';

// GET /api/settings/bank - Get landlord's bank settings and list of banks
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as { id?: string }).id;

        // Get user settings
        const settings = await prisma.userSettings.findUnique({
            where: { userId },
            select: {
                bankName: true,
                bankCode: true,
                accountNumber: true,
                accountName: true,
                paystackSubaccountCode: true,
            },
        });

        // Get list of banks from Paystack
        let banks: { name: string; code: string }[] = [];
        try {
            banks = await getBanks();
        } catch (error) {
            console.error('Failed to fetch banks:', error);
            // Return empty list if Paystack fails
        }

        return NextResponse.json({
            success: true,
            data: {
                bankSettings: settings || {},
                banks,
                hasSubaccount: !!settings?.paystackSubaccountCode,
            },
        });
    } catch (error) {
        console.error('Error fetching bank settings:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 });
    }
}

// POST /api/settings/bank - Save bank account and create subaccount
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as { id?: string; email?: string }).id;
        const userEmail = (session.user as { email?: string }).email;

        const body = await request.json();
        const { bankCode, accountNumber, bankName } = body;

        if (!bankCode || !accountNumber) {
            return NextResponse.json({
                success: false,
                error: 'Bank code and account number are required'
            }, { status: 400 });
        }

        // Verify the bank account with Paystack
        let accountName: string;
        try {
            const verification = await verifyBankAccount(accountNumber, bankCode);
            accountName = verification.data.account_name;
        } catch (error) {
            console.error('Account verification failed:', error);
            return NextResponse.json({
                success: false,
                error: 'Could not verify bank account. Please check your details.'
            }, { status: 400 });
        }

        // Get existing settings
        let settings = await prisma.userSettings.findUnique({
            where: { userId },
        });

        // Get user's organization name for subaccount
        const organizationName = settings?.organizationName || 'Nook Landlord';

        // Create Paystack subaccount if not exists
        let subaccountCode = settings?.paystackSubaccountCode;
        let subaccountId = settings?.paystackSubaccountId;

        if (!subaccountCode) {
            try {
                const subaccount = await createSubaccount({
                    businessName: organizationName,
                    bankCode,
                    accountNumber,
                    percentageCharge: 2, // 2% platform fee (adjust as needed)
                    primaryContactEmail: userEmail || '',
                });
                subaccountCode = subaccount.data.subaccount_code;
                subaccountId = subaccount.data.id.toString();
            } catch (error) {
                console.error('Subaccount creation failed:', error);
                return NextResponse.json({
                    success: false,
                    error: 'Failed to set up payment account. Please try again.'
                }, { status: 500 });
            }
        }

        // Update or create settings
        settings = await prisma.userSettings.upsert({
            where: { userId },
            update: {
                bankName,
                bankCode,
                accountNumber,
                accountName,
                paystackSubaccountCode: subaccountCode,
                paystackSubaccountId: subaccountId,
            },
            create: {
                userId: userId!,
                bankName,
                bankCode,
                accountNumber,
                accountName,
                paystackSubaccountCode: subaccountCode,
                paystackSubaccountId: subaccountId,
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                bankName: settings.bankName,
                accountNumber: settings.accountNumber,
                accountName: settings.accountName,
                hasSubaccount: true,
            },
            message: 'Bank account verified and saved! Payments will go directly to your account.',
        });
    } catch (error) {
        console.error('Error saving bank settings:', error);
        return NextResponse.json({ success: false, error: 'Failed to save settings' }, { status: 500 });
    }
}
