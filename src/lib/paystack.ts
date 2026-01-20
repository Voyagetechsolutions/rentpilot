// Paystack API utility
// Using native fetch since paystack-api package is deprecated

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

interface PaystackInitResponse {
    status: boolean;
    message: string;
    data: {
        authorization_url: string;
        access_code: string;
        reference: string;
    };
}

interface PaystackVerifyResponse {
    status: boolean;
    message: string;
    data: {
        id: number;
        status: 'success' | 'failed' | 'abandoned';
        reference: string;
        amount: number;
        paid_at: string;
        channel: string;
        currency: string;
        customer: {
            email: string;
            first_name: string;
            last_name: string;
        };
    };
}

export async function initializePayment(params: {
    email: string;
    amount: number; // in ZAR
    reference: string;
    callbackUrl?: string;
    metadata?: Record<string, unknown>;
    subaccountCode?: string; // For split payments to landlord
}): Promise<PaystackInitResponse> {
    const body: Record<string, unknown> = {
        email: params.email,
        amount: Math.round(params.amount * 100), // Convert to kobo/cents
        reference: params.reference,
        callback_url: params.callbackUrl,
        metadata: params.metadata,
        currency: 'ZAR',
    };

    // Add subaccount for split payment if provided
    if (params.subaccountCode) {
        body.subaccount = params.subaccountCode;
        body.bearer = 'subaccount'; // Subaccount bears transaction fees
    }

    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        throw new Error(`Paystack API error: ${response.statusText}`);
    }

    return response.json();
}

export async function verifyPayment(reference: string): Promise<PaystackVerifyResponse> {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Paystack API error: ${response.statusText}`);
    }

    return response.json();
}

export function generateReference(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `RP_${timestamp}_${random}`.toUpperCase();
}

// Verify webhook signature
export function verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
): boolean {
    const crypto = require('crypto');
    const hash = crypto.createHmac('sha512', secret)
        .update(payload)
        .digest('hex');
    return hash === signature;
}

// Get list of banks
interface Bank {
    id: number;
    name: string;
    code: string;
}

export async function getBanks(): Promise<Bank[]> {
    const response = await fetch(`${PAYSTACK_BASE_URL}/bank?country=south africa`, {
        headers: {
            'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch banks');
    }

    const result = await response.json();
    return result.data || [];
}

// Verify bank account
interface VerifyAccountResponse {
    status: boolean;
    message: string;
    data: {
        account_number: string;
        account_name: string;
        bank_id: number;
    };
}

export async function verifyBankAccount(
    accountNumber: string,
    bankCode: string
): Promise<VerifyAccountResponse> {
    const response = await fetch(
        `${PAYSTACK_BASE_URL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        {
            headers: {
                'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
            },
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to verify account');
    }

    return response.json();
}

// Create subaccount for landlord
interface CreateSubaccountParams {
    businessName: string;
    bankCode: string;
    accountNumber: string;
    percentageCharge: number; // Platform fee percentage (e.g., 2 for 2%)
    primaryContactEmail: string;
}

interface SubaccountResponse {
    status: boolean;
    message: string;
    data: {
        subaccount_code: string;
        id: number;
        business_name: string;
        account_number: string;
    };
}

export async function createSubaccount(params: CreateSubaccountParams): Promise<SubaccountResponse> {
    const response = await fetch(`${PAYSTACK_BASE_URL}/subaccount`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            business_name: params.businessName,
            bank_code: params.bankCode,
            account_number: params.accountNumber,
            percentage_charge: params.percentageCharge,
            primary_contact_email: params.primaryContactEmail,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create subaccount');
    }

    return response.json();
}
