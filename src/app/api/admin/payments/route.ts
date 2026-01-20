import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/admin/payments - Get all payments
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

        const where: Record<string, unknown> = {};

        if (search) {
            where.OR = [
                { tenant: { fullName: { contains: search } } },
                { reference: { contains: search } },
            ];
        }

        const [payments, total, totalAmountResult] = await Promise.all([
            prisma.payment.findMany({
                where,
                include: {
                    tenant: {
                        select: { fullName: true },
                    },
                    lease: {
                        select: {
                            unit: {
                                select: {
                                    unitNumber: true,
                                    property: {
                                        select: { name: true },
                                    },
                                },
                            },
                        },
                    },
                },
                orderBy: { datePaid: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.payment.count({ where }),
            prisma.payment.aggregate({
                _sum: { amount: true },
            }),
        ]);

        return NextResponse.json({
            success: true,
            data: {
                payments,
                total,
                page,
                totalPages: Math.ceil(total / limit),
                totalAmount: totalAmountResult._sum.amount || 0,
            },
        });
    } catch (error) {
        console.error('Error fetching payments:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch payments' }, { status: 500 });
    }
}
