import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Helper to get date ranges
function getDateRanges() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    return { now, startOfMonth, startOfLastMonth, endOfLastMonth, startOfYear, thirtyDaysAgo, sixtyDaysAgo };
}

// Calculate growth percentage
function calcGrowth(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
}

// Format activity log to human-readable
function formatActivityLog(log: {
    id: string;
    action: string;
    entityType: string | null;
    entityId: string | null;
    details: unknown;
    createdAt: Date;
    userId: string | null;
}, users: Map<string, string>) {
    const userName = log.userId ? users.get(log.userId) || 'Unknown User' : 'System';
    const details = log.details as Record<string, unknown> || {};

    const actionMessages: Record<string, string> = {
        'USER_SIGNUP': `${userName} registered as a new ${(details.role as string)?.toLowerCase() || 'user'}`,
        'USER_LOGIN': `${userName} logged into the platform`,
        'PROPERTY_CREATED': `${userName} created a new property: ${details.propertyName || 'Unknown'}`,
        'PROPERTY_UPDATED': `${userName} updated property: ${details.propertyName || 'Unknown'}`,
        'UNIT_CREATED': `${userName} added a new unit to ${details.propertyName || 'a property'}`,
        'LEASE_CREATED': `New lease created for ${details.tenantName || 'tenant'} at ${details.propertyName || 'property'}`,
        'LEASE_ACTIVATED': `Lease activated for ${details.tenantName || 'tenant'}`,
        'LEASE_TERMINATED': `Lease terminated for ${details.tenantName || 'tenant'}`,
        'PAYMENT_RECEIVED': `Payment of R${(details.amount as number)?.toLocaleString() || '0'} received from ${details.tenantName || 'tenant'}`,
        'PAYMENT_APPROVED': `Payment of R${(details.amount as number)?.toLocaleString() || '0'} approved for ${details.tenantName || 'tenant'}`,
        'PAYMENT_FAILED': `Payment failed for ${details.tenantName || 'tenant'} - ${details.reason || 'Unknown reason'}`,
        'MAINTENANCE_CREATED': `Maintenance request: "${details.title || 'Unknown'}" at ${details.propertyName || 'property'}`,
        'MAINTENANCE_COMPLETED': `Maintenance completed: "${details.title || 'Unknown'}" at ${details.propertyName || 'property'}`,
        'TENANT_INVITED': `${userName} invited ${details.tenantEmail || 'tenant'} to the platform`,
        'INSPECTION_SCHEDULED': `Inspection scheduled for ${details.propertyName || 'property'}`,
        'INSPECTION_COMPLETED': `Inspection completed at ${details.propertyName || 'property'}`,
        'DEPOSIT_RECEIVED': `Deposit of R${(details.amount as number)?.toLocaleString() || '0'} received from ${details.tenantName || 'tenant'}`,
        'DEPOSIT_REFUNDED': `Deposit refunded to ${details.tenantName || 'tenant'}`,
        'RENT_GENERATED': `Monthly rent charges generated for ${details.month || 'current month'}`,
    };

    return {
        id: log.id,
        message: actionMessages[log.action] || `${userName} performed ${log.action.replace(/_/g, ' ').toLowerCase()}`,
        action: log.action,
        timestamp: log.createdAt,
        type: getActivityType(log.action),
    };
}

function getActivityType(action: string): 'success' | 'warning' | 'danger' | 'info' {
    if (action.includes('FAILED') || action.includes('TERMINATED')) return 'danger';
    if (action.includes('PENDING') || action.includes('EXPIRING')) return 'warning';
    if (action.includes('COMPLETED') || action.includes('APPROVED') || action.includes('RECEIVED')) return 'success';
    return 'info';
}

// GET /api/admin/stats - Get comprehensive platform statistics
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

        const { now, startOfMonth, startOfLastMonth, endOfLastMonth, startOfYear, thirtyDaysAgo, sixtyDaysAgo } = getDateRanges();

        // ============ USER STATISTICS WITH GROWTH ============
        const [
            totalUsers,
            usersThisMonth,
            usersLastMonth,
            usersByRole,
            activeUsersLast30Days
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
            prisma.user.count({ where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth } } }),
            prisma.user.groupBy({ by: ['role'], _count: true }),
            prisma.activityLog.groupBy({
                by: ['userId'],
                where: {
                    createdAt: { gte: thirtyDaysAgo },
                    action: 'USER_LOGIN',
                    userId: { not: null }
                },
            }),
        ]);

        const userStats = {
            total: totalUsers,
            growth: calcGrowth(usersThisMonth, usersLastMonth),
            newThisMonth: usersThisMonth,
            activeUsers: activeUsersLast30Days.length,
            landlords: usersByRole.find(u => u.role === 'LANDLORD')?._count || 0,
            tenants: usersByRole.find(u => u.role === 'TENANT')?._count || 0,
            admins: usersByRole.find(u => u.role === 'ADMIN')?._count || 0,
        };

        // ============ PROPERTY & UNIT STATISTICS ============
        const [
            totalProperties,
            propertiesThisMonth,
            propertiesLastMonth,
            allUnits,
        ] = await Promise.all([
            prisma.property.count(),
            prisma.property.count({ where: { createdAt: { gte: startOfMonth } } }),
            prisma.property.count({ where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth } } }),
            prisma.unit.findMany({
                include: { leases: { where: { status: 'ACTIVE' } } },
            }),
        ]);

        const occupiedUnits = allUnits.filter(u => u.leases.length > 0).length;
        const vacantUnits = allUnits.filter(u => u.leases.length === 0).length;
        const occupancyRate = allUnits.length > 0 ? Math.round((occupiedUnits / allUnits.length) * 100) : 0;
        const totalPotentialRent = allUnits.reduce((sum, u) => sum + (u.rentAmount || 0), 0);

        const propertyStats = {
            total: totalProperties,
            growth: calcGrowth(propertiesThisMonth, propertiesLastMonth),
            newThisMonth: propertiesThisMonth,
        };

        const unitStats = {
            total: allUnits.length,
            occupied: occupiedUnits,
            vacant: vacantUnits,
            occupancyRate,
            potentialMonthlyRevenue: totalPotentialRent,
        };

        // ============ LEASE STATISTICS ============
        const [
            activeLeases,
            endedLeases,
            expiringLeases,
        ] = await Promise.all([
            prisma.lease.count({ where: { status: 'ACTIVE' } }),
            prisma.lease.count({ where: { status: 'ENDED' } }),
            prisma.lease.count({
                where: {
                    status: 'ACTIVE',
                    endDate: {
                        gte: now,
                        lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
                    },
                },
            }),
        ]);

        const leaseStats = {
            active: activeLeases,
            ended: endedLeases,
            expiringSoon: expiringLeases,
        };

        // ============ REVENUE STATISTICS WITH TRENDS ============
        const [
            totalRevenue,
            revenueThisMonth,
            revenueLastMonth,
            onlinePaymentsThisMonth,
            failedPayments,
            pendingPayments,
        ] = await Promise.all([
            prisma.payment.aggregate({ _sum: { amount: true } }),
            prisma.payment.aggregate({
                where: { datePaid: { gte: startOfMonth } },
                _sum: { amount: true },
            }),
            prisma.payment.aggregate({
                where: { datePaid: { gte: startOfLastMonth, lt: startOfMonth } },
                _sum: { amount: true },
            }),
            prisma.onlinePayment.aggregate({
                where: { createdAt: { gte: startOfMonth }, status: 'COMPLETED' },
                _sum: { amount: true },
            }),
            prisma.onlinePayment.count({ where: { status: 'FAILED' } }),
            prisma.onlinePayment.count({ where: { status: 'PENDING' } }),
        ]);

        // Monthly revenue for chart (last 6 months)
        const revenueByMonth = [];
        for (let i = 5; i >= 0; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
            const monthRevenue = await prisma.payment.aggregate({
                where: { datePaid: { gte: monthStart, lte: monthEnd } },
                _sum: { amount: true },
            });
            revenueByMonth.push({
                month: monthStart.toLocaleString('default', { month: 'short' }),
                year: monthStart.getFullYear(),
                amount: monthRevenue._sum.amount || 0,
            });
        }

        const thisMonthRevenue = revenueThisMonth._sum.amount || 0;
        const lastMonthRevenue = revenueLastMonth._sum.amount || 0;

        const revenueStats = {
            total: totalRevenue._sum.amount || 0,
            thisMonth: thisMonthRevenue,
            lastMonth: lastMonthRevenue,
            growth: calcGrowth(thisMonthRevenue, lastMonthRevenue),
            onlineThisMonth: onlinePaymentsThisMonth._sum.amount || 0,
            failedPayments,
            pendingPayments,
            monthlyTrend: revenueByMonth,
        };

        // ============ RENT COLLECTION METRICS ============
        const [
            totalRentDue,
            totalRentCollected,
            overdueCharges,
        ] = await Promise.all([
            prisma.rentCharge.aggregate({
                where: { dueDate: { lte: now } },
                _sum: { amountDue: true },
            }),
            prisma.rentCharge.aggregate({
                where: { dueDate: { lte: now } },
                _sum: { amountPaid: true },
            }),
            prisma.rentCharge.findMany({
                where: {
                    dueDate: { lt: now },
                    status: { in: ['UNPAID', 'PARTIAL'] },
                },
                include: {
                    lease: {
                        include: {
                            tenant: true,
                            unit: { include: { property: true } },
                        },
                    },
                },
                take: 10,
                orderBy: { dueDate: 'asc' },
            }),
        ]);

        const rentDue = totalRentDue._sum.amountDue || 0;
        const rentCollected = totalRentCollected._sum.amountPaid || 0;
        const collectionRate = rentDue > 0 ? Math.round((rentCollected / rentDue) * 100) : 100;

        const collectionStats = {
            totalDue: rentDue,
            totalCollected: rentCollected,
            outstanding: rentDue - rentCollected,
            collectionRate,
        };

        // ============ MAINTENANCE STATISTICS ============
        const [
            totalMaintenance,
            openMaintenance,
            completedMaintenance,
            urgentMaintenance,
        ] = await Promise.all([
            prisma.maintenanceRequest.count(),
            prisma.maintenanceRequest.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS', 'SCHEDULED'] } } }),
            prisma.maintenanceRequest.count({ where: { status: 'COMPLETED' } }),
            prisma.maintenanceRequest.count({ where: { priority: 'URGENT', status: { not: 'COMPLETED' } } }),
        ]);

        const maintenanceStats = {
            total: totalMaintenance,
            open: openMaintenance,
            completed: completedMaintenance,
            urgent: urgentMaintenance,
            completionRate: totalMaintenance > 0 ? Math.round((completedMaintenance / totalMaintenance) * 100) : 100,
        };

        // ============ OPERATIONAL ALERTS ============
        const alerts: Array<{ type: 'danger' | 'warning' | 'info'; title: string; message: string; count?: number }> = [];

        if (failedPayments > 0) {
            alerts.push({
                type: 'danger',
                title: 'Failed Payments',
                message: `${failedPayments} payment(s) failed and need attention`,
                count: failedPayments,
            });
        }

        if (pendingPayments > 5) {
            alerts.push({
                type: 'warning',
                title: 'Pending Payments',
                message: `${pendingPayments} payment(s) awaiting confirmation`,
                count: pendingPayments,
            });
        }

        if (expiringLeases > 0) {
            alerts.push({
                type: 'warning',
                title: 'Expiring Leases',
                message: `${expiringLeases} lease(s) expiring in the next 30 days`,
                count: expiringLeases,
            });
        }

        if (urgentMaintenance > 0) {
            alerts.push({
                type: 'danger',
                title: 'Urgent Maintenance',
                message: `${urgentMaintenance} urgent maintenance request(s) pending`,
                count: urgentMaintenance,
            });
        }

        if (occupancyRate < 70) {
            alerts.push({
                type: 'warning',
                title: 'Low Occupancy',
                message: `Occupancy rate is at ${occupancyRate}%. Consider marketing vacant units.`,
            });
        }

        if (collectionRate < 80) {
            alerts.push({
                type: 'danger',
                title: 'Low Collection Rate',
                message: `Collection rate is at ${collectionRate}%. Outstanding: R${(rentDue - rentCollected).toLocaleString()}`,
            });
        }

        // Check for inactive landlords (no login in 30 days with active properties)
        const activeLandlordIds = await prisma.activityLog.findMany({
            where: {
                action: 'USER_LOGIN',
                createdAt: { gte: thirtyDaysAgo },
                userId: { not: null },
            },
            select: { userId: true },
            distinct: ['userId'],
        });
        const activeIds = activeLandlordIds.map(a => a.userId).filter(Boolean) as string[];

        const inactiveLandlords = await prisma.user.count({
            where: {
                role: 'LANDLORD',
                properties: { some: {} },
                id: { notIn: activeIds.length > 0 ? activeIds : ['none'] },
            },
        });

        if (inactiveLandlords > 0) {
            alerts.push({
                type: 'info',
                title: 'Inactive Landlords',
                message: `${inactiveLandlords} landlord(s) haven't logged in for 30+ days`,
                count: inactiveLandlords,
            });
        }

        // ============ HUMAN-READABLE ACTIVITY FEED ============
        const recentLogs = await prisma.activityLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 15,
        });

        // Get user names for activity logs
        const userIds = [...new Set(recentLogs.map(log => log.userId).filter(Boolean))] as string[];
        const logUsers = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, email: true },
        });
        const userMap = new Map(logUsers.map(u => [u.id, u.name || u.email || 'Unknown']));

        const recentActivity = recentLogs.map(log => formatActivityLog(log, userMap));

        // ============ USER GROWTH FOR CHART ============
        const userGrowthByMonth = [];
        for (let i = 5; i >= 0; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
            const newUsers = await prisma.user.count({
                where: { createdAt: { gte: monthStart, lte: monthEnd } },
            });
            userGrowthByMonth.push({
                month: monthStart.toLocaleString('default', { month: 'short' }),
                year: monthStart.getFullYear(),
                count: newUsers,
            });
        }

        // ============ OVERDUE TENANTS ============
        const overdueTenants = overdueCharges
            .filter(charge => charge.amountPaid < charge.amountDue)
            .map(charge => ({
                id: charge.id,
                tenant: charge.lease?.tenant?.fullName || 'Unknown',
                property: charge.lease?.unit?.property?.name || 'Unknown',
                unit: charge.lease?.unit?.unitNumber || 'Unknown',
                amountDue: charge.amountDue,
                amountPaid: charge.amountPaid,
                outstanding: charge.amountDue - charge.amountPaid,
                dueDate: charge.dueDate,
            }));

        return NextResponse.json({
            success: true,
            data: {
                users: userStats,
                properties: propertyStats,
                units: unitStats,
                leases: leaseStats,
                revenue: revenueStats,
                collection: collectionStats,
                maintenance: maintenanceStats,
                alerts,
                recentActivity,
                charts: {
                    revenueByMonth,
                    userGrowthByMonth,
                },
                overdueTenants,
            },
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 });
    }
}
