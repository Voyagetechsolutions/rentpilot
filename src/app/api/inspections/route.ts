import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/inspections - List all inspections
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const unitId = searchParams.get('unitId');
        const leaseId = searchParams.get('leaseId');
        const status = searchParams.get('status');
        const type = searchParams.get('type');

        // Get properties owned by this landlord to verify access
        const landlordProperties = await prisma.property.findMany({
            where: { landlordId: session.user.id },
            select: { id: true },
        });
        const propertyIds = landlordProperties.map((p) => p.id);

        // Build filter
        const where: Record<string, unknown> = {
            unit: {
                propertyId: { in: propertyIds },
            },
        };

        if (unitId) where.unitId = unitId;
        if (leaseId) where.leaseId = leaseId;
        if (status) where.status = status;
        if (type) where.type = type;

        const inspections = await prisma.inspection.findMany({
            where,
            include: {
                unit: {
                    include: {
                        property: true,
                    },
                },
                lease: {
                    include: {
                        tenant: true,
                    },
                },
                items: true,
                signatures: true,
            },
            orderBy: { scheduledDate: 'desc' },
        });

        return NextResponse.json({ success: true, data: inspections });
    } catch (error) {
        console.error('Error fetching inspections:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch inspections' },
            { status: 500 }
        );
    }
}

// POST /api/inspections - Create a new inspection
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { unitId, leaseId, type, scheduledDate, notes } = body;

        if (!unitId || !type || !scheduledDate) {
            return NextResponse.json(
                { success: false, error: 'Unit, type, and scheduled date are required' },
                { status: 400 }
            );
        }

        // Verify landlord owns this unit
        const unit = await prisma.unit.findFirst({
            where: {
                id: unitId,
                property: { landlordId: session.user.id },
            },
        });

        if (!unit) {
            return NextResponse.json(
                { success: false, error: 'Unit not found or not authorized' },
                { status: 404 }
            );
        }

        // Create inspection with default inspection items based on rooms
        const defaultRooms = [
            'LIVING_ROOM',
            'KITCHEN',
            'BEDROOM_1',
            'BATHROOM',
            'ENTRANCE',
        ];

        const defaultItems = [
            'WALLS',
            'FLOORS',
            'WINDOWS',
            'DOORS',
            'FIXTURES',
            'ELECTRICAL',
        ];

        const inspection = await prisma.inspection.create({
            data: {
                unitId,
                leaseId: leaseId || null,
                type,
                scheduledDate: new Date(scheduledDate),
                notes: notes || null,
                items: {
                    create: defaultRooms.flatMap((room) =>
                        defaultItems.map((item) => ({
                            room,
                            item,
                            condition: 'GOOD',
                        }))
                    ),
                },
            },
            include: {
                unit: {
                    include: { property: true },
                },
                lease: {
                    include: { tenant: true },
                },
                items: true,
            },
        });

        return NextResponse.json({ success: true, data: inspection }, { status: 201 });
    } catch (error) {
        console.error('Error creating inspection:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create inspection' },
            { status: 500 }
        );
    }
}
