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
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useMaintenance, useUnits, useMutation, useTenants } from '@/lib/hooks';
import {
    Plus,
    Download,
    Wrench,
    Loader2,
    Calendar,
} from 'lucide-react';

const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'in-review', label: 'In Review' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
];

const priorityOptions = [
    { value: '', label: 'All Priority' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
];

const categoryOptions = [
    { value: 'PLUMBING', label: 'Plumbing' },
    { value: 'ELECTRICAL', label: 'Electrical' },
    { value: 'HVAC', label: 'HVAC' },
    { value: 'APPLIANCE', label: 'Appliance' },
    { value: 'STRUCTURAL', label: 'Structural' },
    { value: 'OTHER', label: 'Other' },
];

const priorityFormOptions = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'URGENT', label: 'Urgent' },
];

export default function MaintenancePage() {
    const searchParams = useSearchParams();
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const { data: tickets, loading, error, refetch } = useMaintenance(statusFilter, priorityFilter);
    const { data: units } = useUnits('', 'occupied');
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
        unitId: '',
        title: '',
        description: '',
        category: 'OTHER',
        priority: 'MEDIUM',
        scheduledDate: '',
    });

    // Auto-open modal if action=new in URL
    useEffect(() => {
        if (searchParams.get('action') === 'new') {
            setShowAddModal(true);
        }
    }, [searchParams]);

    const [updating, setUpdating] = useState<string | null>(null);

    const { mutate: createTicket, loading: creating } = useMutation({
        url: '/api/maintenance',
        onSuccess: () => {
            setShowAddModal(false);
            setFormData({ unitId: '', title: '', description: '', category: 'OTHER', priority: 'MEDIUM', scheduledDate: '' });
            refetch();
        },
    });

    const handleMarkasDone = async (id: string) => {
        if (updating) return;
        setUpdating(id);
        try {
            const response = await fetch(`/api/maintenance/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'COMPLETED' }),
            });
            const result = await response.json();
            if (result.success) {
                refetch();
            } else {
                console.error('Failed to update ticket:', result.error);
                alert('Failed to update ticket status');
            }
        } catch (error) {
            console.error('Error updating ticket:', error);
            alert('Failed to update ticket status');
        } finally {
            setUpdating(null);
        }
    };

    const handleSubmit = async () => {
        if (!formData.unitId || !formData.title || !formData.category) return;
        await createTicket(formData);
    };

    const columns = [
        {
            key: 'title',
            header: 'Ticket',
            render: (row: NonNullable<typeof tickets>[0]) => (
                <div className="font-medium">{row.title}</div>
            )
        },
        {
            key: 'unit',
            header: 'Unit',
            render: (row: NonNullable<typeof tickets>[0]) =>
                `${row.unit?.unitNumber} - ${row.unit?.property?.name}`
        },
        {
            key: 'category',
            header: 'Category',
            render: (row: NonNullable<typeof tickets>[0]) => (
                <span className="capitalize">{row.category.toLowerCase()}</span>
            )
        },
        {
            key: 'priority',
            header: 'Priority',
            render: (row: NonNullable<typeof tickets>[0]) => (
                <Badge variant={row.priority.toLowerCase() as 'low' | 'medium' | 'high' | 'urgent'}>
                    {row.priority}
                </Badge>
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (row: NonNullable<typeof tickets>[0]) => (
                <Badge variant={row.status.toLowerCase().replace('_', '-') as 'submitted' | 'in-review' | 'in-progress' | 'completed'}>
                    {row.status.replace('_', ' ')}
                </Badge>
            )
        },
        {
            key: 'scheduledDate',
            header: 'Scheduled',
            render: (row: NonNullable<typeof tickets>[0]) => (
                row.scheduledDate ? (
                    <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3 text-text-muted" />
                        {new Date(row.scheduledDate).toLocaleDateString()}
                    </div>
                ) : <span className="text-text-muted">—</span>
            )
        },
        {
            key: 'createdAt',
            header: 'Created',
            render: (row: NonNullable<typeof tickets>[0]) => new Date(row.createdAt).toLocaleDateString()
        },
        {
            key: 'actions',
            header: '',
            render: (row: NonNullable<typeof tickets>[0]) => (
                row.status !== 'COMPLETED' ? (
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleMarkasDone(row.id)}
                        disabled={updating === row.id}
                    >
                        {updating === row.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Mark as Done'}
                    </Button>
                ) : null
            )
        },
    ];

    return (
        <AppShell
            title="Maintenance"
            breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Maintenance' }]}
        >
            <div className="page-header">
                <div className="flex items-center gap-4">
                    <Select
                        options={statusOptions}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    />
                    <Select
                        options={priorityOptions}
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                    />
                </div>
                <div className="page-actions">
                    <Button variant="secondary">
                        <Download className="w-4 h-4" />
                        Export
                    </Button>
                    <Button onClick={() => setShowAddModal(true)}>
                        <Plus className="w-4 h-4" />
                        New Ticket
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
                ) : tickets && tickets.length > 0 ? (
                    <Table columns={columns} data={tickets} />
                ) : (
                    <EmptyState
                        icon={<Wrench className="w-16 h-16" />}
                        title="No maintenance tickets"
                        description="Maintenance requests from tenants will appear here"
                        actionLabel="Create Ticket"
                        onAction={() => setShowAddModal(true)}
                    />
                )}
            </Card>

            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="New Maintenance Ticket"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={creating}>
                            {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Create Ticket'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <Select
                        label="Unit"
                        options={units?.map(u => ({
                            value: u.id,
                            label: `${u.unitNumber} - ${u.property?.name}`
                        })) ?? []}
                        value={formData.unitId}
                        onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                        placeholder="Select unit"
                    />
                    <Input
                        label="Title"
                        placeholder="Brief description of the issue"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Category"
                            options={categoryOptions}
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        />
                        <Select
                            label="Priority"
                            options={priorityFormOptions}
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        />
                    </div>
                    <Input
                        label="Scheduled Date (optional)"
                        type="datetime-local"
                        value={formData.scheduledDate}
                        onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    />
                    <div>
                        <label className="form-label">Description</label>
                        <textarea
                            className="form-input w-full"
                            rows={4}
                            placeholder="Detailed description of the maintenance issue..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                </div>
            </Modal>
        </AppShell>
    );
}
