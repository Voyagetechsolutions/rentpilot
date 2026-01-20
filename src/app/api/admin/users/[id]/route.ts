import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// PATCH /api/admin/users/[id] - Update user role
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userRole = (session.user as { role?: string }).role;
        if (userRole !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
        }

        const { id } = params;
        const body = await request.json();
        const { role, name, phone } = body;

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                ...(role && { role }),
                ...(name !== undefined && { name }),
                ...(phone !== undefined && { phone }),
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                phone: true,
            },
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: (session.user as { id: string }).id,
                action: 'USER_ROLE_CHANGED',
                entityType: 'User',
                entityId: id,
                details: JSON.stringify({ newRole: role }),
            },
        });

        return NextResponse.json({
            success: true,
            data: updatedUser,
        });
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 });
    }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userRole = (session.user as { role?: string }).role;
        const currentUserId = (session.user as { id: string }).id;

        if (userRole !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
        }

        const { id } = params;

        // Prevent self-deletion
        if (id === currentUserId) {
            return NextResponse.json({ success: false, error: 'Cannot delete your own account' }, { status: 400 });
        }

        // Get user info before deletion for logging
        const user = await prisma.user.findUnique({
            where: { id },
            select: { email: true, role: true },
        });

        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        // Delete user
        await prisma.user.delete({
            where: { id },
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: currentUserId,
                action: 'USER_DELETED',
                entityType: 'User',
                entityId: id,
                details: JSON.stringify({ email: user.email }),
            },
        });

        return NextResponse.json({
            success: true,
            message: 'User deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete user' }, { status: 500 });
    }
}
