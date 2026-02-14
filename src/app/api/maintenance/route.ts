import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { notifications } from '@/lib/notifications';

// GET /api/maintenance - List all maintenance requests for authenticated user's properties
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as { id?: string }).id;
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const priority = searchParams.get('priority');

        const requests = await prisma.maintenanceRequest.findMany({
            where: {
                unit: { property: { landlordId: userId } },
                ...(status && { status: status.toUpperCase().replace('-', '_') }),
                ...(priority && { priority: priority.toUpperCase() }),
            },
            include: {
                unit: { include: { property: true } },
                tenant: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ success: true, data: requests });
    } catch (error) {
        console.error('Error fetching maintenance requests:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch maintenance requests' }, { status: 500 });
    }
}

// POST /api/maintenance - Create a new maintenance request
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as { id?: string }).id;
        const body = await request.json();
        const { unitId, tenantId, title, description, category, priority } = body;

        if (!unitId || !title || !category) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        // Verify unit ownership
        const unit = await prisma.unit.findFirst({
            where: { id: unitId, property: { landlordId: userId } },
            include: { property: { include: { landlord: true } } },
        });
        if (!unit) {
            return NextResponse.json({ success: false, error: 'Unit not found' }, { status: 404 });
        }

        // Get tenant ID if not provided - use active lease tenant
        let resolvedTenantId = tenantId;
        if (!resolvedTenantId) {
            const activeLease = await prisma.lease.findFirst({
                where: { unitId, status: 'ACTIVE' },
            });
            if (activeLease) {
                resolvedTenantId = activeLease.tenantId;
            }
        }

        if (!resolvedTenantId) {
            return NextResponse.json({ success: false, error: 'No tenant found for this unit' }, { status: 400 });
        }

        const maintenanceRequest = await prisma.maintenanceRequest.create({
            data: {
                unitId,
                tenantId: resolvedTenantId,
                title,
                description: description || '',
                category: category.toUpperCase(),
                priority: priority?.toUpperCase() || 'MEDIUM',
                status: 'SUBMITTED',
                attachments: '[]',
            },
        });

        // Send email notification to landlord
        const landlordEmail = unit.property.landlord?.email;
        if (landlordEmail) {
            const tenant = await prisma.tenant.findUnique({ where: { id: resolvedTenantId } });
            await notifications.sendEmail({
                to: landlordEmail,
                subject: `New Maintenance Request - ${title}`,
                html: `
                    <h1>New Maintenance Request</h1>
                    <p>A new maintenance request has been submitted:</p>
                    <table style="border-collapse: collapse; width: 100%;">
                        <tr><td style="padding: 8px; font-weight: bold;">Title:</td><td style="padding: 8px;">${title}</td></tr>
                        <tr><td style="padding: 8px; font-weight: bold;">Category:</td><td style="padding: 8px;">${category}</td></tr>
                        <tr><td style="padding: 8px; font-weight: bold;">Priority:</td><td style="padding: 8px;">${priority || 'MEDIUM'}</td></tr>
                        <tr><td style="padding: 8px; font-weight: bold;">Property:</td><td style="padding: 8px;">${unit.property.name}</td></tr>
                        <tr><td style="padding: 8px; font-weight: bold;">Unit:</td><td style="padding: 8px;">${unit.unitNumber}</td></tr>
                        <tr><td style="padding: 8px; font-weight: bold;">Tenant:</td><td style="padding: 8px;">${tenant?.fullName || 'Unknown'}</td></tr>
                        ${description ? `<tr><td style="padding: 8px; font-weight: bold;">Description:</td><td style="padding: 8px;">${description}</td></tr>` : ''}
                    </table>
                    <p style="margin-top: 16px;">Log in to RentPilot to review and respond to this request.</p>
                `,
            });
        }

        return NextResponse.json({ success: true, data: maintenanceRequest }, { status: 201 });
    } catch (error) {
        console.error('Error creating maintenance request:', error);
        return NextResponse.json({ success: false, error: 'Failed to create maintenance request' }, { status: 500 });
    }
}
