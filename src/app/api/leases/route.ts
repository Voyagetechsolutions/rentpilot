import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/leases - List all leases for authenticated user's properties
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as { id?: string }).id;
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const leases = await prisma.lease.findMany({
            where: {
                unit: { property: { landlordId: userId } },
                ...(status && { status: status.toUpperCase() }),
            },
            include: {
                tenant: true,
                unit: { include: { property: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ success: true, data: leases });
    } catch (error) {
        console.error('Error fetching leases:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch leases' }, { status: 500 });
    }
}

// POST /api/leases - Create a new lease
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as { id?: string }).id;
        const body = await request.json();
        const { tenantId, unitId, rentAmount, deposit, startDate, endDate, dueDay } = body;

        if (!tenantId || !unitId || !rentAmount || !startDate || !endDate) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        // Verify unit ownership
        const unit = await prisma.unit.findFirst({
            where: { id: unitId, property: { landlordId: userId } },
        });
        if (!unit) {
            return NextResponse.json({ success: false, error: 'Unit not found' }, { status: 404 });
        }

        const lease = await prisma.lease.create({
            data: {
                tenantId,
                unitId,
                rentAmount,
                deposit: deposit || 0,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                dueDay: dueDay || 1,
                status: 'ACTIVE',
            },
        });

        // Update unit status to OCCUPIED
        await prisma.unit.update({
            where: { id: unitId },
            data: { status: 'OCCUPIED' },
        });

        return NextResponse.json({ success: true, data: lease }, { status: 201 });
    } catch (error) {
        console.error('Error creating lease:', error);
        return NextResponse.json({ success: false, error: 'Failed to create lease' }, { status: 500 });
    }
}
