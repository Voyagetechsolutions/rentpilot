import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/properties/[id] - Get a single property
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as { id?: string }).id;
        const property = await prisma.property.findFirst({
            where: { id: params.id, landlordId: userId },
            include: {
                units: {
                    include: {
                        leases: {
                            where: { status: 'ACTIVE' },
                            include: { tenant: true },
                        },
                    },
                },
            },
        });

        if (!property) {
            return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: property });
    } catch (error) {
        console.error('Error fetching property:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch property' }, { status: 500 });
    }
}

// PUT /api/properties/[id] - Update a property
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as { id?: string }).id;
        const body = await request.json();
        const { name, address, city, country } = body;

        // Verify ownership
        const existing = await prisma.property.findFirst({ where: { id: params.id, landlordId: userId } });
        if (!existing) {
            return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
        }

        const property = await prisma.property.update({
            where: { id: params.id },
            data: {
                ...(name && { name }),
                ...(address && { address }),
                ...(city && { city }),
                ...(country && { country }),
            },
        });

        return NextResponse.json({ success: true, data: property });
    } catch (error) {
        console.error('Error updating property:', error);
        return NextResponse.json({ success: false, error: 'Failed to update property' }, { status: 500 });
    }
}

// DELETE /api/properties/[id] - Delete a property
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as { id?: string }).id;

        // Verify ownership
        const existing = await prisma.property.findFirst({ where: { id: params.id, landlordId: userId } });
        if (!existing) {
            return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
        }

        await prisma.property.delete({ where: { id: params.id } });

        return NextResponse.json({ success: true, message: 'Property deleted' });
    } catch (error) {
        console.error('Error deleting property:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete property' }, { status: 500 });
    }
}
