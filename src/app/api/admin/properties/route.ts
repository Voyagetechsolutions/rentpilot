import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/admin/properties - Get all properties
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userRole = (session.user as { role?: string }).role;
        if (userRole !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';

        const where: Record<string, unknown> = {};

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { address: { contains: search } },
                { city: { contains: search } },
                { landlord: { email: { contains: search } } },
                { landlord: { name: { contains: search } } },
            ];
        }

        const [properties, total] = await Promise.all([
            prisma.property.findMany({
                where,
                include: {
                    landlord: {
                        select: { name: true, email: true },
                    },
                    _count: {
                        select: { units: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.property.count({ where }),
        ]);

        return NextResponse.json({
            success: true,
            data: {
                properties,
                total,
                page,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching properties:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch properties' }, { status: 500 });
    }
}
