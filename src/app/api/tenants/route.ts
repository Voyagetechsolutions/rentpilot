import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hash } from 'bcryptjs';

interface AcceptedInvitation {
    id: string;
    email: string;
    fullName: string;
    unitId: string;
    unit: {
        unitNumber: string;
        property: {
            id: string;
            name: string;
        };
    };
}

interface TenantWithInvitation {
    id: string;
    userId: string;
    fullName: string;
    phone: string;
    idNumber: string | null;
    createdAt: Date;
    updatedAt: Date;
    user: { email: string };
    leases: Array<{
        status: string;
        unit: { property: { id: string; name: string } };
    }>;
    pendingUnit?: {
        id: string;
        unitNumber: string;
        property: { name: string };
    } | null;
    invitationStatus?: string | null;
}

// GET /api/tenants - List all tenants for authenticated user's properties
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as { id?: string }).id;
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');

        // Get user's properties
        const userProperties = await prisma.property.findMany({
            where: { landlordId: userId },
            select: { id: true },
        });
        const propertyIds = userProperties.map(p => p.id);

        // Get tenants who have leases in user's properties
        const tenantsWithLeases = await prisma.tenant.findMany({
            where: {
                leases: {
                    some: {
                        unit: { propertyId: { in: propertyIds } },
                    },
                },
                ...(search && {
                    OR: [
                        { fullName: { contains: search } },
                        { phone: { contains: search } },
                    ],
                }),
            },
            include: {
                user: { select: { email: true } },
                leases: {
                    where: { status: 'ACTIVE' },
                    include: {
                        unit: { include: { property: true } },
                    },
                },
            },
        });

        // Get accepted invitations from this landlord
        const acceptedInvitations = await prisma.tenantInvitation.findMany({
            where: {
                landlordId: userId,
                status: 'ACCEPTED',
                ...(search && {
                    OR: [
                        { fullName: { contains: search } },
                        { email: { contains: search } },
                    ],
                }),
            },
            include: {
                unit: { include: { property: { select: { id: true, name: true } } } },
            },
        }) as AcceptedInvitation[];

        // Get tenant IDs that already have leases
        const tenantIdsWithLeases = new Set(tenantsWithLeases.map(t => t.id));

        // For accepted invitations, find the corresponding tenant profiles
        const invitedTenantEmails = acceptedInvitations.map(inv => inv.email);
        const invitedTenants = invitedTenantEmails.length > 0 ? await prisma.tenant.findMany({
            where: {
                user: { email: { in: invitedTenantEmails } },
                id: { notIn: Array.from(tenantIdsWithLeases) },
            },
            include: {
                user: { select: { email: true } },
                leases: {
                    where: { status: 'ACTIVE' },
                    include: {
                        unit: { include: { property: true } },
                    },
                },
            },
        }) : [];

        // Combine results, adding invitation info to invited tenants
        const invitationByEmail = new Map(
            acceptedInvitations.map(inv => [inv.email, inv])
        );

        const enrichedInvitedTenants: TenantWithInvitation[] = invitedTenants.map(tenant => {
            const invitation = invitationByEmail.get(tenant.user.email);
            return {
                ...tenant,
                pendingUnit: invitation ? {
                    id: invitation.unitId,
                    unitNumber: invitation.unit.unitNumber,
                    property: invitation.unit.property,
                } : null,
                invitationStatus: 'ACCEPTED',
            };
        });

        // Combine all tenants
        const allTenants: TenantWithInvitation[] = [
            ...tenantsWithLeases.map(t => ({ ...t, pendingUnit: null, invitationStatus: null })),
            ...enrichedInvitedTenants,
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return NextResponse.json({ success: true, data: allTenants });
    } catch (error) {
        console.error('Error fetching tenants:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch tenants' }, { status: 500 });
    }
}

// POST /api/tenants - Create a new tenant
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { email, fullName, phone, idNumber } = body;

        if (!email || !fullName || !phone) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ success: false, error: 'User with this email already exists' }, { status: 409 });
        }

        // Create user and tenant with a random password (tenant can reset)
        const hashedPassword = await hash(Math.random().toString(36).slice(-10), 12);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: 'TENANT',
                name: fullName,
                phone,
            },
        });

        const tenant = await prisma.tenant.create({
            data: {
                userId: user.id,
                fullName,
                phone,
                idNumber,
            },
        });

        return NextResponse.json({ success: true, data: tenant }, { status: 201 });
    } catch (error) {
        console.error('Error creating tenant:', error);
        return NextResponse.json({ success: false, error: 'Failed to create tenant' }, { status: 500 });
    }
}

// DELETE /api/tenants?id=xxx - Remove a tenant (end lease, vacate unit, delete tenant)
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as { id?: string }).id;
        const { searchParams } = new URL(request.url);
        const tenantId = searchParams.get('id');

        if (!tenantId) {
            return NextResponse.json({ success: false, error: 'Tenant ID is required' }, { status: 400 });
        }

        // Fetch tenant with leases to verify landlord ownership
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: {
                user: true,
                leases: {
                    include: {
                        unit: { include: { property: true } },
                    },
                },
            },
        });

        if (!tenant) {
            return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
        }

        // Verify that this landlord owns at least one property the tenant is linked to
        const landlordLeases = tenant.leases.filter(
            (l) => l.unit.property.landlordId === userId
        );

        if (landlordLeases.length === 0) {
            // Also check invitations
            const invitation = await prisma.tenantInvitation.findFirst({
                where: {
                    email: tenant.user.email,
                    landlordId: userId,
                },
            });
            if (!invitation) {
                return NextResponse.json({ success: false, error: 'Unauthorized - tenant not linked to your properties' }, { status: 403 });
            }
        }

        // 1. End all active leases for this tenant on landlord's properties
        const activeLeases = landlordLeases.filter((l) => l.status === 'ACTIVE');
        for (const lease of activeLeases) {
            await prisma.lease.update({
                where: { id: lease.id },
                data: { status: 'TERMINATED' },
            });

            // 2. Set unit back to VACANT
            await prisma.unit.update({
                where: { id: lease.unitId },
                data: { status: 'VACANT' },
            });
        }

        // 3. Cancel any pending invitations for this tenant from this landlord
        await prisma.tenantInvitation.updateMany({
            where: {
                email: tenant.user.email,
                landlordId: userId,
                status: 'PENDING',
            },
            data: { status: 'CANCELLED' },
        });

        // 4. Delete tenant record (cascades to payments, maintenance requests, etc.)
        await prisma.tenant.delete({
            where: { id: tenantId },
        });

        // 5. Delete the linked User record if they are a TENANT-only user
        if (tenant.user.role === 'TENANT') {
            await prisma.user.delete({
                where: { id: tenant.userId },
            });
        }

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId,
                action: 'TENANT_REMOVED',
                entityType: 'Tenant',
                entityId: tenantId,
                details: JSON.stringify({
                    tenantName: tenant.fullName,
                    leasesTerminated: activeLeases.length,
                }),
            },
        });

        return NextResponse.json({
            success: true,
            message: `Tenant ${tenant.fullName} has been removed. ${activeLeases.length} lease(s) terminated, unit(s) set to vacant.`,
        });

    } catch (error) {
        console.error('Error removing tenant:', error);
        return NextResponse.json({ success: false, error: 'Failed to remove tenant' }, { status: 500 });
    }
}

