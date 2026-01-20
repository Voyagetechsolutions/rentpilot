import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Fetch user settings
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get or create user settings
        let settings = await prisma.userSettings.findUnique({
            where: { userId: session.user.id }
        });

        if (!settings) {
            // Create default settings for the user
            const user = await prisma.user.findUnique({
                where: { id: session.user.id }
            });

            settings = await prisma.userSettings.create({
                data: {
                    userId: session.user.id,
                    firstName: user?.name?.split(' ')[0] || '',
                    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
                }
            });
        }

        // Include user email from session
        const response = {
            ...settings,
            email: session.user.email,
            phone: (await prisma.user.findUnique({ where: { id: session.user.id } }))?.phone || '',
        };

        return NextResponse.json({ success: true, data: response });
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch settings' },
            { status: 500 }
        );
    }
}

// PUT - Update user settings
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const {
            firstName,
            lastName,
            phone,
            notifyPaymentReceived,
            notifyRentOverdue,
            notifyMaintenanceRequest,
            notifyLeaseExpiring,
            organizationName,
            currency,
            timezone,
        } = body;

        // Update user settings (upsert)
        const settings = await prisma.userSettings.upsert({
            where: { userId: session.user.id },
            update: {
                firstName,
                lastName,
                notifyPaymentReceived,
                notifyRentOverdue,
                notifyMaintenanceRequest,
                notifyLeaseExpiring,
                organizationName,
                currency,
                timezone,
            },
            create: {
                userId: session.user.id,
                firstName,
                lastName,
                notifyPaymentReceived,
                notifyRentOverdue,
                notifyMaintenanceRequest,
                notifyLeaseExpiring,
                organizationName,
                currency,
                timezone,
            }
        });

        // Update phone on User model if provided
        if (phone !== undefined) {
            await prisma.user.update({
                where: { id: session.user.id },
                data: { phone }
            });
        }

        return NextResponse.json({ success: true, data: settings });
    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update settings' },
            { status: 500 }
        );
    }
}
