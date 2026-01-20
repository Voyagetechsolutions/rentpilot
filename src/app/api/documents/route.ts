import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// GET - Fetch documents
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
        const docType = searchParams.get('type') || '';

        // Get landlord's properties
        const properties = await prisma.property.findMany({
            where: { landlordId: session.user.id },
            select: { id: true }
        });

        const propertyIds = properties.map(p => p.id);

        // Fetch documents
        const documents = await prisma.document.findMany({
            where: {
                OR: [
                    { uploadedById: session.user.id },
                    { propertyId: { in: propertyIds } }
                ],
                ...(docType && { docType })
            },
            include: {
                property: { select: { name: true } },
                unit: { select: { unitNumber: true } },
                lease: { select: { id: true } },
                uploadedBy: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, data: documents });
    } catch (error) {
        console.error('Error fetching documents:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch documents' },
            { status: 500 }
        );
    }
}

// POST - Upload document
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const filename = formData.get('filename') as string;
        const docType = formData.get('docType') as string;
        const propertyId = formData.get('propertyId') as string | null;
        const unitId = formData.get('unitId') as string | null;
        const leaseId = formData.get('leaseId') as string | null;

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No file provided' },
                { status: 400 }
            );
        }

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadsDir, { recursive: true });

        // Generate unique filename
        const timestamp = Date.now();
        const ext = path.extname(file.name);
        const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueFilename = `${timestamp}_${safeFilename}${ext}`;
        const filePath = path.join(uploadsDir, uniqueFilename);

        // Write file to disk
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        // Create document record
        const document = await prisma.document.create({
            data: {
                filename: filename || file.name,
                fileUrl: `/uploads/${uniqueFilename}`,
                docType: docType || 'OTHER',
                propertyId: propertyId || null,
                unitId: unitId || null,
                leaseId: leaseId || null,
                uploadedById: session.user.id,
            },
            include: {
                property: { select: { name: true } },
                unit: { select: { unitNumber: true } },
            }
        });

        return NextResponse.json({ success: true, data: document });
    } catch (error) {
        console.error('Error uploading document:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to upload document' },
            { status: 500 }
        );
    }
}

// DELETE - Delete document
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Document ID required' },
                { status: 400 }
            );
        }

        // Verify ownership
        const document = await prisma.document.findFirst({
            where: {
                id,
                uploadedById: session.user.id
            }
        });

        if (!document) {
            return NextResponse.json(
                { success: false, error: 'Document not found or unauthorized' },
                { status: 404 }
            );
        }

        await prisma.document.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting document:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete document' },
            { status: 500 }
        );
    }
}
