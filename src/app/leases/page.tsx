'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useLeases, useTenants, useUnits, useMutation } from '@/lib/hooks';
import {
    Plus,
    Download,
    FileText,
    Loader2,
} from 'lucide-react';

export default function LeasesPage() {
    const searchParams = useSearchParams();
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'ended'>('all');
    const { data: leases, loading, error, refetch } = useLeases(statusFilter === 'all' ? '' : statusFilter);
    const { data: tenants } = useTenants('');
    const { data: units } = useUnits('', '');
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
        tenantId: '',
        unitId: '',
        rentAmount: 0,
        deposit: 0,
        startDate: '',
        endDate: '',
        dueDay: 1,
    });

    // Auto-open modal if action=new in URL
    useEffect(() => {
        if (searchParams.get('action') === 'new') {
            setShowAddModal(true);
        }
    }, [searchParams]);

    const { mutate: createLease, loading: creating } = useMutation({
        url: '/api/leases',
        onSuccess: () => {
            setShowAddModal(false);
            setFormData({ tenantId: '', unitId: '', rentAmount: 0, deposit: 0, startDate: '', endDate: '', dueDay: 1 });
            refetch();
        },
    });

    const handleSubmit = async () => {
        if (!formData.tenantId || !formData.unitId || !formData.startDate || !formData.endDate) return;
        await createLease(formData);
    };

    const handleDownloadPdf = async (leaseId: string, tenantName: string) => {
        try {
            const response = await fetch(`/api/leases/${leaseId}/pdf`);
            if (!response.ok) throw new Error('Failed to download PDF');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Lease_Agreement_${tenantName.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('Failed to download lease PDF:', err);
            alert('Failed to download lease PDF. Please try again.');
        }
    };

    // Filter to only vacant units
    const vacantUnits = units?.filter(u => u.status === 'VACANT') || [];

    const columns = [
        {
            key: 'tenant',
            header: 'Tenant',
            render: (row: NonNullable<typeof leases>[0]) => (
                <div className="font-medium">{row.tenant?.fullName}</div>
            )
        },
        {
            key: 'unit',
            header: 'Unit',
            render: (row: NonNullable<typeof leases>[0]) =>
                `${row.unit?.unitNumber} - ${row.unit?.property?.name}`
        },
        {
            key: 'rentAmount',
            header: 'Rent',
            render: (row: NonNullable<typeof leases>[0]) => `R${(row.rentAmount || 0).toLocaleString()}`
        },
        {
            key: 'startDate',
            header: 'Start Date',
            render: (row: NonNullable<typeof leases>[0]) => row.startDate ? new Date(row.startDate).toLocaleDateString() : '—'
        },
        {
            key: 'endDate',
            header: 'End Date',
            render: (row: NonNullable<typeof leases>[0]) => row.endDate ? new Date(row.endDate).toLocaleDateString() : '—'
        },
        {
            key: 'status',
            header: 'Status',
            render: (row: NonNullable<typeof leases>[0]) => (
                <Badge variant={row.status === 'ACTIVE' ? 'occupied' : 'vacant'}>
                    {row.status}
                </Badge>
            )
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (row: NonNullable<typeof leases>[0]) => (
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDownloadPdf(row.id, row.tenant?.fullName || 'Tenant')}
                >
                    <Download className="w-4 h-4" />
                    PDF
                </Button>
            )
        },
    ];

    return (
        <AppShell
            title="Leases"
            breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Leases' }]}
        >
            <div className="page-header">
                <div className="flex items-center gap-4">
                    <div className="tabs" style={{ marginBottom: 0, borderBottom: 'none' }}>
                        <button
                            className={`tab ${statusFilter === 'all' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('all')}
                        >
                            All
                        </button>
                        <button
                            className={`tab ${statusFilter === 'active' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('active')}
                        >
                            Active
                        </button>
                        <button
                            className={`tab ${statusFilter === 'ended' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('ended')}
                        >
                            Ended
                        </button>
                    </div>
                </div>
                <div className="page-actions">
                    <Button variant="secondary">
                        <Download className="w-4 h-4" />
                        Export
                    </Button>
                    <Button onClick={() => setShowAddModal(true)}>
                        <Plus className="w-4 h-4" />
                        Create Lease
                    </Button>
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
                ) : leases && leases.length > 0 ? (
                    <Table columns={columns} data={leases} />
                ) : (
                    <EmptyState
                        icon={<FileText className="w-16 h-16" />}
                        title="No leases yet"
                        description="Create a lease to link a tenant to a unit and start tracking rent"
                        actionLabel="Create Lease"
                        onAction={() => setShowAddModal(true)}
                    />
                )}
            </Card>

            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Create Lease"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={creating}>
                            {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Create Lease'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <Select
                        label="Tenant"
                        options={tenants?.map(t => ({ value: t.id, label: t.fullName })) ?? []}
                        value={formData.tenantId}
                        onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                        placeholder="Select tenant"
                    />
                    <Select
                        label="Unit"
                        options={vacantUnits.map(u => ({ value: u.id, label: `${u.unitNumber} - ${u.property?.name}` }))}
                        value={formData.unitId}
                        onChange={(e) => {
                            const unit = units?.find(u => u.id === e.target.value);
                            setFormData({
                                ...formData,
                                unitId: e.target.value,
                                rentAmount: unit?.rentAmount || 0,
                            });
                        }}
                        placeholder="Select unit (vacant only)"
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Monthly Rent (R)"
                            type="number"
                            value={formData.rentAmount}
                            onChange={(e) => setFormData({ ...formData, rentAmount: parseFloat(e.target.value) || 0 })}
                        />
                        <Input
                            label="Deposit (R)"
                            type="number"
                            value={formData.deposit}
                            onChange={(e) => setFormData({ ...formData, deposit: parseFloat(e.target.value) || 0 })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Start Date"
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        />
                        <Input
                            label="End Date"
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        />
                    </div>
                    <Input
                        label="Rent Due Day"
                        type="number"
                        min={1}
                        max={28}
                        value={formData.dueDay}
                        onChange={(e) => setFormData({ ...formData, dueDay: parseInt(e.target.value) || 1 })}
                        placeholder="Day of month rent is due (1-28)"
                    />
                </div>
            </Modal>
        </AppShell>
    );
}
