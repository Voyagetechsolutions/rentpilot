import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

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

        return NextResponse.json({ success: true, data: maintenanceRequest }, { status: 201 });
    } catch (error) {
        console.error('Error creating maintenance request:', error);
        return NextResponse.json({ success: false, error: 'Failed to create maintenance request' }, { status: 500 });
    }
}
