import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/payments - List all payments for authenticated user's properties
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as { id?: string }).id;
        const { searchParams } = new URL(request.url);
        const method = searchParams.get('method');

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
            },
            orderBy: { datePaid: 'desc' },
        });

        return NextResponse.json({ success: true, data: payments });
    } catch (error) {
        console.error('Error fetching payments:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch payments' }, { status: 500 });
    }
}

// POST /api/payments - Log a payment
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

        // Verify lease ownership
        const lease = await prisma.lease.findFirst({
            where: { id: leaseId, unit: { property: { landlordId: userId } } },
        });
        if (!lease) {
            return NextResponse.json({ success: false, error: 'Lease not found' }, { status: 404 });
        }

        const payment = await prisma.payment.create({
            data: {
                tenantId,
                leaseId,
                amount,
                method: method.toUpperCase(),
                datePaid: datePaid ? new Date(datePaid) : new Date(),
                reference,
                proofUrl,
            },
        });

        return NextResponse.json({ success: true, data: payment }, { status: 201 });
    } catch (error) {
        console.error('Error logging payment:', error);
        return NextResponse.json({ success: false, error: 'Failed to log payment' }, { status: 500 });
    }
}
