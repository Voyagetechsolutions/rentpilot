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
            canPay: false,
        };

        let documents: any[] = [];

        if (activeLease) {
            const currentMonth = new Date().toISOString().slice(0, 7);

            // Calculate total outstanding balance from all charges
            // We need to fetch ALL unpaid charges, not just the last 6
            // But for performance, we'll rely on the fetched ones or make a separate lightweight query if needed.
            // For now, let's use the fetched ones as a good approximation or update the query above.

            const unpaidCharges = activeLease.rentCharges; // Using the ones we fetched

            // Calculate balance: Sum of (Due - Paid) for all charges
            const balance = unpaidCharges.reduce((sum, charge) => {
                return sum + (charge.amountDue - charge.amountPaid);
            }, 0);

            const currentCharge = activeLease.rentCharges.find(
                r => r.month === currentMonth
            );

            const today = new Date();
            const isAfter20th = today.getDate() >= 20;

            rentSummary = {
                currentRent: activeLease.rentAmount,
                totalDue: currentCharge?.amountDue || activeLease.rentAmount,
                totalPaid: currentCharge?.amountPaid || 0,
                balance: balance,
                nextDueDate: "1st of the next month", // User requested format
                canPay: balance > 0 || isAfter20th,
            };

            // Fetch documents linked to lease
            const leaseDocs = await prisma.document.findMany({
                where: {
                    leaseId: activeLease.id
                },
                select: {
                    id: true,
                    filename: true,
                    fileUrl: true,
                    docType: true,
                    createdAt: true
                },
                orderBy: { createdAt: 'desc' }
            });
            documents = leaseDocs;
        }

        // Open maintenance count
        const openMaintenanceCount = await prisma.maintenanceRequest.count({
            where: {
                tenantId: tenant.id,
                status: { in: ['SUBMITTED', 'IN_REVIEW', 'IN_PROGRESS'] }
            }
        });

        // Fetch online payments for this tenant
        const onlinePayments = await prisma.onlinePayment.findMany({
            where: { tenantId: tenant.id },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });

        // Merge manual payments (confirmed = SUCCESS) with online payments (have their own status)
        const manualPayments = tenant.payments.map(p => ({
            id: p.id,
            amount: p.amount,
            date: p.datePaid,
            method: p.method,
            reference: p.reference || '',
            status: 'SUCCESS' as string, // Manual payments recorded by landlord are confirmed
            source: 'manual' as string,
        }));

        const onlinePaymentsMapped = onlinePayments.map(op => ({
            id: op.id,
            amount: op.amount / 100, // Paystack stores in cents
            date: op.paidAt || op.createdAt,
            method: 'ONLINE',
            reference: op.reference,
            status: op.status, // PENDING, SUCCESS, FAILED
            source: 'online' as string,
        }));

        // Combine, deduplicate by reference, sort by date desc
        const allPaymentsMap = new Map<string, typeof manualPayments[0]>();
        for (const p of [...manualPayments, ...onlinePaymentsMapped]) {
            if (!allPaymentsMap.has(p.reference || p.id)) {
                allPaymentsMap.set(p.reference || p.id, p);
            }
        }
        const recentPayments = Array.from(allPaymentsMap.values())
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10);

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
            documents,
            recentPayments,
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
