'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import {
    ClipboardCheck,
    Plus,
    Calendar,
    Home,
    User,
    Camera,
    Loader2,
    CheckCircle2,
    Clock,
    AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

interface Inspection {
    id: string;
    type: string;
    scheduledDate: string;
    completedAt: string | null;
    status: string;
    notes: string | null;
    unit: {
        unitNumber: string;
        property: {
            name: string;
            address: string;
        };
    };
    lease?: {
        tenant: {
            fullName: string;
        };
    } | null;
    items: Array<{ id: string; condition: string }>;
}

interface Unit {
    id: string;
    unitNumber: string;
    property: {
        name: string;
    };
}

interface Lease {
    id: string;
    tenant: {
        fullName: string;
    };
    unit: {
        unitNumber: string;
    };
}

const STATUS_COLORS: Record<string, 'default' | 'warning' | 'success' | 'danger'> = {
    SCHEDULED: 'default',
    IN_PROGRESS: 'warning',
    COMPLETED: 'success',
    CANCELLED: 'danger',
};

const TYPE_LABELS: Record<string, string> = {
    MOVE_IN: 'Move-In',
    PERIODIC: 'Periodic',
    MOVE_OUT: 'Move-Out',
};

export default function InspectionsPage() {
    const [inspections, setInspections] = useState<Inspection[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [activeLeases, setActiveLeases] = useState<Lease[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [formData, setFormData] = useState({
        unitId: '',
        leaseId: '',
        type: 'MOVE_IN',
        scheduledDate: '',
        notes: '',
    });
    const [filter, setFilter] = useState({
        status: '',
        type: '',
    });

    useEffect(() => {
        fetchInspections();
        fetchUnits();
        fetchLeases();
    }, [filter]);

    const fetchInspections = async () => {
        try {
            const params = new URLSearchParams();
            if (filter.status) params.append('status', filter.status);
            if (filter.type) params.append('type', filter.type);

            const response = await fetch(`/api/inspections?${params}`);
            const result = await response.json();
            if (result.success) {
                setInspections(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch inspections:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnits = async () => {
        try {
            const response = await fetch('/api/units');
            const result = await response.json();
            if (result.success) {
                setUnits(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch units:', error);
        }
    };

    const fetchLeases = async () => {
        try {
            const response = await fetch('/api/leases?status=ACTIVE');
            const result = await response.json();
            if (result.success) {
                setActiveLeases(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch leases:', error);
        }
    };

    const handleCreateInspection = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);

        try {
            const response = await fetch('/api/inspections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const result = await response.json();
            if (result.success) {
                setShowModal(false);
                setFormData({ unitId: '', leaseId: '', type: 'MOVE_IN', scheduledDate: '', notes: '' });
                fetchInspections();
            }
        } catch (error) {
            console.error('Failed to create inspection:', error);
        } finally {
            setCreating(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return <CheckCircle2 className="w-4 h-4" />;
            case 'IN_PROGRESS':
                return <Clock className="w-4 h-4" />;
            case 'CANCELLED':
                return <AlertCircle className="w-4 h-4" />;
            default:
                return <Calendar className="w-4 h-4" />;
        }
    };

    return (
        <AppShell title="Inspections">
            {/* Action Button */}
            <div className="flex justify-end mb-6">
                <Button onClick={() => setShowModal(true)}>
                    <Plus className="w-4 h-4" />
                    Schedule Inspection
                </Button>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <div className="flex flex-wrap gap-4">
                    <Select
                        label="Status"
                        value={filter.status}
                        onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                        options={[
                            { value: '', label: 'All Statuses' },
                            { value: 'SCHEDULED', label: 'Scheduled' },
                            { value: 'IN_PROGRESS', label: 'In Progress' },
                            { value: 'COMPLETED', label: 'Completed' },
                            { value: 'CANCELLED', label: 'Cancelled' },
                        ]}
                    />
                    <Select
                        label="Type"
                        value={filter.type}
                        onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                        options={[
                            { value: '', label: 'All Types' },
                            { value: 'MOVE_IN', label: 'Move-In' },
                            { value: 'PERIODIC', label: 'Periodic' },
                            { value: 'MOVE_OUT', label: 'Move-Out' },
                        ]}
                    />
                </div>
            </Card>

            {/* Inspections List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : inspections.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={<ClipboardCheck className="w-16 h-16" />}
                        title="No inspections yet"
                        description="Schedule your first property inspection to document unit conditions"
                        actionLabel="Schedule Inspection"
                        onAction={() => setShowModal(true)}
                    />
                </Card>
            ) : (
                <div className="grid gap-4">
                    {inspections.map((inspection) => (
                        <Link key={inspection.id} href={`/inspections/${inspection.id}`}>
                            <Card className="hover:border-primary transition-colors cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center">
                                            <ClipboardCheck className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold">
                                                    {TYPE_LABELS[inspection.type] || inspection.type} Inspection
                                                </h3>
                                                <Badge variant={STATUS_COLORS[inspection.status] || 'default'}>
                                                    {getStatusIcon(inspection.status)}
                                                    <span className="ml-1">{inspection.status}</span>
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-text-secondary mt-1">
                                                <span className="flex items-center gap-1">
                                                    <Home className="w-4 h-4" />
                                                    {inspection.unit.property.name} - Unit {inspection.unit.unitNumber}
                                                </span>
                                                {inspection.lease?.tenant && (
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-4 h-4" />
                                                        {inspection.lease.tenant.fullName}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {inspection.scheduledDate ? new Date(inspection.scheduledDate).toLocaleDateString() : 'Not scheduled'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                                            <Camera className="w-4 h-4" />
                                            {inspection.items.length} items
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Schedule Inspection"
            >
                <form onSubmit={handleCreateInspection} className="space-y-4">
                    <Select
                        label="Unit *"
                        value={formData.unitId}
                        onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                        options={[
                            { value: '', label: 'Select a unit' },
                            ...units.map((unit) => ({
                                value: unit.id,
                                label: `${unit.property.name} - Unit ${unit.unitNumber}`,
                            })),
                        ]}
                        required
                    />

                    <Select
                        label="Active Lease (Optional)"
                        value={formData.leaseId}
                        onChange={(e) => setFormData({ ...formData, leaseId: e.target.value })}
                        options={[
                            { value: '', label: 'No lease selected' },
                            ...activeLeases.map((lease) => ({
                                value: lease.id,
                                label: `${lease.tenant.fullName} - Unit ${lease.unit.unitNumber}`,
                            })),
                        ]}
                    />

                    <Select
                        label="Inspection Type *"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        options={[
                            { value: 'MOVE_IN', label: 'Move-In Inspection' },
                            { value: 'PERIODIC', label: 'Periodic Inspection' },
                            { value: 'MOVE_OUT', label: 'Move-Out Inspection' },
                        ]}
                        required
                    />

                    <Input
                        label="Scheduled Date *"
                        type="datetime-local"
                        value={formData.scheduledDate}
                        onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                        required
                    />

                    <Input
                        label="Notes"
                        type="text"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Any special instructions..."
                    />

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={creating}>
                            {creating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Schedule Inspection'
                            )}
                        </Button>
                    </div>
                </form>
            </Modal>
        </AppShell>
    );
}
