import prisma from './prisma';

// Plan configuration with limits and features
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
        hasRoleBasedAccess: false,
        maxUsers: 1,
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
        hasRoleBasedAccess: false,
        maxUsers: 3,
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
        hasRoleBasedAccess: true,
        maxUsers: 10,
    },
    ENTERPRISE: {
        name: 'Enterprise',
        price: 7999,
        maxUnits: Infinity,
        maxProperties: Infinity,
        hasAutomation: true,
        hasAdvancedFinance: true,
        hasApiAccess: true,
        hasPrioritySupport: true,
        hasCustomIntegrations: true,
        hasRoleBasedAccess: true,
        maxUsers: Infinity,
    },
} as const;

export type PlanType = keyof typeof PLAN_CONFIG;

export interface SubscriptionStatus {
    plan: PlanType;
    status: string;
    limits: {
        maxUnits: number;
        maxProperties: number;
        maxUsers: number;
    };
    usage: {
        currentUnits: number;
        currentProperties: number;
        currentUsers: number;
    };
    features: {
        hasAutomation: boolean;
        hasAdvancedFinance: boolean;
        hasApiAccess: boolean;
        hasPrioritySupport: boolean;
        hasCustomIntegrations: boolean;
        hasRoleBasedAccess: boolean;
    };
    canAddProperty: boolean;
    canAddUnit: boolean;
    isActive: boolean;
    daysUntilExpiry: number | null;
}

export interface PlanLimitError {
    type: 'PROPERTY_LIMIT' | 'UNIT_LIMIT' | 'USER_LIMIT' | 'FEATURE_BLOCKED' | 'SUBSCRIPTION_INACTIVE';
    message: string;
    currentUsage: number;
    limit: number;
    suggestedPlan?: PlanType;
}

/**
 * Get the subscription status and limits for a landlord
 */
export async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
    // Get user with subscription and usage data
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            subscription: true,
            properties: {
                include: {
                    units: true,
                },
            },
        },
    });

    if (!user) {
        throw new Error('User not found');
    }

    const subscription = user.subscription;
    const plan: PlanType = (subscription?.plan as PlanType) || 'STARTER';
    const planConfig = PLAN_CONFIG[plan];

    // Calculate current usage
    const currentProperties = user.properties.length;
    const currentUnits = user.properties.reduce((sum, p) => sum + p.units.length, 0);
    const currentUsers = 1; // TODO: Count team members when multi-user feature is implemented

    // Get limits (use custom limits from subscription if set, otherwise use plan defaults)
    const maxProperties = subscription?.maxProperties || planConfig.maxProperties;
    const maxUnits = subscription?.maxUnits || planConfig.maxUnits;
    const maxUsers = planConfig.maxUsers;

    // Check if subscription is active
    const isActive = !subscription || subscription.status === 'ACTIVE';

    // Calculate days until expiry
    let daysUntilExpiry: number | null = null;
    if (subscription?.endDate) {
        const endDate = new Date(subscription.endDate);
        const now = new Date();
        daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    return {
        plan,
        status: subscription?.status || 'ACTIVE',
        limits: {
            maxUnits,
            maxProperties,
            maxUsers,
        },
        usage: {
            currentUnits,
            currentProperties,
            currentUsers,
        },
        features: {
            hasAutomation: subscription?.hasAutomation ?? planConfig.hasAutomation,
            hasAdvancedFinance: subscription?.hasAdvancedFinance ?? planConfig.hasAdvancedFinance,
            hasApiAccess: subscription?.hasApiAccess ?? planConfig.hasApiAccess,
            hasPrioritySupport: subscription?.hasPrioritySupport ?? planConfig.hasPrioritySupport,
            hasCustomIntegrations: subscription?.hasCustomIntegrations ?? planConfig.hasCustomIntegrations,
            hasRoleBasedAccess: planConfig.hasRoleBasedAccess,
        },
        canAddProperty: isActive && currentProperties < maxProperties,
        canAddUnit: isActive && currentUnits < maxUnits,
        isActive,
        daysUntilExpiry,
    };
}

/**
 * Check if landlord can add a property
 */
export async function canAddProperty(userId: string): Promise<{ allowed: boolean; error?: PlanLimitError }> {
    const status = await getSubscriptionStatus(userId);

    if (!status.isActive) {
        return {
            allowed: false,
            error: {
                type: 'SUBSCRIPTION_INACTIVE',
                message: 'Your subscription is not active. Please renew to continue.',
                currentUsage: status.usage.currentProperties,
                limit: status.limits.maxProperties,
            },
        };
    }

    if (status.usage.currentProperties >= status.limits.maxProperties) {
        const suggestedPlan = getSuggestedUpgrade(status.plan, 'properties', status.usage.currentProperties + 1);
        return {
            allowed: false,
            error: {
                type: 'PROPERTY_LIMIT',
                message: `You've reached your property limit (${status.limits.maxProperties} properties). Upgrade to ${suggestedPlan ? PLAN_CONFIG[suggestedPlan].name : 'a higher'} plan to add more.`,
                currentUsage: status.usage.currentProperties,
                limit: status.limits.maxProperties,
                suggestedPlan,
            },
        };
    }

    return { allowed: true };
}

/**
 * Check if landlord can add a unit
 */
export async function canAddUnit(userId: string): Promise<{ allowed: boolean; error?: PlanLimitError }> {
    const status = await getSubscriptionStatus(userId);

    if (!status.isActive) {
        return {
            allowed: false,
            error: {
                type: 'SUBSCRIPTION_INACTIVE',
                message: 'Your subscription is not active. Please renew to continue.',
                currentUsage: status.usage.currentUnits,
                limit: status.limits.maxUnits,
            },
        };
    }

    if (status.usage.currentUnits >= status.limits.maxUnits) {
        const suggestedPlan = getSuggestedUpgrade(status.plan, 'units', status.usage.currentUnits + 1);
        return {
            allowed: false,
            error: {
                type: 'UNIT_LIMIT',
                message: `You've reached your unit limit (${status.limits.maxUnits} units). Upgrade to ${suggestedPlan ? PLAN_CONFIG[suggestedPlan].name : 'a higher'} plan to add more.`,
                currentUsage: status.usage.currentUnits,
                limit: status.limits.maxUnits,
                suggestedPlan,
            },
        };
    }

    return { allowed: true };
}

/**
 * Check if a feature is available for the landlord
 */
export async function hasFeature(
    userId: string,
    feature: keyof SubscriptionStatus['features']
): Promise<{ allowed: boolean; error?: PlanLimitError }> {
    const status = await getSubscriptionStatus(userId);

    if (!status.isActive) {
        return {
            allowed: false,
            error: {
                type: 'SUBSCRIPTION_INACTIVE',
                message: 'Your subscription is not active. Please renew to continue.',
                currentUsage: 0,
                limit: 0,
            },
        };
    }

    if (!status.features[feature]) {
        const featureNames: Record<string, string> = {
            hasAutomation: 'Automation',
            hasAdvancedFinance: 'Advanced Finance',
            hasApiAccess: 'API Access',
            hasPrioritySupport: 'Priority Support',
            hasCustomIntegrations: 'Custom Integrations',
            hasRoleBasedAccess: 'Role-Based Access',
        };

        const suggestedPlan = getSuggestedUpgradeForFeature(status.plan, feature);
        return {
            allowed: false,
            error: {
                type: 'FEATURE_BLOCKED',
                message: `${featureNames[feature]} is not available on your ${PLAN_CONFIG[status.plan].name} plan. Upgrade to ${suggestedPlan ? PLAN_CONFIG[suggestedPlan].name : 'a higher'} plan to access this feature.`,
                currentUsage: 0,
                limit: 0,
                suggestedPlan,
            },
        };
    }

    return { allowed: true };
}

/**
 * Get suggested plan upgrade based on needed capacity
 */
function getSuggestedUpgrade(
    currentPlan: PlanType,
    limitType: 'properties' | 'units',
    neededAmount: number
): PlanType | undefined {
    const plans: PlanType[] = ['STARTER', 'GROWTH', 'PRO', 'ENTERPRISE'];
    const currentIndex = plans.indexOf(currentPlan);

    for (let i = currentIndex + 1; i < plans.length; i++) {
        const plan = plans[i];
        const config = PLAN_CONFIG[plan];
        const limit = limitType === 'properties' ? config.maxProperties : config.maxUnits;
        if (neededAmount <= limit) {
            return plan;
        }
    }

    return 'ENTERPRISE';
}

/**
 * Get suggested plan upgrade for a feature
 */
function getSuggestedUpgradeForFeature(
    currentPlan: PlanType,
    feature: keyof SubscriptionStatus['features']
): PlanType | undefined {
    const plans: PlanType[] = ['STARTER', 'GROWTH', 'PRO', 'ENTERPRISE'];
    const currentIndex = plans.indexOf(currentPlan);

    for (let i = currentIndex + 1; i < plans.length; i++) {
        const plan = plans[i];
        const config = PLAN_CONFIG[plan];
        if (config[feature as keyof typeof config]) {
            return plan;
        }
    }

    return undefined;
}

/**
 * Get remaining capacity for a landlord
 */
export async function getRemainingCapacity(userId: string): Promise<{
    properties: { used: number; remaining: number; total: number };
    units: { used: number; remaining: number; total: number };
}> {
    const status = await getSubscriptionStatus(userId);

    return {
        properties: {
            used: status.usage.currentProperties,
            remaining: Math.max(0, status.limits.maxProperties - status.usage.currentProperties),
            total: status.limits.maxProperties,
        },
        units: {
            used: status.usage.currentUnits,
            remaining: Math.max(0, status.limits.maxUnits - status.usage.currentUnits),
            total: status.limits.maxUnits,
        },
    };
}

/**
 * Format limit error message for API responses
 */
export function formatLimitError(error: PlanLimitError): {
    success: false;
    error: string;
    code: string;
    details: {
        currentUsage: number;
        limit: number;
        suggestedPlan?: string;
    };
} {
    return {
        success: false,
        error: error.message,
        code: error.type,
        details: {
            currentUsage: error.currentUsage,
            limit: error.limit,
            suggestedPlan: error.suggestedPlan,
        },
    };
}
