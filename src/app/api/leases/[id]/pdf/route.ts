import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { jsPDF } from 'jspdf';

// GET /api/leases/[id]/pdf - Generate and download lease agreement PDF
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as { id?: string }).id;
        const userRole = (session.user as { role?: string }).role;
        const { id } = params;

        // Fetch lease with all related data
        const lease = await prisma.lease.findUnique({
            where: { id },
            include: {
                tenant: { include: { user: true } },
                unit: { include: { property: { include: { landlord: true } } } },
            },
        });

        if (!lease) {
            return NextResponse.json({ success: false, error: 'Lease not found' }, { status: 404 });
        }

        // Authorization: landlord of the property OR the tenant on the lease
        const isLandlord = lease.unit.property.landlordId === userId;
        const isTenant = lease.tenant.userId === userId;
        const isAdmin = userRole === 'ADMIN';

        if (!isLandlord && !isTenant && !isAdmin) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
        }

        // Generate PDF
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        const contentWidth = pageWidth - margin * 2;
        let y = 20;

        // Helper functions
        const addCenteredText = (text: string, fontSize: number, style: 'normal' | 'bold' = 'normal') => {
            doc.setFontSize(fontSize);
            doc.setFont('helvetica', style);
            doc.text(text, pageWidth / 2, y, { align: 'center' });
            y += fontSize * 0.5 + 2;
        };

        const addText = (text: string, fontSize: number = 10, style: 'normal' | 'bold' = 'normal') => {
            doc.setFontSize(fontSize);
            doc.setFont('helvetica', style);
            const lines = doc.splitTextToSize(text, contentWidth);
            doc.text(lines, margin, y);
            y += lines.length * (fontSize * 0.4 + 1.5);
        };

        const addSectionTitle = (title: string) => {
            y += 6;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(title, margin, y);
            y += 3;
            doc.setLineWidth(0.5);
            doc.line(margin, y, pageWidth - margin, y);
            y += 8;
        };

        const addFieldRow = (label: string, value: string) => {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(label, margin, y);
            doc.setFont('helvetica', 'normal');
            doc.text(value, margin + 55, y);
            y += 7;
        };

        const checkPageBreak = (requiredSpace: number = 30) => {
            if (y + requiredSpace > doc.internal.pageSize.getHeight() - 20) {
                doc.addPage();
                y = 20;
            }
        };

        // Format dates
        const startDate = new Date(lease.startDate).toLocaleDateString('en-ZA', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        const endDate = new Date(lease.endDate).toLocaleDateString('en-ZA', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        const generatedDate = new Date().toLocaleDateString('en-ZA', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        // === HEADER ===
        addCenteredText('RESIDENTIAL LEASE AGREEMENT', 18, 'bold');
        y += 4;
        addCenteredText('RentPilot Property Management', 10);
        y += 2;
        doc.setLineWidth(1);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;

        // === PARTIES ===
        addSectionTitle('1. PARTIES');
        addText('This Residential Lease Agreement ("Agreement") is entered into between:', 10);
        y += 4;

        addFieldRow('LANDLORD:', lease.unit.property.landlord.name || lease.unit.property.landlord.email);
        addFieldRow('Email:', lease.unit.property.landlord.email);
        if (lease.unit.property.landlord.phone) {
            addFieldRow('Phone:', lease.unit.property.landlord.phone);
        }
        y += 4;

        addFieldRow('TENANT:', lease.tenant.fullName);
        addFieldRow('Email:', lease.tenant.user.email);
        addFieldRow('Phone:', lease.tenant.phone);
        if (lease.tenant.idNumber) {
            addFieldRow('ID Number:', lease.tenant.idNumber);
        }

        // === PROPERTY ===
        checkPageBreak();
        addSectionTitle('2. PREMISES');
        addFieldRow('Property:', lease.unit.property.name);
        addFieldRow('Address:', lease.unit.property.address);
        addFieldRow('City:', lease.unit.property.city);
        addFieldRow('Country:', lease.unit.property.country);
        addFieldRow('Unit Number:', lease.unit.unitNumber);
        addFieldRow('Bedrooms:', String(lease.unit.bedrooms));
        addFieldRow('Bathrooms:', String(lease.unit.bathrooms));

        // === LEASE TERM ===
        checkPageBreak();
        addSectionTitle('3. LEASE TERM');
        addFieldRow('Start Date:', startDate);
        addFieldRow('End Date:', endDate);
        addFieldRow('Notice Period:', `${lease.noticePeriodDays} days`);

        // === RENT ===
        checkPageBreak();
        addSectionTitle('4. RENT');
        addFieldRow('Monthly Rent:', `R ${lease.rentAmount.toLocaleString('en-ZA')}`);
        addFieldRow('Due Day:', `${lease.dueDay}th of each month`);
        if (lease.escalationRate) {
            addFieldRow('Annual Escalation:', `${lease.escalationRate}%`);
            if (lease.escalationDate) {
                addFieldRow('Escalation Date:', new Date(lease.escalationDate).toLocaleDateString('en-ZA', {
                    year: 'numeric', month: 'long', day: 'numeric'
                }));
            }
        }

        // === DEPOSIT ===
        checkPageBreak();
        addSectionTitle('5. SECURITY DEPOSIT');
        addFieldRow('Deposit Amount:', `R ${lease.deposit.toLocaleString('en-ZA')}`);
        addText('The deposit shall be held in an interest-bearing account as required by the Rental Housing Act. The deposit, together with accrued interest, shall be refunded to the tenant within 14 days of the termination of this lease, less any lawful deductions.', 10);

        // === AMENITIES ===
        checkPageBreak();
        addSectionTitle('6. AMENITIES & INCLUSIONS');
        addFieldRow('Pets Allowed:', lease.petsAllowed ? 'Yes' : 'No');
        addFieldRow('Parking Included:', lease.parkingIncluded ? 'Yes' : 'No');

        // === SPECIAL CLAUSES ===
        if (lease.specialClauses) {
            checkPageBreak();
            addSectionTitle('7. SPECIAL CLAUSES');
            try {
                const clauses = JSON.parse(lease.specialClauses) as string[];
                clauses.forEach((clause: string, index: number) => {
                    checkPageBreak();
                    addText(`${index + 1}. ${clause}`, 10);
                    y += 2;
                });
            } catch {
                addText(lease.specialClauses, 10);
            }
        }

        // === GENERAL TERMS ===
        checkPageBreak(60);
        addSectionTitle(lease.specialClauses ? '8. GENERAL TERMS' : '7. GENERAL TERMS');
        const terms = [
            'The Tenant shall use the premises solely for residential purposes.',
            'The Tenant shall not sub-let the premises or any part thereof without the prior written consent of the Landlord.',
            'The Tenant shall be responsible for keeping the premises in a clean and habitable condition.',
            'The Tenant shall promptly report any maintenance issues to the Landlord.',
            'The Landlord shall be responsible for structural repairs and maintenance of the property.',
            'Either party may terminate this Agreement by providing the required notice period in writing.',
        ];
        terms.forEach((term, index) => {
            checkPageBreak();
            addText(`${index + 1}. ${term}`, 10);
            y += 2;
        });

        // === SIGNATURES ===
        checkPageBreak(60);
        addSectionTitle(lease.specialClauses ? '9. SIGNATURES' : '8. SIGNATURES');
        y += 10;

        // Landlord signature
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.line(margin, y, margin + 70, y);
        y += 5;
        doc.text('Landlord Signature', margin, y);
        y += 7;
        doc.text(`Name: ${lease.unit.property.landlord.name || lease.unit.property.landlord.email}`, margin, y);
        y += 7;
        doc.text(`Date: ___________________`, margin, y);

        // Tenant signature (right side)
        const rightCol = pageWidth / 2 + 10;
        let sigY = y - 19;
        doc.line(rightCol, sigY, rightCol + 70, sigY);
        sigY += 5;
        doc.text('Tenant Signature', rightCol, sigY);
        sigY += 7;
        doc.text(`Name: ${lease.tenant.fullName}`, rightCol, sigY);
        sigY += 7;
        doc.text(`Date: ___________________`, rightCol, sigY);

        // Footer
        y = doc.internal.pageSize.getHeight() - 15;
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Generated by RentPilot on ${generatedDate}`, pageWidth / 2, y, { align: 'center' });
        doc.setTextColor(0, 0, 0);

        // Return PDF as buffer
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
        const filename = `Lease_Agreement_${lease.unit.property.name}_Unit${lease.unit.unitNumber}_${lease.tenant.fullName.replace(/\s+/g, '_')}.pdf`;

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': String(pdfBuffer.length),
            },
        });

    } catch (error) {
        console.error('Error generating lease PDF:', error);
        return NextResponse.json({ success: false, error: 'Failed to generate lease PDF' }, { status: 500 });
    }
}
