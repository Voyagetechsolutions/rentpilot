import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getCached, setCache } from '@/lib/cache';

// GET /api/dashboard - Get dashboard KPIs for authenticated user
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as { id?: string }).id;

        // Check cache first (30 second TTL for dashboard data)
        const cacheKey = `dashboard:${userId}`;
        const cached = getCached(cacheKey);
        if (cached) {
            return NextResponse.json({ success: true, data: cached, cached: true });
        }

        // Batch queries using Promise.all for parallel execution
        const userProperties = await prisma.property.findMany({
            where: { landlordId: userId },
            select: { id: true },
        });
        const propertyIds = userProperties.map(p => p.id);

        // Get unit IDs in a single query
        const userUnits = await prisma.unit.findMany({
            where: { propertyId: { in: propertyIds } },
            select: { id: true, status: true },
        });
        const unitIds = userUnits.map(u => u.id);
        const totalUnits = userUnits.length;
        const occupiedUnits = userUnits.filter(u => u.status === 'OCCUPIED').length;
        const vacantUnits = totalUnits - occupiedUnits;
        const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

        const currentMonth = new Date().toISOString().slice(0, 7);

        // Run remaining queries in parallel
        const [currentMonthRent, overdueCharges, openTickets, recentMaintenanceRaw, overdueLeases] = await Promise.all([
            // Rent charges aggregation (Current Month)
            prisma.rentCharge.aggregate({
                where: {
                    lease: { unitId: { in: unitIds } },
                    month: currentMonth
                },
                _sum: { amountDue: true, amountPaid: true },
            }),
            // Overdue charges (All time)
            prisma.rentCharge.aggregate({
                where: {
                    lease: { unitId: { in: unitIds } },
                    status: 'OVERDUE',
                },
                _sum: { amountDue: true, amountPaid: true },
            }),
            // Open maintenance tickets
            prisma.maintenanceRequest.count({
                where: {
                    unitId: { in: unitIds },
                    status: { in: ['SUBMITTED', 'IN_REVIEW', 'APPROVED', 'IN_PROGRESS'] },
                },
            }),
            // Recent maintenance (limited fields)
            prisma.maintenanceRequest.findMany({
                where: {
                    unitId: { in: unitIds },
                    status: { in: ['SUBMITTED', 'IN_REVIEW', 'IN_PROGRESS'] },
                },
                select: {
                    id: true,
                    title: true,
                    priority: true,
                    status: true,
                    createdAt: true,
                    unit: {
                        select: {
                            unitNumber: true,
                            property: { select: { name: true } }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 5,
            }),
            // Overdue leases (limited fields)
            prisma.rentCharge.findMany({
                where: {
                    lease: { unitId: { in: unitIds } },
                    status: 'OVERDUE',
                },
                select: {
                    id: true,
                    amountDue: true,
                    amountPaid: true,
                    dueDate: true,
                    lease: {
                        select: {
                            tenant: { select: { fullName: true } },
                            unit: {
                                select: {
                                    unitNumber: true,
                                    property: { select: { name: true } }
                                }
                            },
                        },
                    },
                },
                take: 5,
            }),
        ]);

        const rentDue = currentMonthRent._sum.amountDue || 0;
        const rentCollected = currentMonthRent._sum.amountPaid || 0;
        const overdueAmount = (overdueCharges._sum.amountDue || 0) - (overdueCharges._sum.amountPaid || 0);

        const recentMaintenance = recentMaintenanceRaw.map((req) => ({
            id: req.id,
            title: req.title,
            unit: `${req.unit.unitNumber} - ${req.unit.property?.name || 'Unknown'}`,
            priority: req.priority,
            status: req.status,
            createdAt: req.createdAt,
        }));

        const formattedOverdueLeases = overdueLeases.map((charge) => ({
            id: charge.id,
            tenant: charge.lease.tenant.fullName,
            unit: `${charge.lease.unit.unitNumber} - ${charge.lease.unit.property?.name || 'Unknown'}`,
            amount: charge.amountDue - charge.amountPaid,
            dueDate: charge.dueDate.toISOString(),
        }));

        const data = {
            kpis: {
                rentDue,
                rentCollected,
                overdueAmount,
                occupancyRate,
                openTickets,
                vacantUnits,
                occupiedUnits, // Added for "Units Used" display
                totalUnits,
            },
            overdueLeases: formattedOverdueLeases,
            recentMaintenance,
        };

        // Cache for 30 seconds
        setCache(cacheKey, data, { ttlSeconds: 30 });

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch dashboard data' }, { status: 500 });
    }
}
