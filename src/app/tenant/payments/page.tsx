'use client';

import React, { useEffect, useState } from 'react';
import { TenantLayout } from '@/components/layout/TenantLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import {
    CreditCard,
    Loader2,
    CheckCircle2,
} from 'lucide-react';

interface Payment {
    id: string;
    amount: number;
    date: string;
    method: string;
    reference: string;
    property?: string;
    unit?: string;
    source?: string;
}

export default function TenantPaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalPaid, setTotalPaid] = useState(0);

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                const response = await fetch('/api/tenant/payments');
                const result = await response.json();
                if (result.success) {
                    setPayments(result.data.payments || []);
                    setTotalPaid(result.data.totalPaid || 0);
                }
            } catch (error) {
                console.error('Error fetching payments:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPayments();
    }, []);

    const methodLabels: Record<string, string> = {
        BANK_TRANSFER: 'Bank Transfer',
        CASH: 'Cash',
        CARD: 'Card',
        ONLINE: 'Online (Paystack)',
        OTHER: 'Other',
    };

    const columns = [
        {
            key: 'date',
            header: 'Date',
            render: (row: Payment) => (
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    {new Date(row.date).toLocaleDateString()}
                </div>
            )
        },
        {
            key: 'amount',
            header: 'Amount',
            render: (row: Payment) => (
                <span className="font-semibold text-success">R{row.amount.toLocaleString()}</span>
            )
        },
        {
            key: 'method',
            header: 'Method',
            render: (row: Payment) => (
                <Badge variant="info">{methodLabels[row.method] || row.method}</Badge>
            )
        },
        {
            key: 'property',
            header: 'Property / Unit',
            render: (row: Payment) => row.property ? `${row.property} - ${row.unit}` : '-'
        },
        {
            key: 'reference',
            header: 'Reference',
            render: (row: Payment) => row.reference || '-'
        },
    ];

    return (
        <TenantLayout title="Payment History">
            <div className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                <CreditCard className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <div className="text-sm text-text-muted">Total Paid</div>
                                <div className="text-2xl font-bold text-success">
                                    R{totalPaid.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <div className="text-sm text-text-muted">Payments Made</div>
                                <div className="text-2xl font-bold">{payments.length}</div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Payment History Table */}
                <Card>
                    <h3 className="font-semibold mb-4">Payment History</h3>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : payments.length > 0 ? (
                        <Table columns={columns} data={payments} />
                    ) : (
                        <EmptyState
                            icon={<CreditCard className="w-16 h-16" />}
                            title="No payment history"
                            description="Your payment history will appear here"
                        />
                    )}
                </Card>
            </div>
        </TenantLayout>
    );
}

