import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import {
    canAddProperty,
    canAddUnit,
    hasFeature,
    getSubscriptionStatus,
    formatLimitError,
    type SubscriptionStatus,
} from './subscription';

/**
 * Higher-order function to wrap API handlers with plan limit checks
 */
export function withPlanLimits<T>(
    handler: (
        request: Request,
        context: T,
        session: { user: { id: string; role?: string } }
    ) => Promise<NextResponse>,
    options?: {
        checkPropertyLimit?: boolean;
        checkUnitLimit?: boolean;
        requiredFeature?: keyof SubscriptionStatus['features'];
    }
) {
    return async (request: Request, context: T): Promise<NextResponse> => {
        try {
            const session = await getServerSession(authOptions);
            if (!session?.user) {
                return NextResponse.json(
                    { success: false, error: 'Unauthorized' },
                    { status: 401 }
                );
            }

            const userId = session.user.id as string;

            // Check property limit if required
            if (options?.checkPropertyLimit) {
                const result = await canAddProperty(userId);
                if (!result.allowed && result.error) {
                    return NextResponse.json(formatLimitError(result.error), { status: 403 });
                }
            }

            // Check unit limit if required
            if (options?.checkUnitLimit) {
                const result = await canAddUnit(userId);
                if (!result.allowed && result.error) {
                    return NextResponse.json(formatLimitError(result.error), { status: 403 });
                }
            }

            // Check feature access if required
            if (options?.requiredFeature) {
                const result = await hasFeature(userId, options.requiredFeature);
                if (!result.allowed && result.error) {
                    return NextResponse.json(formatLimitError(result.error), { status: 403 });
                }
            }

            // All checks passed, proceed with the handler
            return handler(request, context, {
                user: { id: userId, role: (session.user as { role?: string }).role },
            });
        } catch (error) {
            console.error('Plan enforcement error:', error);
            return NextResponse.json(
                { success: false, error: 'Internal server error' },
                { status: 500 }
            );
        }
    };
}

/**
 * Check plan limits before a specific action
 * Returns an error response if limits are exceeded, or null if allowed
 */
export async function checkPlanLimits(
    userId: string,
    action: 'addProperty' | 'addUnit' | 'feature',
    featureName?: keyof SubscriptionStatus['features']
): Promise<NextResponse | null> {
    try {
        if (action === 'addProperty') {
            const result = await canAddProperty(userId);
            if (!result.allowed && result.error) {
                return NextResponse.json(formatLimitError(result.error), { status: 403 });
            }
        }

        if (action === 'addUnit') {
            const result = await canAddUnit(userId);
            if (!result.allowed && result.error) {
                return NextResponse.json(formatLimitError(result.error), { status: 403 });
            }
        }

        if (action === 'feature' && featureName) {
            const result = await hasFeature(userId, featureName);
            if (!result.allowed && result.error) {
                return NextResponse.json(formatLimitError(result.error), { status: 403 });
            }
        }

        return null; // No limit exceeded
    } catch (error) {
        console.error('Error checking plan limits:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to verify plan limits' },
            { status: 500 }
        );
    }
}

/**
 * Middleware-style function to verify subscription status
 */
export async function verifySubscription(userId: string): Promise<{
    isValid: boolean;
    status?: SubscriptionStatus;
    error?: NextResponse;
}> {
    try {
        const status = await getSubscriptionStatus(userId);

        if (!status.isActive) {
            return {
                isValid: false,
                error: NextResponse.json(
                    {
                        success: false,
                        error: 'Your subscription is not active. Please contact support.',
                        code: 'SUBSCRIPTION_INACTIVE',
                    },
                    { status: 403 }
                ),
            };
        }

        // Warn if subscription is expiring soon (within 7 days)
        if (status.daysUntilExpiry !== null && status.daysUntilExpiry <= 7 && status.daysUntilExpiry > 0) {
            // Add warning header but allow the request
            return {
                isValid: true,
                status,
            };
        }

        return {
            isValid: true,
            status,
        };
    } catch (error) {
        console.error('Error verifying subscription:', error);
        return {
            isValid: false,
            error: NextResponse.json(
                { success: false, error: 'Failed to verify subscription' },
                { status: 500 }
            ),
        };
    }
}

/**
 * Get usage summary for display in the UI
 */
export async function getUsageSummary(userId: string): Promise<{
    plan: string;
    properties: { used: number; limit: number; percentage: number };
    units: { used: number; limit: number; percentage: number };
    features: Record<string, boolean>;
    warnings: string[];
}> {
    const status = await getSubscriptionStatus(userId);

    const propertyPercentage = status.limits.maxProperties === Infinity
        ? 0
        : Math.round((status.usage.currentProperties / status.limits.maxProperties) * 100);

    const unitPercentage = status.limits.maxUnits === Infinity
        ? 0
        : Math.round((status.usage.currentUnits / status.limits.maxUnits) * 100);

    const warnings: string[] = [];

    // Add warnings for approaching limits
    if (propertyPercentage >= 80 && propertyPercentage < 100) {
        warnings.push(`You're using ${propertyPercentage}% of your property limit`);
    }
    if (unitPercentage >= 80 && unitPercentage < 100) {
        warnings.push(`You're using ${unitPercentage}% of your unit limit`);
    }
    if (propertyPercentage >= 100) {
        warnings.push('You have reached your property limit. Upgrade to add more.');
    }
    if (unitPercentage >= 100) {
        warnings.push('You have reached your unit limit. Upgrade to add more.');
    }
    if (status.daysUntilExpiry !== null && status.daysUntilExpiry <= 7 && status.daysUntilExpiry > 0) {
        warnings.push(`Your subscription expires in ${status.daysUntilExpiry} days`);
    }

    return {
        plan: status.plan,
        properties: {
            used: status.usage.currentProperties,
            limit: status.limits.maxProperties,
            percentage: propertyPercentage,
        },
        units: {
            used: status.usage.currentUnits,
            limit: status.limits.maxUnits,
            percentage: unitPercentage,
        },
        features: status.features,
        warnings,
    };
}
