import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/utilities - List utility configurations
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const leaseId = searchParams.get('leaseId');
        const type = searchParams.get('type');

        // Get properties owned by landlord
        const landlordProperties = await prisma.property.findMany({
            where: { landlordId: session.user.id },
            select: { id: true },
        });
        const propertyIds = landlordProperties.map((p) => p.id);

        const where: Record<string, unknown> = {
            lease: {
                unit: {
                    propertyId: { in: propertyIds },
                },
            },
        };

        if (leaseId) where.leaseId = leaseId;
        if (type) where.type = type;

        const utilities = await prisma.utilityBilling.findMany({
            where,
            include: {
                lease: {
                    include: {
                        tenant: true,
                        unit: {
                            include: { property: true },
                        },
                    },
                },
                readings: {
                    orderBy: { month: 'desc' },
                    take: 6,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ success: true, data: utilities });
    } catch (error) {
        console.error('Error fetching utilities:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch utilities' },
            { status: 500 }
        );
    }
}

// POST /api/utilities - Create utility configuration
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { leaseId, type, billingMethod, fixedAmount, ratePerUnit } = body;

        if (!leaseId || !type || !billingMethod) {
            return NextResponse.json(
                { success: false, error: 'Lease, type, and billing method are required' },
                { status: 400 }
            );
        }

        // Verify lease ownership
        const lease = await prisma.lease.findFirst({
            where: {
                id: leaseId,
                unit: {
                    property: { landlordId: session.user.id },
                },
            },
        });

        if (!lease) {
            return NextResponse.json(
                { success: false, error: 'Lease not found or not authorized' },
                { status: 404 }
            );
        }

        const utility = await prisma.utilityBilling.create({
            data: {
                leaseId,
                type,
                billingMethod,
                fixedAmount: fixedAmount || null,
                ratePerUnit: ratePerUnit || null,
            },
            include: {
                lease: {
                    include: {
                        tenant: true,
                        unit: {
                            include: { property: true },
                        },
                    },
                },
            },
        });

        return NextResponse.json({ success: true, data: utility }, { status: 201 });
    } catch (error) {
        console.error('Error creating utility:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create utility' },
            { status: 500 }
        );
    }
}
