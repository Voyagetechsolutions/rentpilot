import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Fetch report data
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || 'this_month';

        // Get date range based on period
        const now = new Date();
        let startDate: Date;
        let endDate: Date = now;

        switch (period) {
            case 'this_month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'last_month':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case 'this_quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                startDate = new Date(now.getFullYear(), quarter * 3, 1);
                break;
            case 'this_year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        // Fetch landlord's data
        const properties = await prisma.property.findMany({
            where: { landlordId: session.user.id },
            include: { units: true }
        });

        const propertyIds = properties.map(p => p.id);
        const unitIds = properties.flatMap(p => p.units.map(u => u.id));

        // Get all units
        const units = await prisma.unit.findMany({
            where: { propertyId: { in: propertyIds } }
        });

        const totalUnits = units.length;
        const occupiedUnits = units.filter(u => u.status === 'OCCUPIED').length;
        const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

        // Get active leases
        const activeLeases = await prisma.lease.findMany({
            where: {
                unitId: { in: unitIds },
                status: 'ACTIVE'
            }
        });

        const activeTenantIds = [...new Set(activeLeases.map(l => l.tenantId))];

        // Get payments in period
        const payments = await prisma.payment.findMany({
            where: {
                leaseId: { in: activeLeases.map(l => l.id) },
                datePaid: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });

        const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0);

        // Get rent charges in period
        const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const rentCharges = await prisma.rentCharge.findMany({
            where: {
                leaseId: { in: activeLeases.map(l => l.id) },
                month: monthStr
            }
        });

        const totalDue = rentCharges.reduce((sum, r) => sum + r.amountDue, 0);
        const totalPaid = rentCharges.reduce((sum, r) => sum + r.amountPaid, 0);
        const outstanding = totalDue - totalPaid;

        // Overdue amounts
        const overdueCharges = await prisma.rentCharge.findMany({
            where: {
                leaseId: { in: activeLeases.map(l => l.id) },
                status: 'OVERDUE'
            }
        });

        const overdueAmount = overdueCharges.reduce((sum, r) => sum + (r.amountDue - r.amountPaid), 0);

        const reportData = {
            kpis: {
                totalIncome,
                occupancyRate,
                outstanding,
                activeTenants: activeTenantIds.length,
                overdueAmount,
            },
            periodLabel: getPeriodLabel(period),
        };

        return NextResponse.json({ success: true, data: reportData });
    } catch (error) {
        console.error('Error fetching report data:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch report data' },
            { status: 500 }
        );
    }
}

function getPeriodLabel(period: string): string {
    switch (period) {
        case 'this_month': return 'This Month';
        case 'last_month': return 'Last Month';
        case 'this_quarter': return 'This Quarter';
        case 'this_year': return 'This Year';
        default: return 'This Month';
    }
}
