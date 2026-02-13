'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import {
    Plus,
    Download,
    Receipt,
    Loader2,
} from 'lucide-react';

interface RentCharge {
    id: string;
    month: string;
    amountDue: number;
    amountPaid: number;
    status: string;
    dueDate: string;
    lease: {
        tenant: { fullName: string };
        unit: {
            unitNumber: string;
            property: { name: string };
        };
    };
}

interface LedgerData {
    rentCharges: RentCharge[];
    summary: {
        totalDue: number;
        totalCollected: number;
        outstanding: number;
        globalOutstanding: number;
    };
}

const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const label = date.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });
        options.push({ value, label });
    }
    return options;
};

const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'paid', label: 'Paid' },
    { value: 'partial', label: 'Partial' },
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'overdue', label: 'Overdue' },
];

const paymentMethodOptions = [
    { value: 'CASH', label: 'Cash' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'CARD', label: 'Card' },
    { value: 'OTHER', label: 'Other' },
];

export default function RentLedgerPage() {
    const searchParams = useSearchParams();
    const monthOptions = getMonthOptions();
    const [monthFilter, setMonthFilter] = useState(monthOptions[0]?.value || '');
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<LedgerData | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedCharge, setSelectedCharge] = useState<RentCharge | null>(null);
    const [paymentForm, setPaymentForm] = useState({
        amount: 0,
        method: 'BANK_TRANSFER',
        reference: '',
    });
    const [submitting, setSubmitting] = useState(false);

    // Auto-open modal if action=new in URL
    useEffect(() => {
        if (searchParams.get('action') === 'new') {
            // If there are rent charges, open modal with first one
            if (data?.rentCharges.length) {
                openPaymentModal(data.rentCharges[0]);
            }
        }
    }, [searchParams, data]);

    const fetchLedger = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (monthFilter) params.append('month', monthFilter);
            if (statusFilter) params.append('status', statusFilter);

            const response = await fetch(`/api/rent-ledger?${params.toString()}`);
            const result = await response.json();
            if (result.success) {
                setData(result.data);
            }
        } catch (error) {
            console.error('Error fetching rent ledger:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLedger();
    }, [monthFilter, statusFilter]);

    const openPaymentModal = (charge: RentCharge) => {
        setSelectedCharge(charge);
        setPaymentForm({
            amount: charge.amountDue - charge.amountPaid,
            method: 'BANK_TRANSFER',
            reference: '',
        });
        setShowPaymentModal(true);
    };

    const handleLogPayment = async () => {
        if (!selectedCharge || !paymentForm.amount) return;

        setSubmitting(true);
        try {
            const response = await fetch('/api/rent-ledger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rentChargeId: selectedCharge.id,
                    amount: paymentForm.amount,
                    method: paymentForm.method,
                    reference: paymentForm.reference,
                }),
            });

            const result = await response.json();
            if (result.success) {
                setShowPaymentModal(false);
                setSelectedCharge(null);
                fetchLedger();
            } else {
                alert(result.error || 'Failed to log payment');
            }
        } catch (error) {
            console.error('Error logging payment:', error);
            alert('Failed to log payment');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'PAID': return 'success' as const;
            case 'PARTIAL': return 'warning' as const;
            case 'OVERDUE': return 'danger' as const;
            default: return 'info' as const;
        }
    };

    const columns = [
        {
            key: 'tenant',
            header: 'Tenant',
            render: (row: RentCharge) => (
                <div>
                    <div className="font-medium">{row.lease.tenant.fullName}</div>
                    <div className="text-sm text-text-muted">
                        {row.lease.unit.unitNumber} - {row.lease.unit.property.name}
                    </div>
                </div>
            )
        },
        {
            key: 'amountDue',
            header: 'Amount Due',
            render: (row: RentCharge) => `R${row.amountDue.toLocaleString()}`
        },
        {
            key: 'amountPaid',
            header: 'Paid',
            render: (row: RentCharge) => (
                <span className={row.amountPaid > 0 ? 'text-success font-medium' : ''}>
                    R{row.amountPaid.toLocaleString()}
                </span>
            )
        },
        {
            key: 'balance',
            header: 'Balance',
            render: (row: RentCharge) => {
                const balance = row.amountDue - row.amountPaid;
                return (
                    <span className={balance > 0 ? 'text-danger font-medium' : 'text-success'}>
                        R{balance.toLocaleString()}
                    </span>
                );
            }
        },
        {
            key: 'dueDate',
            header: 'Due Date',
            render: (row: RentCharge) => new Date(row.dueDate).toLocaleDateString()
        },
        {
            key: 'status',
            header: 'Status',
            render: (row: RentCharge) => (
                <Badge variant={getStatusVariant(row.status)}>
                    {row.status}
                </Badge>
            )
        },
        {
            key: 'actions',
            header: '',
            render: (row: RentCharge) => (
                row.amountDue > row.amountPaid ? (
                    <Button size="sm" variant="secondary" onClick={() => openPaymentModal(row)}>
                        Log Payment
                    </Button>
                ) : null
            )
        },
    ];

    return (
        <AppShell
            title="Rent Ledger"
            breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Rent Ledger' }]}
        >
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <div className="text-sm text-text-muted mb-1">Total Due (This Month)</div>
                    <div className="text-2xl font-bold">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : `R${(data?.summary.totalDue || 0).toLocaleString()}`}
                    </div>
                </Card>
                <Card>
                    <div className="text-sm text-text-muted mb-1">Collected (This Month)</div>
                    <div className="text-2xl font-bold text-success">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : `R${(data?.summary.totalCollected || 0).toLocaleString()}`}
                    </div>
                </Card>
                <Card>
                    <div className="text-sm text-text-muted mb-1">Outstanding (This Month)</div>
                    <div className="text-2xl font-bold text-warning">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : `R${(data?.summary.outstanding || 0).toLocaleString()}`}
                    </div>
                </Card>
                <Card>
                    <div className="text-sm text-text-muted mb-1">Total Outstanding (All Time)</div>
                    <div className="text-2xl font-bold text-danger">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : `R${(data?.summary.globalOutstanding || 0).toLocaleString()}`}
                    </div>
                </Card>
            </div>

            {/* Page Header */}
            <div className="page-header">
                <div className="flex items-center gap-4">
                    <Select
                        options={monthOptions}
                        value={monthFilter}
                        onChange={(e) => setMonthFilter(e.target.value)}
                    />
                    <Select
                        options={statusOptions}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    />
                </div>
                <div className="page-actions">
                    <Button variant="secondary">
                        <Download className="w-4 h-4" />
                        Export
                    </Button>
                    <Button onClick={() => data?.rentCharges[0] && openPaymentModal(data.rentCharges[0])}>
                        <Plus className="w-4 h-4" />
                        Log Payment
                    </Button>
                </div>
            </div>

            {/* Rent Ledger */}
            <Card>
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : data?.rentCharges && data.rentCharges.length > 0 ? (
                    <Table columns={columns} data={data.rentCharges} />
                ) : (
                    <EmptyState
                        icon={<Receipt className="w-16 h-16" />}
                        title="No rent charges yet"
                        description="Rent charges will be generated automatically when you have active leases"
                    />
                )}
            </Card>

            {/* Log Payment Modal */}
            <Modal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                title="Log Payment"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
                        <Button onClick={handleLogPayment} disabled={submitting}>
                            {submitting ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                            ) : (
                                'Log Payment'
                            )}
                        </Button>
                    </>
                }
            >
                {selectedCharge && (
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="font-medium">{selectedCharge.lease.tenant.fullName}</div>
                            <div className="text-sm text-text-muted">
                                {selectedCharge.lease.unit.unitNumber} - {selectedCharge.lease.unit.property.name}
                            </div>
                            <div className="mt-2 text-lg font-bold">
                                Balance: R{(selectedCharge.amountDue - selectedCharge.amountPaid).toLocaleString()}
                            </div>
                        </div>
                        <Input
                            label="Payment Amount (R)"
                            type="number"
                            value={paymentForm.amount}
                            onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
                            max={selectedCharge.amountDue - selectedCharge.amountPaid}
                        />
                        <Select
                            label="Payment Method"
                            options={paymentMethodOptions}
                            value={paymentForm.method}
                            onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                        />
                        <Input
                            label="Reference (Optional)"
                            placeholder="Bank reference or receipt number"
                            value={paymentForm.reference}
                            onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                        />
                    </div>
                )}
            </Modal>
        </AppShell>
    );
}
