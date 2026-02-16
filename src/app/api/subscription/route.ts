import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSubscriptionStatus, PLAN_CONFIG } from '@/lib/subscription';
import { getUsageSummary } from '@/lib/planEnforcement';

// GET /api/subscription - Get current user's subscription status
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const userId = (session.user as { id?: string }).id;
        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'User ID not found' },
                { status: 400 }
            );
        }

        const status = await getSubscriptionStatus(userId);
        const usage = await getUsageSummary(userId);
        const planConfig = PLAN_CONFIG[status.plan];

        return NextResponse.json({
            success: true,
            data: {
                plan: {
                    name: planConfig.name,
                    type: status.plan,
                    price: planConfig.price,
                    status: status.status,
                },
                limits: status.limits,
                usage: {
                    properties: usage.properties,
                    units: usage.units,
                },
                features: status.features,
                warnings: usage.warnings,
                canAddProperty: status.canAddProperty,
                canAddUnit: status.canAddUnit,
                daysUntilExpiry: status.daysUntilExpiry,
                availablePlans: Object.entries(PLAN_CONFIG).map(([key, config]) => ({
                    type: key,
                    name: config.name,
                    price: config.price,
                    maxUnits: config.maxUnits === Infinity ? 'Unlimited' : config.maxUnits,
                    maxProperties: config.maxProperties === Infinity ? 'Unlimited' : config.maxProperties,
                    features: {
                        hasAutomation: config.hasAutomation,
                        hasAdvancedFinance: config.hasAdvancedFinance,
                        hasApiAccess: config.hasApiAccess,
                        hasPrioritySupport: config.hasPrioritySupport,
                        hasCustomIntegrations: config.hasCustomIntegrations,
                    },
                })),
            },
        });
    } catch (error) {
        console.error('Error fetching subscription:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch subscription status' },
            { status: 500 }
        );
    }
}
