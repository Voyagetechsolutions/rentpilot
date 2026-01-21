import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/notifications - List user's notifications
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const unreadOnly = searchParams.get('unread') === 'true';
        const limit = parseInt(searchParams.get('limit') || '50');

        const where: Record<string, unknown> = {
            userId: session.user.id,
        };

        if (unreadOnly) {
            where.isRead = false;
        }

        const notifications = await prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        // Get unread count
        const unreadCount = await prisma.notification.count({
            where: {
                userId: session.user.id,
                isRead: false,
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                notifications,
                unreadCount,
            },
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch notifications' },
            { status: 500 }
        );
    }
}

// POST /api/notifications - Create notification (internal use)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, type, title, message, actionUrl } = body;

        if (!userId || !type || !title || !message) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const notification = await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                actionUrl: actionUrl || null,
            },
        });

        return NextResponse.json({ success: true, data: notification }, { status: 201 });
    } catch (error) {
        console.error('Error creating notification:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create notification' },
            { status: 500 }
        );
    }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { notificationIds, markAllRead } = body;

        if (markAllRead) {
            await prisma.notification.updateMany({
                where: {
                    userId: session.user.id,
                    isRead: false,
                },
                data: { isRead: true },
            });
        } else if (notificationIds && Array.isArray(notificationIds)) {
            await prisma.notification.updateMany({
                where: {
                    id: { in: notificationIds },
                    userId: session.user.id,
                },
                data: { isRead: true },
            });
        }

        return NextResponse.json({ success: true, message: 'Notifications marked as read' });
    } catch (error) {
        console.error('Error updating notifications:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update notifications' },
            { status: 500 }
        );
    }
}
