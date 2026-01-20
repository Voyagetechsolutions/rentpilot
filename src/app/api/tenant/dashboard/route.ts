import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/tenant/dashboard - Get tenant dashboard data
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as { id?: string }).id;

        // Get tenant profile
        const tenant = await prisma.tenant.findUnique({
            where: { userId },
            include: {
                leases: {
                    where: { status: 'ACTIVE' },
                    include: {
                        unit: {
                            include: {
                                property: true
                            }
                        },
                        rentCharges: {
                            orderBy: { month: 'desc' },
                            take: 6,
                        }
                    }
                },
                payments: {
                    orderBy: { datePaid: 'desc' },
                    take: 5,
                },
                maintenance: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                    include: {
                        unit: true
                    }
                }
            }
        });

        if (!tenant) {
            return NextResponse.json({
                success: false,
                error: 'Tenant profile not found'
            }, { status: 404 });
        }

        // Calculate rent summary
        const activeLease = tenant.leases[0];
        let rentSummary = {
            currentRent: 0,
            totalDue: 0,
            totalPaid: 0,
            balance: 0,
            nextDueDate: null as string | null,
        };

        if (activeLease) {
            const currentMonth = new Date().toISOString().slice(0, 7);
            const currentCharge = activeLease.rentCharges.find(
                r => r.month === currentMonth
            );

            rentSummary = {
                currentRent: activeLease.rentAmount,
                totalDue: currentCharge?.amountDue || activeLease.rentAmount,
                totalPaid: currentCharge?.amountPaid || 0,
                balance: (currentCharge?.amountDue || activeLease.rentAmount) - (currentCharge?.amountPaid || 0),
                nextDueDate: new Date(
                    new Date().getFullYear(),
                    new Date().getMonth(),
                    activeLease.dueDay
                ).toISOString(),
            };
        }

        // Open maintenance count
        const openMaintenanceCount = await prisma.maintenanceRequest.count({
            where: {
                tenantId: tenant.id,
                status: { in: ['SUBMITTED', 'IN_REVIEW', 'IN_PROGRESS'] }
            }
        });

        const dashboardData = {
            tenant: {
                id: tenant.id,
                fullName: tenant.fullName,
                phone: tenant.phone,
            },
            lease: activeLease ? {
                id: activeLease.id,
                unit: activeLease.unit.unitNumber,
                property: activeLease.unit.property.name,
                address: activeLease.unit.property.address,
                city: activeLease.unit.property.city,
                startDate: activeLease.startDate,
                endDate: activeLease.endDate,
                rentAmount: activeLease.rentAmount,
                dueDay: activeLease.dueDay,
            } : null,
            rentSummary,
            recentPayments: tenant.payments.map(p => ({
                id: p.id,
                amount: p.amount,
                date: p.datePaid,
                method: p.method,
                reference: p.reference,
            })),
            recentMaintenance: tenant.maintenance.map(m => ({
                id: m.id,
                title: m.title,
                status: m.status,
                priority: m.priority,
                createdAt: m.createdAt,
                unit: m.unit.unitNumber,
            })),
            stats: {
                openMaintenanceCount,
            }
        };

        return NextResponse.json({ success: true, data: dashboardData });
    } catch (error) {
        console.error('Error fetching tenant dashboard:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch dashboard data'
        }, { status: 500 });
    }
}
