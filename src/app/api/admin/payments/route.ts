import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/admin/payments - Get all payments (manual + online)
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userRole = (session.user as { role?: string }).role;
        if (userRole !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '15');
        const search = searchParams.get('search') || '';
        const source = searchParams.get('source') || 'all'; // 'all', 'manual', 'online'

        // Build where clause for manual payments
        const manualWhere: Record<string, unknown> = {};
        if (search) {
            manualWhere.OR = [
                { tenant: { fullName: { contains: search, mode: 'insensitive' } } },
                { reference: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Build where clause for online payments
        const onlineWhere: Record<string, unknown> = {};
        if (search) {
            onlineWhere.OR = [
                { tenant: { fullName: { contains: search, mode: 'insensitive' } } },
                { reference: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Fetch both manual and online payments
        const [manualPayments, onlinePayments] = await Promise.all([
            source !== 'online' ? prisma.payment.findMany({
                where: manualWhere,
                include: {
                    tenant: { select: { fullName: true } },
                    lease: {
                        select: {
                            unit: {
                                select: {
                                    unitNumber: true,
                                    property: { select: { name: true } },
                                },
                            },
                        },
                    },
                },
                orderBy: { datePaid: 'desc' },
            }) : [],
            source !== 'manual' ? prisma.onlinePayment.findMany({
                where: onlineWhere,
                include: {
                    tenant: { select: { fullName: true } },
                    lease: {
                        select: {
                            unit: {
                                select: {
                                    unitNumber: true,
                                    property: { select: { name: true } },
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }) : [],
        ]);

        // Format manual payments
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedManual = (manualPayments as any[]).map((p) => ({
            id: p.id,
            amount: p.amount,
            method: p.method,
            datePaid: p.datePaid,
            reference: p.reference,
            status: 'SUCCESS',
            source: 'manual',
            tenant: p.tenant,
            lease: p.lease,
        }));

        // Format online payments — exclude those already linked via webhook
        const manualRefs = new Set(formattedManual.map(p => p.reference).filter(Boolean));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedOnline = (onlinePayments as any[])
            .filter(op => !manualRefs.has(`${op.reference} - Paystack`))
            .map((op) => ({
                id: op.id,
                amount: op.amount,
                method: 'ONLINE',
                datePaid: op.paidAt || op.createdAt,
                reference: op.reference,
                status: op.status,
                source: 'online',
                tenant: op.tenant,
                lease: op.lease,
            }));

        // Combine and sort
        const allPayments = [...formattedManual, ...formattedOnline]
            .sort((a, b) => new Date(b.datePaid).getTime() - new Date(a.datePaid).getTime());

        // Paginate
        const total = allPayments.length;
        const paginatedPayments = allPayments.slice((page - 1) * limit, page * limit);
        const totalAmount = allPayments.reduce((sum, p) => sum + p.amount, 0);

        return NextResponse.json({
            success: true,
            data: {
                payments: paginatedPayments,
                total,
                page,
                totalPages: Math.ceil(total / limit),
                totalAmount,
            },
        });
    } catch (error) {
        console.error('Error fetching payments:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch payments' }, { status: 500 });
    }
}
