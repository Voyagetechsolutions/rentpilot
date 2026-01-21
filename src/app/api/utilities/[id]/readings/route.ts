import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/utilities/[id]/readings - Add meter reading
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { month, previousReading, currentReading, unitsUsed, totalCharge, photoProof, notes } = body;

        // Verify utility ownership
        const utility = await prisma.utilityBilling.findFirst({
            where: {
                id: params.id,
                lease: {
                    unit: {
                        property: { landlordId: session.user.id },
                    },
                },
            },
        });

        if (!utility) {
            return NextResponse.json(
                { success: false, error: 'Utility not found or not authorized' },
                { status: 404 }
            );
        }

        const reading = await prisma.meterReading.create({
            data: {
                utilityBillingId: params.id,
                month,
                previousReading,
                currentReading,
                unitsUsed,
                totalCharge,
                photoProof: photoProof || null,
                notes: notes || null,
            },
        });

        return NextResponse.json({ success: true, data: reading }, { status: 201 });
    } catch (error) {
        console.error('Error creating reading:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create reading' },
            { status: 500 }
        );
    }
}
