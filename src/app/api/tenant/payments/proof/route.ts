import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        // Get tenant profile
        const tenant = await prisma.tenant.findUnique({
            where: { userId },
            include: {
                leases: {
                    where: { status: 'ACTIVE' },
                    include: {
                        unit: {
                            include: {
                                property: true
                            }
                        }
                    }
                }
            }
        });

        if (!tenant) {
            return NextResponse.json(
                { success: false, error: 'Tenant profile not found' },
                { status: 404 }
            );
        }

        const activeLease = tenant.leases[0];
        if (!activeLease) {
            return NextResponse.json(
                { success: false, error: 'No active lease found' },
                { status: 400 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const amount = parseFloat(formData.get('amount') as string);
        const reference = formData.get('reference') as string || `PROOF-${Date.now()}`;
        const month = formData.get('month') as string; // Optional, for context

        if (!file || !amount) {
            return NextResponse.json(
                { success: false, error: 'File and amount are required' },
                { status: 400 }
            );
        }

        // Validate File Size (Max 5MB)
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
        if (file.size > MAX_SIZE) {
            return NextResponse.json(
                { success: false, error: 'File size exceeds 5MB limit' },
                { status: 400 }
            );
        }

        // Validate File Type
        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { success: false, error: 'Invalid file type. Only JPEG, PNG and PDF are allowed.' },
                { status: 400 }
            );
        }

        // 1. Save File
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadsDir, { recursive: true });

        const timestamp = Date.now();
        const ext = path.extname(file.name);
        const safeFilename = `proof_${tenant.id}_${timestamp}${ext}`;
        const filePath = path.join(uploadsDir, safeFilename);

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        const fileUrl = `/uploads/${safeFilename}`;

        // 2. Create Document
        const document = await prisma.document.create({
            data: {
                filename: `Proof of Payment - ${month || new Date().toISOString().slice(0, 7)}`,
                fileUrl: fileUrl,
                docType: 'RECEIPT',
                propertyId: activeLease.unit.propertyId,
                unitId: activeLease.unitId,
                leaseId: activeLease.id,
                uploadedById: userId,
            }
        });

        // 3. Create TransactionLedger Entry (Pending)
        // We use TransactionLedger because it supports status 'PENDING'
        // and doesn't prematurely mark RentCharge as paid.
        const ledger = await prisma.transactionLedger.create({
            data: {
                tenantId: tenant.id,
                landlordId: activeLease.unit.property.landlordId,
                propertyId: activeLease.unit.propertyId,
                leaseId: activeLease.id,
                amount: amount,
                netAmount: amount, // No platform fee for manual EFT
                paymentMethod: 'BANK_TRANSFER',
                status: 'PENDING',
                reference: reference, // Unique constraint might be an issue if user re-uses ref?
                // Append timestamp to ref if needed to ensure uniqueness? 
                // Using the provided reference. If duplicate, it will fail.
                // Could wrap in try/catch for unique constraint.
            }
        });

        // Store link between Ledger and Document?
        // Schema doesn't have direct link.
        // We can update the Document to point to ... wait, Document -> Lease.
        // Ledger -> Payment/OnlinePayment.
        // There is no direct link field. 
        // We will rely on searching by timestamp or manual correlation for now.
        // Or store documentId in details JSON of Ledger?
        // TransactionLedger doesn't have details field in schema (lines 278-294).
        // It has `paymentId` and `onlinePaymentId`.

        // Activity Log
        await prisma.activityLog.create({
            data: {
                userId: userId,
                action: 'PAYMENT_PROOF_UPLOADED',
                entityType: 'TransactionLedger',
                entityId: ledger.id,
                details: JSON.stringify({ documentId: document.id, amount, fileUrl })
            }
        });

        return NextResponse.json({ success: true, data: { ledger, document } });

    } catch (error) {
        console.error('Error uploading proof of payment:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to upload proof of payment' },
            { status: 500 }
        );
    }
}
