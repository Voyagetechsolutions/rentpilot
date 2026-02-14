'use client';

import React, { useEffect, useState } from 'react';
import { TenantLayout } from '@/components/layout/TenantLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
    Home,
    Calendar,
    Loader2,
    AlertCircle,
    FileText,
    MapPin,
    Download,
} from 'lucide-react';

interface LeaseData {
    id: string;
    unit: string;
    property: string;
    address: string;
    city: string;
    startDate: string;
    endDate: string;
    rentAmount: number;
    deposit: number;
    dueDay: number;
}

interface Document {
    id: string;
    filename: string;
    fileUrl: string;
    docType: string;
    createdAt: string;
}

export default function TenantLeasePage() {
    const [lease, setLease] = useState<LeaseData | null>(null);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [downloadingPdf, setDownloadingPdf] = useState(false);

    const handleDownloadPdf = async () => {
        if (!lease) return;
        setDownloadingPdf(true);
        try {
            const response = await fetch(`/api/leases/${lease.id}/pdf`);
            if (!response.ok) throw new Error('Failed to download PDF');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Lease_Agreement_${lease.property}_Unit${lease.unit}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('Failed to download lease PDF:', err);
            alert('Failed to download lease PDF. Please try again.');
        } finally {
            setDownloadingPdf(false);
        }
    };

    useEffect(() => {
        const fetchLease = async () => {
            try {
                const response = await fetch('/api/tenant/dashboard');
                const result = await response.json();
                if (result.success && result.data.lease) {
                    setLease({
                        ...result.data.lease,
                        deposit: result.data.lease.rentAmount // Placeholder
                    });
                    setDocuments(result.data.documents || []);
                } else if (!result.data?.lease) {
                    setError('No active lease found');
                } else {
                    setError(result.error || 'Failed to load lease');
                }
            } catch {
                setError('Failed to load lease');
            } finally {
                setLoading(false);
            }
        };

        fetchLease();
    }, []);

    if (loading) {
        return (
            <TenantLayout title="My Lease">
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
            </TenantLayout>
        );
    }

    if (error || !lease) {
        return (
            <TenantLayout title="My Lease">
                <div className="text-center py-20">
                    <AlertCircle className="w-16 h-16 text-warning mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">No Active Lease</h2>
                    <p className="text-text-secondary mb-4">
                        {error || "You don't have an active lease at the moment."}
                    </p>
                </div>
            </TenantLayout>
        );
    }

    const startDate = new Date(lease.startDate);
    const endDate = new Date(lease.endDate);
    const totalMonths = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const monthsPassed = Math.round((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const progress = Math.min(100, Math.max(0, (monthsPassed / totalMonths) * 100));

    return (
        <TenantLayout title="My Lease">
            <div className="space-y-6">
                {/* Property Card */}
                <Card className="overflow-hidden">
                    <div className="bg-gradient-to-r from-primary to-primary-dark p-6 text-white">
                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                                <Home className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">{lease.property}</h2>
                                <p className="text-white/80">Unit {lease.unit}</p>
                                <div className="flex items-center gap-1 mt-2 text-white/70">
                                    <MapPin className="w-4 h-4" />
                                    <span className="text-sm">{lease.address}, {lease.city}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <div className="text-sm text-text-muted mb-1">Monthly Rent</div>
                                <div className="text-xl font-bold">R{lease.rentAmount.toLocaleString()}</div>
                            </div>
                            <div>
                                <div className="text-sm text-text-muted mb-1">Due Day</div>
                                <div className="text-xl font-bold">{lease.dueDay}th of each month</div>
                            </div>
                            <div>
                                <div className="text-sm text-text-muted mb-1">Start Date</div>
                                <div className="text-xl font-bold">{startDate.toLocaleDateString()}</div>
                            </div>
                            <div>
                                <div className="text-sm text-text-muted mb-1">End Date</div>
                                <div className="text-xl font-bold">{endDate.toLocaleDateString()}</div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Lease Progress */}
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Lease Duration</h3>
                        <Badge variant={progress >= 90 ? 'warning' : 'success'}>
                            {monthsPassed} of {totalMonths} months
                        </Badge>
                    </div>
                    <div className="relative">
                        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${progress >= 90 ? 'bg-warning' : 'bg-primary'
                                    }`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-2 text-sm text-text-muted">
                            <span>{startDate.toLocaleDateString()}</span>
                            <span>{endDate.toLocaleDateString()}</span>
                        </div>
                    </div>
                    {progress >= 80 && (
                        <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                            <p className="text-sm text-orange-700">
                                <Calendar className="w-4 h-4 inline-block mr-1" />
                                Your lease ends soon. Contact your landlord to discuss renewal.
                            </p>
                        </div>
                    )}
                </Card>

                {/* Lease Terms */}
                <Card>
                    <h3 className="font-semibold mb-4">Lease Terms</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-border">
                            <div>
                                <div className="font-medium">Monthly Rent</div>
                                <div className="text-sm text-text-muted">Due on the {lease.dueDay}th of each month</div>
                            </div>
                            <div className="text-xl font-bold text-primary">R{lease.rentAmount.toLocaleString()}</div>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-border">
                            <div>
                                <div className="font-medium">Security Deposit</div>
                                <div className="text-sm text-text-muted">Refundable at end of lease</div>
                            </div>
                            <div className="text-lg font-medium">R{lease.deposit.toLocaleString()}</div>
                        </div>
                        <div className="flex items-center justify-between py-3">
                            <div>
                                <div className="font-medium">Lease Type</div>
                                <div className="text-sm text-text-muted">Fixed term</div>
                            </div>
                            <Badge variant="info">{totalMonths} months</Badge>
                        </div>
                    </div>
                </Card>

                {/* Download Lease Agreement */}
                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold">Lease Agreement PDF</h3>
                            <p className="text-sm text-text-muted mt-1">Download a complete copy of your lease agreement</p>
                        </div>
                        <Button onClick={handleDownloadPdf} disabled={downloadingPdf}>
                            {downloadingPdf ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                            ) : (
                                <><Download className="w-4 h-4" /> Download Lease Agreement</>
                            )}
                        </Button>
                    </div>
                </Card>

                {/* Documents */}
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Lease Documents</h3>
                    </div>
                    <div className="space-y-2">
                        {documents.length > 0 ? (
                            documents.map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-text-muted" />
                                        <div>
                                            <div className="font-medium">{doc.filename}</div>
                                            <div className="text-xs text-text-muted">{new Date(doc.createdAt).toLocaleDateString()} • {doc.docType}</div>
                                        </div>
                                    </div>
                                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                                        <Button variant="secondary" size="sm">View</Button>
                                    </a>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-6 text-text-muted">
                                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p>No documents found</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </TenantLayout>
    );
}
