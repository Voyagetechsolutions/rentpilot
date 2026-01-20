import { NextRequest, NextResponse } from 'next/server';

// In-memory store for rate limiting
// In production, use Redis for distributed rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
    windowMs: number;    // Time window in milliseconds
    maxRequests: number; // Max requests per window
}

const defaultConfig: RateLimitConfig = {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 100,     // 100 requests per minute
};

// Strict config for auth routes
export const authRateLimitConfig: RateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,          // 10 requests per 15 minutes
};

// API routes config
export const apiRateLimitConfig: RateLimitConfig = {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 60,      // 60 requests per minute
};

function getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
        return realIP;
    }
    return 'unknown';
}

export function checkRateLimit(
    request: NextRequest,
    config: RateLimitConfig = defaultConfig
): { success: boolean; remaining: number; resetIn: number } {
    const clientIP = getClientIP(request);
    const now = Date.now();
    const key = `${clientIP}:${request.nextUrl.pathname}`;

    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
        // Create new window
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + config.windowMs,
        });
        return {
            success: true,
            remaining: config.maxRequests - 1,
            resetIn: config.windowMs,
        };
    }

    if (record.count >= config.maxRequests) {
        return {
            success: false,
            remaining: 0,
            resetIn: record.resetTime - now,
        };
    }

    record.count++;
    return {
        success: true,
        remaining: config.maxRequests - record.count,
        resetIn: record.resetTime - now,
    };
}

export function rateLimitResponse(resetIn: number): NextResponse {
    return NextResponse.json(
        {
            success: false,
            error: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil(resetIn / 1000)
        },
        {
            status: 429,
            headers: {
                'Retry-After': String(Math.ceil(resetIn / 1000)),
                'X-RateLimit-Remaining': '0',
            }
        }
    );
}

// Middleware wrapper for API routes
export function withRateLimit<T>(
    handler: (request: NextRequest) => Promise<NextResponse<T>>,
    config: RateLimitConfig = apiRateLimitConfig
) {
    return async (request: NextRequest): Promise<NextResponse<T | { success: false; error: string }>> => {
        const { success, remaining, resetIn } = checkRateLimit(request, config);

        if (!success) {
            return rateLimitResponse(resetIn) as NextResponse<{ success: false; error: string }>;
        }

        const response = await handler(request);
        response.headers.set('X-RateLimit-Remaining', String(remaining));
        response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetIn / 1000)));

        return response;
    };
}

// Clean up old entries periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [key, value] of rateLimitStore.entries()) {
            if (now > value.resetTime) {
                rateLimitStore.delete(key);
            }
        }
    }, 5 * 60 * 1000);
}
