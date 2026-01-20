'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { usePayments, useLeases, useMutation } from '@/lib/hooks';
import {
    Plus,
    Download,
    CreditCard,
    Loader2,
} from 'lucide-react';

const methodOptions = [
    { value: '', label: 'All Methods' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Card' },
];

const paymentMethodOptions = [
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'CASH', label: 'Cash' },
    { value: 'CARD', label: 'Card' },
    { value: 'OTHER', label: 'Other' },
];

const methodLabels: Record<string, string> = {
    BANK_TRANSFER: 'Bank Transfer',
    CASH: 'Cash',
    CARD: 'Card',
    OTHER: 'Other',
};

export default function PaymentsPage() {
    const searchParams = useSearchParams();
    const [methodFilter, setMethodFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const { data: payments, loading, error, refetch } = usePayments(methodFilter, dateFrom, dateTo);
    const { data: leases } = useLeases('active');
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
        tenantId: '',
        leaseId: '',
        amount: 0,
        method: 'BANK_TRANSFER',
        datePaid: new Date().toISOString().split('T')[0],
        reference: '',
    });

    // Auto-open modal if action=new in URL
    useEffect(() => {
        if (searchParams.get('action') === 'new') {
            setShowAddModal(true);
        }
    }, [searchParams]);

    const { mutate: createPayment, loading: creating } = useMutation({
        url: '/api/payments',
        onSuccess: () => {
            setShowAddModal(false);
            setFormData({
                tenantId: '',
                leaseId: '',
                amount: 0,
                method: 'BANK_TRANSFER',
                datePaid: new Date().toISOString().split('T')[0],
                reference: '',
            });
            refetch();
        },
    });

    const handleSubmit = async () => {
        if (!formData.leaseId || !formData.amount || !formData.method) return;
        await createPayment(formData);
    };

    // Handle lease selection to auto-fill tenant
    const handleLeaseChange = (leaseId: string) => {
        const lease = leases?.find(l => l.id === leaseId);
        setFormData({
            ...formData,
            leaseId,
            tenantId: lease?.tenantId || '',
            amount: lease?.rentAmount || 0,
        });
    };

    const totalAmount = payments?.reduce((sum, p) => sum + p.amount, 0) ?? 0;

    const columns = [
        {
            key: 'datePaid',
            header: 'Date Paid',
            render: (row: NonNullable<typeof payments>[0]) => new Date(row.datePaid).toLocaleDateString()
        },
        {
            key: 'tenant',
            header: 'Tenant',
            render: (row: NonNullable<typeof payments>[0]) => row.tenant?.fullName
        },
        {
            key: 'unit',
            header: 'Unit',
            render: (row: NonNullable<typeof payments>[0]) =>
                `${row.lease?.unit?.unitNumber} - ${row.lease?.unit?.property?.name}`
        },
        {
            key: 'amount',
            header: 'Amount',
            render: (row: NonNullable<typeof payments>[0]) => (
                <span className="font-semibold text-success">R{row.amount.toLocaleString()}</span>
            )
        },
        {
            key: 'method',
            header: 'Method',
            render: (row: NonNullable<typeof payments>[0]) => (
                <Badge variant="completed">{methodLabels[row.method] || row.method}</Badge>
            )
        },
        { key: 'reference', header: 'Reference' },
    ];

    return (
        <AppShell
            title="Payments"
            breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Payments' }]}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card>
                    <div className="text-sm text-text-muted mb-1">Total Payments</div>
                    <div className="text-2xl font-bold">{payments?.length ?? 0}</div>
                </Card>
                <Card>
                    <div className="text-sm text-text-muted mb-1">Total Amount</div>
                    <div className="text-2xl font-bold text-success">R{totalAmount.toLocaleString()}</div>
                </Card>
            </div>

            <div className="page-header">
                <div className="flex items-center gap-4">
                    <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    <Select options={methodOptions} value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} />
                </div>
                <div className="page-actions">
                    <Button variant="secondary"><Download className="w-4 h-4" /> Export</Button>
                    <Button onClick={() => setShowAddModal(true)}><Plus className="w-4 h-4" /> Log Payment</Button>
                </div>
            </div>

            <Card>
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : error ? (
                    <div className="text-center py-12">
                        <p className="text-danger mb-4">Error: {error}</p>
                        <Button onClick={refetch}>Retry</Button>
                    </div>
                ) : payments && payments.length > 0 ? (
                    <Table columns={columns} data={payments} />
                ) : (
                    <EmptyState
                        icon={<CreditCard className="w-16 h-16" />}
                        title="No payments yet"
                        description="Logged payments will appear here"
                        actionLabel="Log Payment"
                        onAction={() => setShowAddModal(true)}
                    />
                )}
            </Card>

            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Log Payment"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={creating}>
                            {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Logging...</> : 'Log Payment'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <Select
                        label="Lease"
                        options={leases?.map(l => ({
                            value: l.id,
                            label: `${l.tenant?.fullName} - ${l.unit?.unitNumber}`
                        })) ?? []}
                        value={formData.leaseId}
                        onChange={(e) => handleLeaseChange(e.target.value)}
                        placeholder="Select lease"
                    />
                    <Input
                        label="Amount (R)"
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Payment Method"
                            options={paymentMethodOptions}
                            value={formData.method}
                            onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                        />
                        <Input
                            label="Date Paid"
                            type="date"
                            value={formData.datePaid}
                            onChange={(e) => setFormData({ ...formData, datePaid: e.target.value })}
                        />
                    </div>
                    <Input
                        label="Reference (Optional)"
                        placeholder="Transaction reference"
                        value={formData.reference}
                        onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    />
                </div>
            </Modal>
        </AppShell>
    );
}
