import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/admin/finance - Get financial overview for admin dashboard
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userRole = (session.user as { role?: string }).role;
        if (userRole !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
        }

        // Get current date parts for monthly filtering
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        const [
            totalPayments,
            totalAmount,
            monthlyPayments,
            monthlyAmount,
            lastMonthAmount,
            failedPayments,
            pendingOnline,
            ledgerStats,
            payoutStats,
            recentTransactions,
        ] = await Promise.all([
            // Total successful payments (all time)
            prisma.payment.count(),

            // Total amount processed
            prisma.payment.aggregate({ _sum: { amount: true } }),

            // This month's payment count
            prisma.payment.count({
                where: { datePaid: { gte: startOfMonth } },
            }),

            // This month's amount
            prisma.payment.aggregate({
                where: { datePaid: { gte: startOfMonth } },
                _sum: { amount: true },
            }),

            // Last month total for comparison
            prisma.payment.aggregate({
                where: { datePaid: { gte: startOfLastMonth, lte: endOfLastMonth } },
                _sum: { amount: true },
            }),

            // Failed online payments
            prisma.onlinePayment.count({
                where: { status: 'FAILED' },
            }),

            // Pending online payments
            prisma.onlinePayment.count({
                where: { status: 'PENDING' },
            }),

            // Transaction ledger totals
            prisma.transactionLedger.aggregate({
                _sum: { platformFee: true, netAmount: true },
                where: { status: 'SUCCESS' },
            }),

            // Payout stats
            prisma.payout.groupBy({
                by: ['status'],
                _sum: { netAmount: true },
                _count: true,
            }),

            // Recent ledger entries
            prisma.transactionLedger.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
            }),
        ]);

        const totalRevenue = totalAmount._sum.amount || 0;
        const thisMonthRevenue = monthlyAmount._sum.amount || 0;
        const lastMonthRevenue = lastMonthAmount._sum.amount || 0;
        const platformFeesCollected = ledgerStats._sum.platformFee || 0;

        // Calculate monthly growth
        const monthlyGrowth = lastMonthRevenue > 0
            ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
            : 0;

        // Parse payout stats
        const payoutSummary = payoutStats.reduce((acc: Record<string, { count: number; amount: number }>, stat: { status: string; _count: number; _sum: { netAmount: number | null } }) => {
            acc[stat.status] = {
                count: stat._count,
                amount: stat._sum.netAmount || 0,
            };
            return acc;
        }, {} as Record<string, { count: number; amount: number }>);

        return NextResponse.json({
            success: true,
            data: {
                overview: {
                    totalRevenue,
                    totalPayments,
                    thisMonthRevenue,
                    thisMonthPayments: monthlyPayments,
                    monthlyGrowth: Math.round(monthlyGrowth * 10) / 10,
                    platformFeesCollected,
                    failedPayments,
                    pendingPayments: pendingOnline,
                },
                payouts: payoutSummary,
                recentTransactions: recentTransactions.map((t: { id: string; amount: number; platformFee: number; netAmount: number; paymentMethod: string; status: string; reference: string; createdAt: Date }) => ({
                    id: t.id,
                    amount: t.amount,
                    platformFee: t.platformFee,
                    netAmount: t.netAmount,
                    method: t.paymentMethod,
                    status: t.status,
                    reference: t.reference,
                    date: t.createdAt,
                })),
            },
        });
    } catch (error) {
        console.error('Error fetching finance data:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch finance data' }, { status: 500 });
    }
}
