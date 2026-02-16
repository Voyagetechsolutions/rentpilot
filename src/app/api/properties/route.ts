import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getCached, setCache, invalidateCache } from '@/lib/cache';
import { checkPlanLimits } from '@/lib/planEnforcement';

// GET /api/properties - List all properties for authenticated user
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

        // Check cache (30 second TTL)
        const cacheKey = `properties:${userId}`;
        const cached = getCached(cacheKey);
        if (cached) {
            return NextResponse.json({ success: true, data: cached, cached: true });
        }

        // Optimized query with selective fields
        const properties = await prisma.property.findMany({
            where: { landlordId: userId },
            select: {
                id: true,
                name: true,
                address: true,
                city: true,
                country: true,
                createdAt: true,
                units: {
                    select: {
                        id: true,
                        unitNumber: true,
                        status: true,
                        rentAmount: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        // Cache the result
        setCache(cacheKey, properties, { ttlSeconds: 30 });

        return NextResponse.json({ success: true, data: properties });
    } catch (error) {
        console.error('Error fetching properties:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch properties' },
            { status: 500 }
        );
    }
}

// POST /api/properties - Create a new property
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const userId = (session.user as { id?: string }).id;

        // Check plan limits before creating property
        const limitError = await checkPlanLimits(userId!, 'addProperty');
        if (limitError) {
            return limitError;
        }

        const body = await request.json();
        const { name, address, city, country } = body;

        if (!name || !address || !city || !country) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const property = await prisma.property.create({
            data: {
                name,
                address,
                city,
                country,
                landlordId: userId!,
            },
        });

        // Invalidate cache
        invalidateCache(`properties:${userId}`);

        return NextResponse.json({ success: true, data: property }, { status: 201 });
    } catch (error) {
        console.error('Error creating property:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create property' },
            { status: 500 }
        );
    }
}
