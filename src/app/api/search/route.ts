import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/search?q=query - Global search across tenants, units, leases, payments, maintenance
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q')?.trim();

        if (!query || query.length < 2) {
            return NextResponse.json({ success: true, data: { tenants: [], units: [], leases: [], payments: [], maintenance: [] } });
        }

        const userId = session.user.id;

        // Get landlord's property IDs for scoping
        const landlordProperties = await prisma.property.findMany({
            where: { landlordId: userId },
            select: { id: true },
        });
        const propertyIds = landlordProperties.map((p) => p.id);

        // Search tenants
        const tenants = await prisma.tenant.findMany({
            where: {
                leases: {
                    some: {
                        unit: { propertyId: { in: propertyIds } },
                    },
                },
                OR: [
                    { fullName: { contains: query, mode: 'insensitive' } },
                    { phone: { contains: query, mode: 'insensitive' } },
                    { idNumber: { contains: query, mode: 'insensitive' } },
                    { user: { email: { contains: query, mode: 'insensitive' } } },
                ],
            },
            select: {
                id: true,
                fullName: true,
                phone: true,
                user: { select: { email: true } },
            },
            take: 5,
        });

        // Search units
        const units = await prisma.unit.findMany({
            where: {
                propertyId: { in: propertyIds },
                OR: [
                    { unitNumber: { contains: query, mode: 'insensitive' } },
                    { property: { name: { contains: query, mode: 'insensitive' } } },
                ],
            },
            select: {
                id: true,
                unitNumber: true,
                status: true,
                property: { select: { name: true } },
            },
            take: 5,
        });

        // Search leases
        const leases = await prisma.lease.findMany({
            where: {
                unit: { propertyId: { in: propertyIds } },
                OR: [
                    { tenant: { fullName: { contains: query, mode: 'insensitive' } } },
                    { unit: { unitNumber: { contains: query, mode: 'insensitive' } } },
                ],
            },
            select: {
                id: true,
                status: true,
                rentAmount: true,
                tenant: { select: { fullName: true } },
                unit: { select: { unitNumber: true, property: { select: { name: true } } } },
            },
            take: 5,
        });

        // Search payments (by reference)
        const payments = await prisma.payment.findMany({
            where: {
                lease: { unit: { property: { landlordId: userId } } },
                OR: [
                    { reference: { contains: query, mode: 'insensitive' } },
                    { tenant: { fullName: { contains: query, mode: 'insensitive' } } },
                ],
            },
            select: {
                id: true,
                amount: true,
                reference: true,
                datePaid: true,
                tenant: { select: { fullName: true } },
            },
            take: 5,
        });

        // Search maintenance tickets
        const maintenance = await prisma.maintenanceRequest.findMany({
            where: {
                unit: { propertyId: { in: propertyIds } },
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } },
                ],
            },
            select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                unit: { select: { unitNumber: true, property: { select: { name: true } } } },
            },
            take: 5,
        });

        return NextResponse.json({
            success: true,
            data: { tenants, units, leases, payments, maintenance },
        });
    } catch (error) {
        console.error('Error performing search:', error);
        return NextResponse.json(
            { success: false, error: 'Search failed' },
            { status: 500 }
        );
    }
}
