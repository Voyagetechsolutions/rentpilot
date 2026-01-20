import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/admin/stats - Get platform statistics
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

        // Get user counts
        const users = await prisma.user.groupBy({
            by: ['role'],
            _count: true,
        });

        const userStats = {
            total: 0,
            landlords: 0,
            tenants: 0,
            admins: 0,
        };

        users.forEach((u) => {
            userStats.total += u._count;
            if (u.role === 'LANDLORD') userStats.landlords = u._count;
            if (u.role === 'TENANT') userStats.tenants = u._count;
            if (u.role === 'ADMIN') userStats.admins = u._count;
        });

        // Get property count
        const properties = await prisma.property.count();

        // Get unit counts
        const units = await prisma.unit.findMany({
            include: {
                leases: {
                    where: { status: 'ACTIVE' },
                },
            },
        });

        const unitStats = {
            total: units.length,
            occupied: units.filter((u) => u.leases.length > 0).length,
            vacant: units.filter((u) => u.leases.length === 0).length,
        };

        // Get lease counts
        const activeLeases = await prisma.lease.count({
            where: { status: 'ACTIVE' },
        });
        const expiredLeases = await prisma.lease.count({
            where: { status: 'ENDED' },
        });

        // Get payment stats
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const totalPayments = await prisma.payment.count();
        const thisMonthPayments = await prisma.payment.count({
            where: {
                datePaid: { gte: startOfMonth },
            },
        });

        const totalAmount = await prisma.payment.aggregate({
            _sum: { amount: true },
        });

        const thisMonthAmount = await prisma.payment.aggregate({
            where: {
                datePaid: { gte: startOfMonth },
            },
            _sum: { amount: true },
        });

        // Get recent activity
        const recentActivity = await prisma.activityLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10,
        });

        return NextResponse.json({
            success: true,
            data: {
                users: userStats,
                properties,
                units: unitStats,
                leases: {
                    active: activeLeases,
                    expired: expiredLeases,
                },
                payments: {
                    total: totalPayments,
                    thisMonth: thisMonthPayments,
                    totalAmount: totalAmount._sum.amount || 0,
                    thisMonthAmount: thisMonthAmount._sum.amount || 0,
                },
                recentActivity,
            },
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 });
    }
}
