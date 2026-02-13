import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Helper to format date as YYYY-MM-DD
const formatDate = (date: Date) => date.toISOString().split('T')[0];

// Helper to get next month details
const getNextMonthDetails = () => {
    const now = new Date();
    // If run on 1st of month, generate for current month.
    // If run on 25th, generate for next month?
    // User requirement: "ensure new charges appear automatically on the 1st".
    // So if today is the 1st, we generate for this month.

    // Actually, usually rent is generated a few days *before* the 1st.
    // Let's assume this job runs on the 1st or shortly before.
    // For simplicity, let's generate for the *current* month if run today.
    // Or we can accept a `targetDate` param.

    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 1-12
    const monthString = `${year}-${String(month).padStart(2, '0')}`;

    return { year, month, monthString };
};

export async function GET(request: NextRequest) {
    try {
        // Verify Cron Secret to prevent unauthorized access
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            // For dev/testing, we might allow it if CRON_SECRET is not set or in dev mode
            if (process.env.NODE_ENV === 'production') {
                return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
            }
        }

        const { monthString } = getNextMonthDetails();

        // 1. Get all Active Leases
        const activeLeases = await prisma.lease.findMany({
            where: { status: 'ACTIVE' },
            include: {
                tenant: { select: { id: true, userId: true, fullName: true } },
                unit: { include: { property: { select: { id: true, name: true, landlordId: true } } } }
            }
        });

        let createdCount = 0;
        let skippedCount = 0;
        const errors: any[] = [];

        // 2. Iterate and Create Rent Charges
        for (const lease of activeLeases) {
            try {
                // Check if charge already exists for this month
                const existingCharge = await prisma.rentCharge.findFirst({
                    where: {
                        leaseId: lease.id,
                        month: monthString
                    }
                });

                if (existingCharge) {
                    skippedCount++;
                    continue;
                }

                // Calculate due date (e.g. 1st of the month)
                const dueDate = new Date(`${monthString}-${String(lease.dueDay).padStart(2, '0')}`);

                // Create Rent Charge
                const charge = await prisma.rentCharge.create({
                    data: {
                        leaseId: lease.id,
                        month: monthString,
                        amountDue: lease.rentAmount,
                        amountPaid: 0,
                        status: 'UNPAID',
                        dueDate: dueDate
                    }
                });

                createdCount++;

                // Notify Tenant
                if (lease.tenant) {
                    await prisma.notification.create({
                        data: {
                            userId: lease.tenant.userId,
                            type: 'RENT_DUE',
                            title: 'Rent Invoice Generated',
                            message: `Rent of R${lease.rentAmount.toLocaleString()} for ${monthString} has been generated. Due on ${dueDate.toLocaleDateString()}.`,
                            actionUrl: '/tenant'
                        }
                    });
                }

                // Notify Landlord (Summary could be better, but per-charge is okay for now)
                // Actually, spamming landlord for every unit is bad. 
                // Better to send a summary email at the end? 
                // For now, let's skip individual landlord notifications here to avoid spam.

            } catch (error) {
                console.error(`Error generating rent for lease ${lease.id}:`, error);
                errors.push({ leaseId: lease.id, error: String(error) });
            }
        }

        // Summary Notification for Landlords?
        // Group by Landlord and send one notification?
        // Complex for a simple cron endpoint. Let's keep it simple.

        return NextResponse.json({
            success: true,
            data: {
                month: monthString,
                processed: activeLeases.length,
                created: createdCount,
                skipped: skippedCount,
                errors
            }
        });

    } catch (error) {
        console.error('Rent generation cron failed:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
