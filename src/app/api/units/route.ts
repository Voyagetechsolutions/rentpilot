import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { invalidateCache } from '@/lib/cache';

// GET /api/units - List all units for authenticated user's properties
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as { id?: string }).id;
        const { searchParams } = new URL(request.url);
        const propertyId = searchParams.get('propertyId');
        const status = searchParams.get('status');

        // Optimized query with selective fields
        const units = await prisma.unit.findMany({
            where: {
                property: { landlordId: userId },
                ...(propertyId && { propertyId }),
                ...(status && { status: status.toUpperCase() }),
            },
            select: {
                id: true,
                unitNumber: true,
                bedrooms: true,
                bathrooms: true,
                rentAmount: true,
                status: true,
                createdAt: true,
                property: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                leases: {
                    where: { status: 'ACTIVE' },
                    select: {
                        id: true,
                        tenant: {
                            select: {
                                id: true,
                                fullName: true,
                            }
                        }
                    }
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ success: true, data: units });
    } catch (error) {
        console.error('Error fetching units:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch units' }, { status: 500 });
    }
}

// POST /api/units - Create a new unit
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as { id?: string }).id;
        const body = await request.json();
        const { unitNumber, propertyId, bedrooms, bathrooms, rentAmount } = body;

        if (!unitNumber || !propertyId || rentAmount === undefined) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        // Verify property ownership
        const property = await prisma.property.findFirst({
            where: { id: propertyId, landlordId: userId },
            select: { id: true }
        });
        if (!property) {
            return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
        }

        const unit = await prisma.unit.create({
            data: {
                unitNumber,
                propertyId,
                bedrooms: bedrooms || 1,
                bathrooms: bathrooms || 1,
                rentAmount,
                status: 'VACANT',
            },
        });

        // Invalidate related caches
        invalidateCache(`properties:${userId}`);
        invalidateCache(`dashboard:${userId}`);

        return NextResponse.json({ success: true, data: unit }, { status: 201 });
    } catch (error) {
        console.error('Error creating unit:', error);
        return NextResponse.json({ success: false, error: 'Failed to create unit' }, { status: 500 });
    }
}
