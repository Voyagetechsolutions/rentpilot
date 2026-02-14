import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { notifications } from '@/lib/notifications';

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
            include: {
                unit: { include: { property: true } },
                tenant: { include: { user: true } },
            }
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

        // Send email notification to tenant about status update
        const tenantEmail = maintenanceRequest.tenant?.user?.email;
        if (tenantEmail) {
            const statusLabels: Record<string, string> = {
                'SUBMITTED': 'Submitted',
                'IN_REVIEW': 'In Review',
                'APPROVED': 'Approved',
                'IN_PROGRESS': 'In Progress',
                'COMPLETED': 'Completed',
                'REJECTED': 'Rejected',
            };

            const statusLabel = statusLabels[status] || status;
            const isResolved = status === 'COMPLETED';

            await notifications.sendEmail({
                to: tenantEmail,
                subject: `Maintenance Update: ${maintenanceRequest.title} - ${statusLabel}`,
                html: `
                    <h1>Maintenance Request Updated</h1>
                    <p>Dear ${maintenanceRequest.tenant.fullName},</p>
                    <p>Your maintenance request has been updated:</p>
                    <table style="border-collapse: collapse; width: 100%;">
                        <tr><td style="padding: 8px; font-weight: bold;">Request:</td><td style="padding: 8px;">${maintenanceRequest.title}</td></tr>
                        <tr><td style="padding: 8px; font-weight: bold;">Property:</td><td style="padding: 8px;">${maintenanceRequest.unit.property.name} - Unit ${maintenanceRequest.unit.unitNumber}</td></tr>
                        <tr><td style="padding: 8px; font-weight: bold;">New Status:</td><td style="padding: 8px;"><strong>${statusLabel}</strong></td></tr>
                    </table>
                    ${isResolved ? '<p style="color: green; margin-top: 16px;">✅ This request has been marked as completed.</p>' : ''}
                    <p style="margin-top: 16px;">Log in to RentPilot to view the full details.</p>
                `,
            });
        }

        return NextResponse.json({ success: true, data: updatedRequest });
    } catch (error) {
        console.error('Error updating maintenance request:', error);
        return NextResponse.json({ success: false, error: 'Failed to update maintenance request' }, { status: 500 });
    }
}
