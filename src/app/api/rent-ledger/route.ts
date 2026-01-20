import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Fetch rent charges
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const month = searchParams.get('month') || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        const status = searchParams.get('status') || '';

        // Get landlord's properties and units
        const properties = await prisma.property.findMany({
            where: { landlordId: session.user.id },
            include: { units: true }
        });

        const unitIds = properties.flatMap(p => p.units.map(u => u.id));

        // Get active leases for these units
        const leases = await prisma.lease.findMany({
            where: { unitId: { in: unitIds } },
            select: { id: true }
        });

        const leaseIds = leases.map(l => l.id);

        // Fetch rent charges
        const rentCharges = await prisma.rentCharge.findMany({
            where: {
                leaseId: { in: leaseIds },
                month,
                ...(status && { status: status.toUpperCase() })
            },
            include: {
                lease: {
                    include: {
                        tenant: { select: { fullName: true } },
                        unit: {
                            select: {
                                unitNumber: true,
                                property: { select: { name: true } }
                            }
                        }
                    }
                }
            },
            orderBy: { dueDate: 'asc' }
        });

        // Calculate summaries
        const totalDue = rentCharges.reduce((sum, r) => sum + r.amountDue, 0);
        const totalCollected = rentCharges.reduce((sum, r) => sum + r.amountPaid, 0);
        const outstanding = totalDue - totalCollected;

        return NextResponse.json({
            success: true,
            data: {
                rentCharges,
                summary: {
                    totalDue,
                    totalCollected,
                    outstanding
                }
            }
        });
    } catch (error) {
        console.error('Error fetching rent ledger:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch rent ledger' },
            { status: 500 }
        );
    }
}

// POST - Log a payment against rent charges
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { rentChargeId, amount, method, reference } = body;

        if (!rentChargeId || !amount || !method) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get rent charge and validate
        const rentCharge = await prisma.rentCharge.findUnique({
            where: { id: rentChargeId },
            include: { lease: true }
        });

        if (!rentCharge) {
            return NextResponse.json(
                { success: false, error: 'Rent charge not found' },
                { status: 404 }
            );
        }

        // Create payment
        const payment = await prisma.payment.create({
            data: {
                tenantId: rentCharge.lease.tenantId,
                leaseId: rentCharge.leaseId,
                amount,
                method,
                datePaid: new Date(),
                reference,
            }
        });

        // Create payment allocation
        await prisma.paymentAllocation.create({
            data: {
                paymentId: payment.id,
                rentChargeId,
                amount
            }
        });

        // Update rent charge
        const newAmountPaid = rentCharge.amountPaid + amount;
        const newStatus = newAmountPaid >= rentCharge.amountDue ? 'PAID' :
            newAmountPaid > 0 ? 'PARTIAL' : rentCharge.status;

        await prisma.rentCharge.update({
            where: { id: rentChargeId },
            data: {
                amountPaid: newAmountPaid,
                status: newStatus
            }
        });

        return NextResponse.json({ success: true, data: payment });
    } catch (error) {
        console.error('Error logging payment:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to log payment' },
            { status: 500 }
        );
    }
}
