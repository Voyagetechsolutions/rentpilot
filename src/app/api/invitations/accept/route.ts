import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// POST /api/invitations/accept - Accept an invitation and create tenant account
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token, password } = body;

        if (!token || !password) {
            return NextResponse.json({
                success: false,
                error: 'Token and password are required'
            }, { status: 400 });
        }

        if (password.length < 8) {
            return NextResponse.json({
                success: false,
                error: 'Password must be at least 8 characters'
            }, { status: 400 });
        }

        // Find the invitation
        const invitation = await prisma.tenantInvitation.findUnique({
            where: { token },
            include: {
                unit: {
                    include: {
                        property: true
                    }
                }
            }
        });

        if (!invitation) {
            return NextResponse.json({
                success: false,
                error: 'Invitation not found'
            }, { status: 404 });
        }

        if (invitation.status !== 'PENDING') {
            return NextResponse.json({
                success: false,
                error: `Invitation has already been ${invitation.status.toLowerCase()}`
            }, { status: 400 });
        }

        if (new Date() > invitation.expiresAt) {
            // Mark as expired
            await prisma.tenantInvitation.update({
                where: { id: invitation.id },
                data: { status: 'EXPIRED' }
            });

            return NextResponse.json({
                success: false,
                error: 'Invitation has expired. Please ask the landlord to send a new invitation.'
            }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: invitation.email }
        });

        let user;
        let tenant;

        if (existingUser) {
            // User exists - check if they already have a tenant profile
            const existingTenant = await prisma.tenant.findUnique({
                where: { userId: existingUser.id }
            });

            if (existingTenant) {
                tenant = existingTenant;
            } else {
                // Create tenant profile for existing user
                tenant = await prisma.tenant.create({
                    data: {
                        userId: existingUser.id,
                        fullName: invitation.fullName,
                        phone: invitation.phone || '',
                    }
                });
            }
            user = existingUser;
        } else {
            // Create new user and tenant profile
            const hashedPassword = await bcrypt.hash(password, 12);

            user = await prisma.user.create({
                data: {
                    email: invitation.email,
                    password: hashedPassword,
                    name: invitation.fullName,
                    phone: invitation.phone,
                    role: 'TENANT',
                }
            });

            tenant = await prisma.tenant.create({
                data: {
                    userId: user.id,
                    fullName: invitation.fullName,
                    phone: invitation.phone || '',
                }
            });
        }

        // Mark invitation as accepted
        await prisma.tenantInvitation.update({
            where: { id: invitation.id },
            data: {
                status: 'ACCEPTED',
                acceptedAt: new Date(),
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                message: 'Invitation accepted! You can now log in.',
                email: invitation.email,
                unit: invitation.unit.unitNumber,
                property: invitation.unit.property.name,
                tenantId: tenant.id,
            }
        });
    } catch (error) {
        console.error('Error accepting invitation:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to accept invitation'
        }, { status: 500 });
    }
}

// GET /api/invitations/accept - Get invitation details by token
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({
                success: false,
                error: 'Token is required'
            }, { status: 400 });
        }

        const invitation = await prisma.tenantInvitation.findUnique({
            where: { token },
            select: {
                id: true,
                email: true,
                fullName: true,
                status: true,
                expiresAt: true,
                unit: {
                    select: {
                        unitNumber: true,
                        rentAmount: true,
                        property: {
                            select: {
                                name: true,
                                address: true,
                                city: true,
                            }
                        }
                    }
                }
            }
        });

        if (!invitation) {
            return NextResponse.json({
                success: false,
                error: 'Invitation not found'
            }, { status: 404 });
        }

        // Check if expired
        const isExpired = new Date() > invitation.expiresAt;

        return NextResponse.json({
            success: true,
            data: {
                ...invitation,
                isExpired,
                isValid: invitation.status === 'PENDING' && !isExpired,
            }
        });
    } catch (error) {
        console.error('Error fetching invitation:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch invitation'
        }, { status: 500 });
    }
}
