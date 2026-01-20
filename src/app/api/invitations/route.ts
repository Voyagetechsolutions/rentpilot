import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/invitations - List all invitations for landlord
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as { id?: string }).id;
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const invitations = await prisma.tenantInvitation.findMany({
            where: {
                landlordId: userId,
                ...(status && { status: status.toUpperCase() }),
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                status: true,
                token: true,
                expiresAt: true,
                acceptedAt: true,
                createdAt: true,
                unit: {
                    select: {
                        id: true,
                        unitNumber: true,
                        property: {
                            select: {
                                id: true,
                                name: true,
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, data: invitations });
    } catch (error) {
        console.error('Error fetching invitations:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch invitations' }, { status: 500 });
    }
}

// POST /api/invitations - Create a new invitation
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as { id?: string }).id;
        const body = await request.json();
        const { email, fullName, phone, unitId } = body;

        if (!email || !fullName || !unitId) {
            return NextResponse.json({ success: false, error: 'Email, full name, and unit are required' }, { status: 400 });
        }

        // Verify unit ownership
        const unit = await prisma.unit.findFirst({
            where: {
                id: unitId,
                property: { landlordId: userId }
            }
        });

        if (!unit) {
            return NextResponse.json({ success: false, error: 'Unit not found' }, { status: 404 });
        }

        // Check for existing pending invitation
        const existingInvitation = await prisma.tenantInvitation.findFirst({
            where: {
                email,
                unitId,
                status: 'PENDING',
                expiresAt: { gt: new Date() }
            }
        });

        if (existingInvitation) {
            return NextResponse.json({
                success: false,
                error: 'An active invitation already exists for this email and unit'
            }, { status: 400 });
        }

        // Create invitation (expires in 7 days)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const invitation = await prisma.tenantInvitation.create({
            data: {
                email,
                fullName,
                phone,
                unitId,
                landlordId: userId!,
                expiresAt,
            },
            include: {
                unit: {
                    include: {
                        property: true
                    }
                }
            }
        });

        // Generate invitation link (remove trailing slash to avoid double slashes)
        const baseUrl = (process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/+$/, '');
        const invitationLink = `${baseUrl}/invite/${invitation.token}`;

        return NextResponse.json({
            success: true,
            data: {
                ...invitation,
                invitationLink,
            }
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating invitation:', error);
        return NextResponse.json({ success: false, error: 'Failed to create invitation' }, { status: 500 });
    }
}

// DELETE /api/invitations - Cancel an invitation
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as { id?: string }).id;
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: 'Invitation ID required' }, { status: 400 });
        }

        // Verify ownership
        const invitation = await prisma.tenantInvitation.findFirst({
            where: { id, landlordId: userId }
        });

        if (!invitation) {
            return NextResponse.json({ success: false, error: 'Invitation not found' }, { status: 404 });
        }

        await prisma.tenantInvitation.update({
            where: { id },
            data: { status: 'CANCELLED' }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error cancelling invitation:', error);
        return NextResponse.json({ success: false, error: 'Failed to cancel invitation' }, { status: 500 });
    }
}
