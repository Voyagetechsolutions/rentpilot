import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// PATCH /api/maintenance/[id] - Update maintenance request status
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as { id?: string }).id;
        const { id } = params;
        const body = await request.json();
        const { status } = body;

        if (!status) {
            return NextResponse.json({ success: false, error: 'Status is required' }, { status: 400 });
        }

        // Verify ownership and existence
        const maintenanceRequest = await prisma.maintenanceRequest.findUnique({
            where: { id },
            include: { unit: { include: { property: true } } }
        });

        if (!maintenanceRequest) {
            return NextResponse.json({ success: false, error: 'Maintenance request not found' }, { status: 404 });
        }

        // Only landlord of the property can update status
        if (maintenanceRequest.unit.property.landlordId !== userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
        }

        const updatedRequest = await prisma.maintenanceRequest.update({
            where: { id },
            data: { status },
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId,
                action: 'MAINTENANCE_UPDATED',
                entityType: 'MaintenanceRequest',
                entityId: id,
                details: JSON.stringify({ status })
            }
        });

        return NextResponse.json({ success: true, data: updatedRequest });
    } catch (error) {
        console.error('Error updating maintenance request:', error);
        return NextResponse.json({ success: false, error: 'Failed to update maintenance request' }, { status: 500 });
    }
}
