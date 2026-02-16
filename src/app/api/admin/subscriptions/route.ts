import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Plan configurations
export const PLAN_CONFIG = {
    STARTER: {
        name: 'Starter',
        price: 599,
        maxUnits: 10,
        maxProperties: 5,
        hasAutomation: false,
        hasAdvancedFinance: false,
        hasApiAccess: false,
        hasPrioritySupport: false,
        hasCustomIntegrations: false,
    },
    GROWTH: {
        name: 'Growth',
        price: 1199,
        maxUnits: 50,
        maxProperties: 20,
        hasAutomation: true,
        hasAdvancedFinance: false,
        hasApiAccess: false,
        hasPrioritySupport: false,
        hasCustomIntegrations: false,
    },
    PRO: {
        name: 'Pro',
        price: 2999,
        maxUnits: 200,
        maxProperties: 100,
        hasAutomation: true,
        hasAdvancedFinance: true,
        hasApiAccess: true,
        hasPrioritySupport: true,
        hasCustomIntegrations: false,
    },
    ENTERPRISE: {
        name: 'Enterprise',
        price: 7999,
        maxUnits: 999999,
        maxProperties: 999999,
        hasAutomation: true,
        hasAdvancedFinance: true,
        hasApiAccess: true,
        hasPrioritySupport: true,
        hasCustomIntegrations: true,
    },
};

// GET /api/admin/subscriptions - Get all landlord subscriptions
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
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';
        const plan = searchParams.get('plan') || '';
        const status = searchParams.get('status') || '';

        const skip = (page - 1) * limit;

        // Build where clause
        const where: Record<string, unknown> = {
            role: 'LANDLORD',
        };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Get all landlords with their subscriptions
        const [landlords, total] = await Promise.all([
            prisma.user.findMany({
                where,
                include: {
                    subscription: true,
                    properties: {
                        include: {
                            units: true,
                        },
                    },
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.user.count({ where }),
        ]);

        // Filter by plan/status if specified (done in memory since subscription may not exist)
        let filtered = landlords;
        if (plan) {
            filtered = filtered.filter(l => l.subscription?.plan === plan || (!l.subscription && plan === 'STARTER'));
        }
        if (status) {
            filtered = filtered.filter(l => l.subscription?.status === status || (!l.subscription && status === 'ACTIVE'));
        }

        // Transform data for response
        const data = filtered.map(landlord => {
            const propertyCount = landlord.properties.length;
            const unitCount = landlord.properties.reduce((sum, p) => sum + p.units.length, 0);
            const currentPlan = landlord.subscription?.plan || 'STARTER';
            const planConfig = PLAN_CONFIG[currentPlan as keyof typeof PLAN_CONFIG];

            return {
                id: landlord.id,
                name: landlord.name || 'Unknown',
                email: landlord.email,
                createdAt: landlord.createdAt,
                subscription: landlord.subscription || {
                    id: null,
                    plan: 'STARTER',
                    status: 'ACTIVE',
                    monthlyPrice: 599,
                    startDate: landlord.createdAt,
                    maxUnits: 10,
                    maxProperties: 5,
                },
                usage: {
                    properties: propertyCount,
                    units: unitCount,
                    maxProperties: landlord.subscription?.maxProperties || 5,
                    maxUnits: landlord.subscription?.maxUnits || 10,
                    propertiesPercent: Math.round((propertyCount / (landlord.subscription?.maxProperties || 5)) * 100),
                    unitsPercent: Math.round((unitCount / (landlord.subscription?.maxUnits || 10)) * 100),
                },
                features: {
                    hasAutomation: landlord.subscription?.hasAutomation || false,
                    hasAdvancedFinance: landlord.subscription?.hasAdvancedFinance || false,
                    hasApiAccess: landlord.subscription?.hasApiAccess || false,
                    hasPrioritySupport: landlord.subscription?.hasPrioritySupport || false,
                },
                isOverLimit: unitCount > (landlord.subscription?.maxUnits || 10) ||
                             propertyCount > (landlord.subscription?.maxProperties || 5),
            };
        });

        // Get summary stats
        const summary = {
            total: total,
            byPlan: {
                STARTER: data.filter(d => d.subscription.plan === 'STARTER').length,
                GROWTH: data.filter(d => d.subscription.plan === 'GROWTH').length,
                PRO: data.filter(d => d.subscription.plan === 'PRO').length,
                ENTERPRISE: data.filter(d => d.subscription.plan === 'ENTERPRISE').length,
            },
            overLimit: data.filter(d => d.isOverLimit).length,
            monthlyRevenue: data.reduce((sum, d) => sum + (d.subscription.monthlyPrice || 0), 0),
        };

        return NextResponse.json({
            success: true,
            data: {
                landlords: data,
                summary,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch subscriptions' }, { status: 500 });
    }
}

// POST /api/admin/subscriptions - Create initial subscription for a landlord
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userRole = (session.user as { role?: string }).role;
        if (userRole !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const { userId, plan } = body;

        if (!userId || !plan) {
            return NextResponse.json({ success: false, error: 'User ID and plan are required' }, { status: 400 });
        }

        const planConfig = PLAN_CONFIG[plan as keyof typeof PLAN_CONFIG];
        if (!planConfig) {
            return NextResponse.json({ success: false, error: 'Invalid plan' }, { status: 400 });
        }

        // Check if subscription already exists
        const existing = await prisma.subscription.findUnique({
            where: { userId },
        });

        if (existing) {
            return NextResponse.json({ success: false, error: 'Subscription already exists' }, { status: 400 });
        }

        // Create subscription
        const subscription = await prisma.subscription.create({
            data: {
                userId,
                plan,
                monthlyPrice: planConfig.price,
                maxUnits: planConfig.maxUnits,
                maxProperties: planConfig.maxProperties,
                hasAutomation: planConfig.hasAutomation,
                hasAdvancedFinance: planConfig.hasAdvancedFinance,
                hasApiAccess: planConfig.hasApiAccess,
                hasPrioritySupport: planConfig.hasPrioritySupport,
                hasCustomIntegrations: planConfig.hasCustomIntegrations,
                changedBy: session.user.id,
                changedAt: new Date(),
                history: {
                    create: {
                        action: 'CREATED',
                        newPlan: plan,
                        newPrice: planConfig.price,
                        changedBy: session.user.id as string,
                        changedByName: session.user.name || session.user.email || 'Admin',
                        reason: 'Initial subscription created by admin',
                    },
                },
            },
            include: {
                user: {
                    select: { name: true, email: true },
                },
            },
        });

        return NextResponse.json({ success: true, data: subscription });
    } catch (error) {
        console.error('Error creating subscription:', error);
        return NextResponse.json({ success: false, error: 'Failed to create subscription' }, { status: 500 });
    }
}
