'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { TenantLayout } from '@/components/layout/TenantLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
    Plus,
    Wrench,
    Loader2,
    Clock,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';

interface MaintenanceRequest {
    id: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    createdAt: string;
    unit: { unitNumber: string };
}

const categoryOptions = [
    { value: 'PLUMBING', label: 'Plumbing' },
    { value: 'ELECTRICAL', label: 'Electrical' },
    { value: 'HVAC', label: 'HVAC / Heating' },
    { value: 'APPLIANCE', label: 'Appliance' },
    { value: 'STRUCTURAL', label: 'Structural' },
    { value: 'OTHER', label: 'Other' },
];

const priorityOptions = [
    { value: 'LOW', label: 'Low - Can wait' },
    { value: 'MEDIUM', label: 'Medium - Soon' },
    { value: 'HIGH', label: 'High - Urgent' },
    { value: 'EMERGENCY', label: 'Emergency - Immediate' },
];

export default function TenantMaintenancePage() {
    const searchParams = useSearchParams();
    const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'OTHER',
        priority: 'MEDIUM',
    });

    useEffect(() => {
        if (searchParams.get('action') === 'new') {
            setShowModal(true);
        }
    }, [searchParams]);

    const fetchRequests = async () => {
        try {
            const response = await fetch('/api/tenant/maintenance');
            const result = await response.json();
            if (result.success) {
                setRequests(result.data || []);
            }
        } catch (error) {
            console.error('Error fetching maintenance:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleSubmit = async () => {
        if (!formData.title || !formData.description) return;

        setSubmitting(true);
        try {
            const response = await fetch('/api/tenant/maintenance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const result = await response.json();
            if (result.success) {
                setShowModal(false);
                setFormData({ title: '', description: '', category: 'OTHER', priority: 'MEDIUM' });
                fetchRequests();
            } else {
                alert(result.error || 'Failed to submit request');
            }
        } catch (error) {
            console.error('Error submitting request:', error);
            alert('Failed to submit request');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'COMPLETED': return <CheckCircle2 className="w-4 h-4 text-success" />;
            case 'IN_PROGRESS': return <Clock className="w-4 h-4 text-warning" />;
            case 'REJECTED': return <AlertCircle className="w-4 h-4 text-danger" />;
            default: return <Clock className="w-4 h-4 text-text-muted" />;
        }
    };

    const getStatusVariant = (status: string) => {
        const variants: Record<string, 'success' | 'warning' | 'info' | 'danger'> = {
            SUBMITTED: 'info',
            IN_REVIEW: 'info',
            APPROVED: 'warning',
            IN_PROGRESS: 'warning',
            COMPLETED: 'success',
            REJECTED: 'danger',
        };
        return variants[status] || 'info';
    };

    const getPriorityVariant = (priority: string) => {
        const variants: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
            LOW: 'success',
            MEDIUM: 'info',
            HIGH: 'warning',
            EMERGENCY: 'danger',
        };
        return variants[priority] || 'info';
    };

    const columns = [
        {
            key: 'title',
            header: 'Issue',
            render: (row: MaintenanceRequest) => (
                <div className="flex items-center gap-2">
                    {getStatusIcon(row.status)}
                    <div>
                        <div className="font-medium">{row.title}</div>
                        <div className="text-sm text-text-muted">{row.category}</div>
                    </div>
                </div>
            )
        },
        {
            key: 'priority',
            header: 'Priority',
            render: (row: MaintenanceRequest) => (
                <Badge variant={getPriorityVariant(row.priority)}>{row.priority}</Badge>
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (row: MaintenanceRequest) => (
                <Badge variant={getStatusVariant(row.status)}>{row.status.replace('_', ' ')}</Badge>
            )
        },
        {
            key: 'createdAt',
            header: 'Submitted',
            render: (row: MaintenanceRequest) => new Date(row.createdAt).toLocaleDateString()
        },
    ];

    const openCount = requests.filter(r => ['SUBMITTED', 'IN_REVIEW', 'IN_PROGRESS'].includes(r.status)).length;
    const completedCount = requests.filter(r => r.status === 'COMPLETED').length;

    return (
        <TenantLayout title="Maintenance Requests">
            <div className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <Clock className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <div className="text-sm text-text-muted">Open Requests</div>
                                <div className="text-2xl font-bold">{openCount}</div>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <div className="text-sm text-text-muted">Completed</div>
                                <div className="text-2xl font-bold text-success">{completedCount}</div>
                            </div>
                        </div>
                    </Card>
                    <Card className="flex items-center justify-center">
                        <Button onClick={() => setShowModal(true)} className="w-full">
                            <Plus className="w-4 h-4" />
                            Report New Issue
                        </Button>
                    </Card>
                </div>

                {/* Requests Table */}
                <Card>
                    <h3 className="font-semibold mb-4">All Requests</h3>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : requests.length > 0 ? (
                        <Table columns={columns} data={requests} />
                    ) : (
                        <EmptyState
                            icon={<Wrench className="w-16 h-16" />}
                            title="No maintenance requests"
                            description="Need something fixed? Submit a maintenance request"
                            actionLabel="Report Issue"
                            onAction={() => setShowModal(true)}
                        />
                    )}
                </Card>
            </div>

            {/* New Request Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Report Maintenance Issue"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={submitting}>
                            {submitting ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                            ) : (
                                'Submit Request'
                            )}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <Input
                        label="Issue Title"
                        placeholder="e.g. Leaking faucet in bathroom"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                    />
                    <div>
                        <label className="form-label">Description</label>
                        <textarea
                            className="form-input w-full h-24"
                            placeholder="Please describe the issue in detail..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Category"
                            options={categoryOptions}
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        />
                        <Select
                            label="Priority"
                            options={priorityOptions}
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        />
                    </div>
                </div>
            </Modal>
        </TenantLayout>
    );
}
