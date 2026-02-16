import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { PLAN_CONFIG } from '../route';

// GET /api/admin/subscriptions/[id] - Get subscription details
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userRole = (session.user as { role?: string }).role;
        if (userRole !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
        }

        const userId = params.id;

        // Get landlord with subscription and usage data
        const landlord = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                subscription: {
                    include: {
                        history: {
                            orderBy: { createdAt: 'desc' },
                            take: 10,
                        },
                    },
                },
                properties: {
                    include: {
                        units: {
                            include: {
                                leases: {
                                    where: { status: 'ACTIVE' },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!landlord) {
            return NextResponse.json({ success: false, error: 'Landlord not found' }, { status: 404 });
        }

        const propertyCount = landlord.properties.length;
        const unitCount = landlord.properties.reduce((sum, p) => sum + p.units.length, 0);
        const occupiedUnits = landlord.properties.reduce(
            (sum, p) => sum + p.units.filter(u => u.leases.length > 0).length,
            0
        );
        const currentPlan = landlord.subscription?.plan || 'STARTER';
        const planConfig = PLAN_CONFIG[currentPlan as keyof typeof PLAN_CONFIG];

        // Calculate monthly revenue from this landlord's tenants
        const monthlyRent = landlord.properties.reduce(
            (sum, p) => sum + p.units.reduce((uSum, u) => uSum + (u.rentAmount || 0), 0),
            0
        );

        const data = {
            id: landlord.id,
            name: landlord.name || 'Unknown',
            email: landlord.email,
            phone: landlord.phone,
            createdAt: landlord.createdAt,
            subscription: landlord.subscription || {
                id: null,
                plan: 'STARTER',
                status: 'ACTIVE',
                monthlyPrice: 599,
                startDate: landlord.createdAt,
                maxUnits: 10,
                maxProperties: 5,
                hasAutomation: false,
                hasAdvancedFinance: false,
                hasApiAccess: false,
                hasPrioritySupport: false,
                hasCustomIntegrations: false,
                history: [],
            },
            usage: {
                properties: propertyCount,
                units: unitCount,
                occupiedUnits,
                maxProperties: landlord.subscription?.maxProperties || 5,
                maxUnits: landlord.subscription?.maxUnits || 10,
                monthlyRent,
            },
            propertyDetails: landlord.properties.map(p => ({
                id: p.id,
                name: p.name,
                address: p.address,
                units: p.units.length,
                occupiedUnits: p.units.filter(u => u.leases.length > 0).length,
            })),
            planConfig,
            availablePlans: PLAN_CONFIG,
        };

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching subscription:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch subscription' }, { status: 500 });
    }
}

// PUT /api/admin/subscriptions/[id] - Update subscription (upgrade/downgrade)
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userRole = (session.user as { role?: string }).role;
        if (userRole !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
        }

        const userId = params.id;
        const body = await request.json();
        const { plan, status, reason, notes, customLimits } = body;

        // Validate plan
        if (plan && !PLAN_CONFIG[plan as keyof typeof PLAN_CONFIG]) {
            return NextResponse.json({ success: false, error: 'Invalid plan' }, { status: 400 });
        }

        // Get current subscription and landlord
        const landlord = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                subscription: true,
                properties: {
                    include: { units: true },
                },
            },
        });

        if (!landlord) {
            return NextResponse.json({ success: false, error: 'Landlord not found' }, { status: 404 });
        }

        const currentPlan = landlord.subscription?.plan || 'STARTER';
        const newPlan = plan || currentPlan;
        const planConfig = PLAN_CONFIG[newPlan as keyof typeof PLAN_CONFIG];

        // Check if downgrade is safe (not over limits)
        if (plan && plan !== currentPlan) {
            const propertyCount = landlord.properties.length;
            const unitCount = landlord.properties.reduce((sum, p) => sum + p.units.length, 0);

            // Only enforce limits if no custom limits override
            if (!customLimits) {
                if (propertyCount > planConfig.maxProperties) {
                    return NextResponse.json({
                        success: false,
                        error: `Cannot downgrade: Landlord has ${propertyCount} properties, but ${planConfig.name} plan allows only ${planConfig.maxProperties}`,
                        details: {
                            currentProperties: propertyCount,
                            planLimit: planConfig.maxProperties,
                        },
                    }, { status: 400 });
                }

                if (unitCount > planConfig.maxUnits) {
                    return NextResponse.json({
                        success: false,
                        error: `Cannot downgrade: Landlord has ${unitCount} units, but ${planConfig.name} plan allows only ${planConfig.maxUnits}`,
                        details: {
                            currentUnits: unitCount,
                            planLimit: planConfig.maxUnits,
                        },
                    }, { status: 400 });
                }
            }
        }

        // Determine action type
        let action = 'UPDATED';
        if (plan && plan !== currentPlan) {
            const planOrder = ['STARTER', 'GROWTH', 'PRO', 'ENTERPRISE'];
            const currentIndex = planOrder.indexOf(currentPlan);
            const newIndex = planOrder.indexOf(plan);
            action = newIndex > currentIndex ? 'UPGRADED' : 'DOWNGRADED';
        } else if (status === 'CANCELLED') {
            action = 'CANCELLED';
        } else if (status === 'SUSPENDED') {
            action = 'SUSPENDED';
        } else if (status === 'ACTIVE' && landlord.subscription?.status !== 'ACTIVE') {
            action = 'REACTIVATED';
        }

        // Prepare update data
        const updateData: Record<string, unknown> = {
            changedBy: session.user.id,
            changedAt: new Date(),
        };

        if (plan) {
            updateData.plan = plan;
            updateData.monthlyPrice = planConfig.price;
            updateData.maxUnits = customLimits?.maxUnits || planConfig.maxUnits;
            updateData.maxProperties = customLimits?.maxProperties || planConfig.maxProperties;
            updateData.hasAutomation = planConfig.hasAutomation;
            updateData.hasAdvancedFinance = planConfig.hasAdvancedFinance;
            updateData.hasApiAccess = planConfig.hasApiAccess;
            updateData.hasPrioritySupport = planConfig.hasPrioritySupport;
            updateData.hasCustomIntegrations = planConfig.hasCustomIntegrations;
        }

        if (status) {
            updateData.status = status;
            if (status === 'CANCELLED') {
                updateData.cancelledAt = new Date();
            }
        }

        if (notes !== undefined) {
            updateData.notes = notes;
        }

        // Apply custom limits if provided (for enterprise or special cases)
        if (customLimits) {
            if (customLimits.maxUnits) updateData.maxUnits = customLimits.maxUnits;
            if (customLimits.maxProperties) updateData.maxProperties = customLimits.maxProperties;
        }

        // Update or create subscription
        let subscription;
        if (landlord.subscription) {
            subscription = await prisma.subscription.update({
                where: { userId },
                data: {
                    ...updateData,
                    history: {
                        create: {
                            action,
                            previousPlan: currentPlan,
                            newPlan: plan || currentPlan,
                            previousPrice: landlord.subscription.monthlyPrice,
                            newPrice: planConfig.price,
                            changedBy: session.user.id as string,
                            changedByName: session.user.name || session.user.email || 'Admin',
                            reason: reason || `${action} by admin`,
                        },
                    },
                },
                include: {
                    user: {
                        select: { name: true, email: true },
                    },
                    history: {
                        orderBy: { createdAt: 'desc' },
                        take: 5,
                    },
                },
            });
        } else {
            // Create new subscription
            subscription = await prisma.subscription.create({
                data: {
                    userId,
                    plan: plan || 'STARTER',
                    monthlyPrice: planConfig.price,
                    maxUnits: customLimits?.maxUnits || planConfig.maxUnits,
                    maxProperties: customLimits?.maxProperties || planConfig.maxProperties,
                    hasAutomation: planConfig.hasAutomation,
                    hasAdvancedFinance: planConfig.hasAdvancedFinance,
                    hasApiAccess: planConfig.hasApiAccess,
                    hasPrioritySupport: planConfig.hasPrioritySupport,
                    hasCustomIntegrations: planConfig.hasCustomIntegrations,
                    status: status || 'ACTIVE',
                    notes,
                    changedBy: session.user.id,
                    changedAt: new Date(),
                    history: {
                        create: {
                            action: 'CREATED',
                            newPlan: plan || 'STARTER',
                            newPrice: planConfig.price,
                            changedBy: session.user.id as string,
                            changedByName: session.user.name || session.user.email || 'Admin',
                            reason: reason || 'Subscription created by admin',
                        },
                    },
                },
                include: {
                    user: {
                        select: { name: true, email: true },
                    },
                    history: {
                        orderBy: { createdAt: 'desc' },
                        take: 5,
                    },
                },
            });
        }

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: session.user.id,
                action: `SUBSCRIPTION_${action}`,
                entityType: 'Subscription',
                entityId: subscription.id,
                details: JSON.stringify({
                    landlordId: userId,
                    landlordName: landlord.name || landlord.email,
                    action,
                    previousPlan: currentPlan,
                    newPlan: plan || currentPlan,
                    reason,
                }),
            },
        });

        return NextResponse.json({
            success: true,
            data: subscription,
            message: `Subscription ${action.toLowerCase()} successfully`,
        });
    } catch (error) {
        console.error('Error updating subscription:', error);
        return NextResponse.json({ success: false, error: 'Failed to update subscription' }, { status: 500 });
    }
}
