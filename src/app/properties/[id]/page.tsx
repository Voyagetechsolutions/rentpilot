'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import {
    Building2,
    MapPin,
    Home,
    Users,
    Edit,
    Trash2,
    ArrowLeft,
    Loader2,
    Plus,
    AlertCircle,
} from 'lucide-react';

interface Unit {
    id: string;
    unitNumber: string;
    bedrooms: number;
    bathrooms: number;
    rentAmount: number;
    status: string;
    leases?: {
        tenant: {
            fullName: string;
        };
    }[];
}

interface PropertyData {
    id: string;
    name: string;
    address: string;
    city: string;
    country: string;
    createdAt: string;
    units: Unit[];
}

const statusVariants: Record<string, 'success' | 'warning' | 'info' | 'danger'> = {
    OCCUPIED: 'success',
    VACANT: 'info',
    RESERVED: 'warning',
    UNDER_MAINTENANCE: 'danger',
};

export default function PropertyDetailPage() {
    const params = useParams();
    const router = useRouter();
    const propertyId = params.id as string;

    const [property, setProperty] = useState<PropertyData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Edit modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', address: '', city: '', country: '' });
    const [saving, setSaving] = useState(false);

    // Delete confirmation
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const fetchProperty = useCallback(async () => {
        try {
            const response = await fetch(`/api/properties/${propertyId}`);
            const result = await response.json();
            if (result.success) {
                setProperty(result.data);
            } else {
                setError(result.error || 'Property not found');
            }
        } catch {
            setError('Failed to load property');
        } finally {
            setLoading(false);
        }
    }, [propertyId]);

    useEffect(() => {
        fetchProperty();
    }, [fetchProperty]);

    const handleEdit = async () => {
        setSaving(true);
        try {
            const response = await fetch(`/api/properties/${propertyId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });
            const result = await response.json();
            if (result.success) {
                setShowEditModal(false);
                fetchProperty();
            } else {
                alert(result.error || 'Failed to update property');
            }
        } catch {
            alert('Failed to update property');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const response = await fetch(`/api/properties/${propertyId}`, {
                method: 'DELETE',
            });
            const result = await response.json();
            if (result.success) {
                router.push('/properties');
            } else {
                alert(result.error || 'Failed to delete property');
            }
        } catch {
            alert('Failed to delete property');
        } finally {
            setDeleting(false);
        }
    };

    const openEditModal = () => {
        if (property) {
            setEditForm({
                name: property.name,
                address: property.address,
                city: property.city,
                country: property.country,
            });
            setShowEditModal(true);
        }
    };

    const occupiedUnits = property?.units.filter(u => u.status === 'OCCUPIED').length ?? 0;
    const vacantUnits = property?.units.filter(u => u.status === 'VACANT').length ?? 0;
    const totalRent = property?.units.reduce((sum, u) => sum + u.rentAmount, 0) ?? 0;

    const unitColumns = [
        {
            key: 'unitNumber',
            header: 'Unit',
            render: (row: Unit) => <span className="font-medium">{row.unitNumber}</span>,
        },
        {
            key: 'tenant',
            header: 'Current Tenant',
            render: (row: Unit) => {
                const activeLease = row.leases?.[0];
                return activeLease ? activeLease.tenant.fullName : <span className="text-text-muted">Vacant</span>;
            },
        },
        {
            key: 'bedrooms',
            header: 'Beds/Baths',
            render: (row: Unit) => `${row.bedrooms} / ${row.bathrooms}`,
        },
        {
            key: 'rentAmount',
            header: 'Rent',
            render: (row: Unit) => <span className="font-semibold">R{row.rentAmount.toLocaleString()}</span>,
        },
        {
            key: 'status',
            header: 'Status',
            render: (row: Unit) => (
                <Badge variant={statusVariants[row.status] || 'info'}>
                    {row.status.replace('_', ' ')}
                </Badge>
            ),
        },
    ];

    if (loading) {
        return (
            <AppShell title="Property Details">
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
            </AppShell>
        );
    }

    if (error || !property) {
        return (
            <AppShell title="Property Details">
                <div className="text-center py-20">
                    <AlertCircle className="w-16 h-16 text-danger mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Property Not Found</h2>
                    <p className="text-text-secondary mb-4">{error}</p>
                    <Button onClick={() => router.push('/properties')}>
                        <ArrowLeft className="w-4 h-4" /> Back to Properties
                    </Button>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell
            title={property.name}
            breadcrumbs={[
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Properties', href: '/properties' },
                { label: property.name },
            ]}
        >
            {/* Property Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{property.name}</h1>
                            <div className="flex items-center gap-1 text-text-secondary">
                                <MapPin className="w-4 h-4" />
                                {property.address}, {property.city}, {property.country}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={openEditModal}>
                        <Edit className="w-4 h-4" /> Edit
                    </Button>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(true)}>
                        <Trash2 className="w-4 h-4" /> Delete
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Home className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-sm text-text-muted">Total Units</div>
                            <div className="text-xl font-bold">{property.units.length}</div>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <Users className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <div className="text-sm text-text-muted">Occupied</div>
                            <div className="text-xl font-bold text-success">{occupiedUnits}</div>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                            <Home className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <div className="text-sm text-text-muted">Vacant</div>
                            <div className="text-xl font-bold text-warning">{vacantUnits}</div>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <div className="text-sm text-text-muted">Total Rent</div>
                            <div className="text-xl font-bold">R{totalRent.toLocaleString()}</div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Units Table */}
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Units</h3>
                    <Button
                        size="sm"
                        onClick={() => router.push(`/units?action=new&propertyId=${propertyId}`)}
                    >
                        <Plus className="w-4 h-4" /> Add Unit
                    </Button>
                </div>
                {property.units.length > 0 ? (
                    <Table columns={unitColumns} data={property.units} />
                ) : (
                    <EmptyState
                        icon={<Home className="w-16 h-16" />}
                        title="No units yet"
                        description="Add your first unit to this property"
                        actionLabel="Add Unit"
                        onAction={() => router.push(`/units?action=new&propertyId=${propertyId}`)}
                    />
                )}
            </Card>

            {/* Edit Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Edit Property"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
                        <Button onClick={handleEdit} disabled={saving}>
                            {saving ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <Input
                        label="Property Name"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        required
                    />
                    <Input
                        label="Address"
                        value={editForm.address}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        required
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="City"
                            value={editForm.city}
                            onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                            required
                        />
                        <Input
                            label="Country"
                            value={editForm.country}
                            onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                            required
                        />
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Delete Property"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                        <Button onClick={handleDelete} disabled={deleting}>
                            {deleting ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</>
                            ) : (
                                'Delete Property'
                            )}
                        </Button>
                    </>
                }
            >
                <div className="text-center py-4">
                    <AlertCircle className="w-12 h-12 text-danger mx-auto mb-3" />
                    <p className="text-lg font-medium mb-2">
                        Are you sure you want to delete &quot;{property.name}&quot;?
                    </p>
                    <p className="text-text-secondary">
                        This will permanently delete the property and all its units, leases, and related data.
                        This action cannot be undone.
                    </p>
                </div>
            </Modal>
        </AppShell>
    );
}
