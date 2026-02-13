'use client';

import React, { useEffect, useState } from 'react';
import { TenantLayout } from '@/components/layout/TenantLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
    CreditCard,
    Loader2,
    AlertCircle,
    FileText,
    Download,
} from 'lucide-react';

interface PaymentRecord {
    id: string;
    amount: number;
    method: string;
    datePaid: string;
    reference: string | null;
    status: string;
    property: string;
    unit: string;
    allocations?: { month: string; amount: number }[];
}

const methodLabels: Record<string, string> = {
    ONLINE: 'Online',
    CASH: 'Cash',
    BANK_TRANSFER: 'Bank Transfer',
    CARD: 'Card',
    EFT: 'EFT',
};

export default function TenantPaymentsPage() {
    const [payments, setPayments] = useState<PaymentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [downloadingReceipt, setDownloadingReceipt] = useState<string | null>(null);

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                const response = await fetch('/api/tenant/payments');
                const result = await response.json();
                if (result.success) {
                    setPayments(result.data.payments || result.data);
                } else {
                    setError(result.error || 'Failed to load payments');
                }
            } catch {
                setError('Failed to load payments');
            } finally {
                setLoading(false);
            }
        };

        fetchPayments();
    }, []);

    const handleViewReceipt = async (paymentId: string) => {
        try {
            setDownloadingReceipt(paymentId);
            const response = await fetch(`/api/payments/${paymentId}/receipt`);
            const result = await response.json();
            if (result.success) {
                const r = result.data;
                const receiptText = `
PAYMENT RECEIPT
${r.receiptNumber}
==============================
Date:      ${new Date(r.date).toLocaleDateString('en-ZA')}
Amount:    R${r.amount.toLocaleString()}
Method:    ${r.method}
Reference: ${r.reference || 'N/A'}

TENANT
Name:  ${r.tenant.name}
Email: ${r.tenant.email}

PROPERTY
Name:    ${r.property.name}
Address: ${r.property.address}
Unit:    ${r.property.unit}

RENT PERIOD(S) COVERED
${r.allocations.map((a: { month: string; amount: number }) => `  ${a.month}: R${a.amount.toLocaleString()}`).join('\n')}

Generated: ${new Date(r.generatedAt).toLocaleString('en-ZA')}
==============================
                `.trim();
                const blob = new Blob([receiptText], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${r.receiptNumber}.txt`;
                a.click();
                URL.revokeObjectURL(url);
            }
        } catch {
            // Silent fail
        } finally {
            setDownloadingReceipt(null);
        }
    };

    const getMethodVariant = (method: string): 'success' | 'info' | 'warning' | 'default' => {
        const map: Record<string, 'success' | 'info' | 'warning' | 'default'> = {
            ONLINE: 'success',
            CARD: 'info',
            BANK_TRANSFER: 'info',
            CASH: 'warning',
            EFT: 'info',
        };
        return map[method] || 'default';
    };

    return (
        <TenantLayout title="Payment History">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">Payment History</h1>
                    <p className="text-text-secondary">View all your rent payments</p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    </div>
                ) : error ? (
                    <Card className="text-center py-12">
                        <AlertCircle className="w-12 h-12 text-danger mx-auto mb-3" />
                        <p className="text-text-secondary">{error}</p>
                    </Card>
                ) : payments.length === 0 ? (
                    <Card className="text-center py-12">
                        <CreditCard className="w-12 h-12 text-text-muted mx-auto mb-3" />
                        <p className="text-text-secondary">No payments yet</p>
                    </Card>
                ) : (
                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-bg-secondary border-b border-border">
                                    <tr>
                                        <th className="text-left px-4 py-3 font-medium text-text-secondary">Date</th>
                                        <th className="text-left px-4 py-3 font-medium text-text-secondary">Property</th>
                                        <th className="text-left px-4 py-3 font-medium text-text-secondary">Amount</th>
                                        <th className="text-left px-4 py-3 font-medium text-text-secondary">Method</th>
                                        <th className="text-left px-4 py-3 font-medium text-text-secondary">Status</th>
                                        <th className="text-left px-4 py-3 font-medium text-text-secondary">Months</th>
                                        <th className="text-left px-4 py-3 font-medium text-text-secondary">Reference</th>
                                        <th className="text-right px-4 py-3 font-medium text-text-secondary">Receipt</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {payments.map((payment) => (
                                        <tr key={payment.id} className="hover:bg-bg-secondary/50">
                                            <td className="px-4 py-3">
                                                {new Date(payment.datePaid).toLocaleDateString('en-ZA')}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium">{payment.property}</div>
                                                <div className="text-text-muted text-xs">Unit {payment.unit}</div>
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-success">
                                                R{payment.amount.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant={getMethodVariant(payment.method)}>
                                                    {methodLabels[payment.method] || payment.method}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant={payment.status === 'SUCCESS' ? 'success' : payment.status === 'PENDING' ? 'warning' : 'default'}>
                                                    {payment.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-text-muted text-xs">
                                                {payment.allocations && payment.allocations.length > 0
                                                    ? payment.allocations.map(a => a.month).join(', ')
                                                    : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-text-muted font-mono text-xs">
                                                {payment.reference || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {payment.status === 'SUCCESS' ? (
                                                    <button
                                                        onClick={() => handleViewReceipt(payment.id)}
                                                        disabled={downloadingReceipt === payment.id}
                                                        className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-xs font-medium disabled:opacity-50"
                                                        title="Download Receipt"
                                                    >
                                                        {downloadingReceipt === payment.id ? (
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        ) : (
                                                            <Download className="w-3.5 h-3.5" />
                                                        )}
                                                        <FileText className="w-3.5 h-3.5" />
                                                    </button>
                                                ) : (
                                                    <span className="text-text-muted text-xs">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>
        </TenantLayout>
    );
}
