import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple rate limiting for middleware (before hitting API routes)
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100;    // 100 requests per minute per IP

function getIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    return request.headers.get('x-real-ip') || 'unknown';
}

export function middleware(request: NextRequest) {
    // Only apply to API routes
    if (!request.nextUrl.pathname.startsWith('/api')) {
        return NextResponse.next();
    }

    // Skip rate limiting for auth routes in development
    if (process.env.NODE_ENV === 'development') {
        return NextResponse.next();
    }

    const ip = getIP(request);
    const now = Date.now();
    const windowStart = now - WINDOW_MS;

    // Get or create rate limit record
    let record = rateLimitMap.get(ip);

    if (!record || record.timestamp < windowStart) {
        record = { count: 1, timestamp: now };
        rateLimitMap.set(ip, record);
        return NextResponse.next();
    }

    record.count++;

    if (record.count > MAX_REQUESTS) {
        return NextResponse.json(
            { success: false, error: 'Too many requests' },
            { status: 429 }
        );
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/api/:path*',
};
