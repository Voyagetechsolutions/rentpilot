import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/tenant/maintenance - Get tenant's maintenance requests
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as { id?: string }).id;

        const tenant = await prisma.tenant.findUnique({
            where: { userId },
            select: { id: true }
        });

        if (!tenant) {
            return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
        }

        const requests = await prisma.maintenanceRequest.findMany({
            where: { tenantId: tenant.id },
            include: {
                unit: {
                    select: { unitNumber: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, data: requests });
    } catch (error) {
        console.error('Error fetching maintenance:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch requests' }, { status: 500 });
    }
}

// POST /api/tenant/maintenance - Create a new maintenance request
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as { id?: string }).id;

        const tenant = await prisma.tenant.findUnique({
            where: { userId },
            include: {
                leases: {
                    where: { status: 'ACTIVE' },
                    select: { unitId: true }
                }
            }
        });

        if (!tenant) {
            return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
        }

        if (tenant.leases.length === 0) {
            return NextResponse.json({ success: false, error: 'No active lease found' }, { status: 400 });
        }

        const body = await request.json();
        const { title, description, category, priority } = body;

        if (!title || !description) {
            return NextResponse.json({ success: false, error: 'Title and description required' }, { status: 400 });
        }

        const maintenanceRequest = await prisma.maintenanceRequest.create({
            data: {
                tenantId: tenant.id,
                unitId: tenant.leases[0].unitId,
                title,
                description,
                category: category || 'OTHER',
                priority: priority || 'MEDIUM',
                status: 'SUBMITTED',
            }
        });

        return NextResponse.json({ success: true, data: maintenanceRequest }, { status: 201 });
    } catch (error) {
        console.error('Error creating maintenance request:', error);
        return NextResponse.json({ success: false, error: 'Failed to create request' }, { status: 500 });
    }
}
