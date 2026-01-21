import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/inspections/[id] - Get single inspection
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const inspection = await prisma.inspection.findFirst({
            where: {
                id: params.id,
                unit: {
                    property: { landlordId: session.user.id },
                },
            },
            include: {
                unit: {
                    include: { property: true },
                },
                lease: {
                    include: { tenant: true },
                },
                items: {
                    orderBy: [{ room: 'asc' }, { item: 'asc' }],
                },
                signatures: true,
            },
        });

        if (!inspection) {
            return NextResponse.json(
                { success: false, error: 'Inspection not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: inspection });
    } catch (error) {
        console.error('Error fetching inspection:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch inspection' },
            { status: 500 }
        );
    }
}

// PUT /api/inspections/[id] - Update inspection
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { status, notes, completedAt, items } = body;

        // Verify ownership
        const existingInspection = await prisma.inspection.findFirst({
            where: {
                id: params.id,
                unit: {
                    property: { landlordId: session.user.id },
                },
            },
        });

        if (!existingInspection) {
            return NextResponse.json(
                { success: false, error: 'Inspection not found' },
                { status: 404 }
            );
        }

        // Update inspection
        const updateData: Record<string, unknown> = {};
        if (status) updateData.status = status;
        if (notes !== undefined) updateData.notes = notes;
        if (completedAt) updateData.completedAt = new Date(completedAt);

        // Update items if provided
        if (items && Array.isArray(items)) {
            await Promise.all(
                items.map((item: { id: string; condition: string; notes?: string; photos?: string }) =>
                    prisma.inspectionItem.update({
                        where: { id: item.id },
                        data: {
                            condition: item.condition,
                            notes: item.notes || null,
                            photos: item.photos || '[]',
                        },
                    })
                )
            );
        }

        const inspection = await prisma.inspection.update({
            where: { id: params.id },
            data: updateData,
            include: {
                unit: {
                    include: { property: true },
                },
                lease: {
                    include: { tenant: true },
                },
                items: {
                    orderBy: [{ room: 'asc' }, { item: 'asc' }],
                },
                signatures: true,
            },
        });

        return NextResponse.json({ success: true, data: inspection });
    } catch (error) {
        console.error('Error updating inspection:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update inspection' },
            { status: 500 }
        );
    }
}

// DELETE /api/inspections/[id] - Delete inspection
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Verify ownership
        const existingInspection = await prisma.inspection.findFirst({
            where: {
                id: params.id,
                unit: {
                    property: { landlordId: session.user.id },
                },
            },
        });

        if (!existingInspection) {
            return NextResponse.json(
                { success: false, error: 'Inspection not found' },
                { status: 404 }
            );
        }

        await prisma.inspection.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true, message: 'Inspection deleted' });
    } catch (error) {
        console.error('Error deleting inspection:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete inspection' },
            { status: 500 }
        );
    }
}
