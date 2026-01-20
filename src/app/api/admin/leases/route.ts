import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/admin/leases - Get all leases
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
        const status = searchParams.get('status') || '';

        const where: Record<string, unknown> = {};

        if (search) {
            where.OR = [
                { tenant: { fullName: { contains: search } } },
                { tenant: { email: { contains: search } } },
                { unit: { property: { name: { contains: search } } } },
            ];
        }

        if (status) {
            where.status = status;
        }

        const [leases, total] = await Promise.all([
            prisma.lease.findMany({
                where,
                include: {
                    tenant: {
                        select: { fullName: true, email: true },
                    },
                    unit: {
                        select: {
                            unitNumber: true,
                            property: {
                                select: {
                                    name: true,
                                    landlord: {
                                        select: { name: true, email: true },
                                    },
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.lease.count({ where }),
        ]);

        return NextResponse.json({
            success: true,
            data: {
                leases,
                total,
                page,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching leases:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch leases' }, { status: 500 });
    }
}
