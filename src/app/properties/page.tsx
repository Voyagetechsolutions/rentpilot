'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/ui/Dropdown';
import { useProperties, useMutation } from '@/lib/hooks';
import {
    Plus,
    Download,
    Building2,
    Search,
    MoreVertical,
    Eye,
    Edit,
    Trash2,
    Loader2,
    AlertCircle,
} from 'lucide-react';

interface PropertyFormData {
    name: string;
    address: string;
    city: string;
    country: string;
}

export default function PropertiesPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { data: properties, loading, error, refetch } = useProperties();
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState<PropertyFormData>({
        name: '',
        address: '',
        city: '',
        country: 'South Africa',
    });

    // Edit state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingId, setEditingId] = useState('');
    const [editForm, setEditForm] = useState<PropertyFormData>({ name: '', address: '', city: '', country: '' });
    const [editSaving, setEditSaving] = useState(false);

    // Delete state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingProperty, setDeletingProperty] = useState<{ id: string; name: string } | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Auto-open modal if action=new in URL
    useEffect(() => {
        if (searchParams.get('action') === 'new') {
            setShowAddModal(true);
        }
    }, [searchParams]);

    const { mutate: createProperty, loading: creating } = useMutation<PropertyFormData>({
        url: '/api/properties',
        onSuccess: () => {
            setShowAddModal(false);
            setFormData({ name: '', address: '', city: '', country: 'South Africa' });
            refetch();
        },
    });

    const handleSubmit = async () => {
        if (!formData.name || !formData.address || !formData.city) return;
        await createProperty(formData);
    };

    const handleView = (id: string) => {
        router.push(`/properties/${id}`);
    };

    const handleEditOpen = (row: { id: string; name: string; address: string; city: string; country: string }) => {
        setEditingId(row.id);
        setEditForm({ name: row.name, address: row.address, city: row.city, country: row.country });
        setShowEditModal(true);
    };

    const handleEditSubmit = async () => {
        setEditSaving(true);
        try {
            const response = await fetch(`/api/properties/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });
            const result = await response.json();
            if (result.success) {
                setShowEditModal(false);
                refetch();
            } else {
                alert(result.error || 'Failed to update property');
            }
        } catch {
            alert('Failed to update property');
        } finally {
            setEditSaving(false);
        }
    };

    const handleDeleteOpen = (row: { id: string; name: string }) => {
        setDeletingProperty({ id: row.id, name: row.name });
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingProperty) return;
        setDeleteLoading(true);
        try {
            const response = await fetch(`/api/properties/${deletingProperty.id}`, { method: 'DELETE' });
            const result = await response.json();
            if (result.success) {
                setShowDeleteModal(false);
                setDeletingProperty(null);
                refetch();
            } else {
                alert(result.error || 'Failed to delete property');
            }
        } catch {
            alert('Failed to delete property');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleExport = () => {
        if (!properties || properties.length === 0) return;
        const headers = ['Name', 'Address', 'City', 'Country', 'Units'];
        const rows = properties.map(p => [p.name, p.address, p.city, p.country, p.units?.length ?? 0].join(','));
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'properties.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const filteredProperties = properties?.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.address.toLowerCase().includes(searchQuery.toLowerCase())
    ) ?? [];

    const columns = [
        {
            key: 'name',
            header: 'Property Name',
            render: (row: typeof filteredProperties[0]) => (
                <div className="font-medium">{row.name}</div>
            )
        },
        { key: 'address', header: 'Address' },
        { key: 'city', header: 'City' },
        {
            key: 'units',
            header: 'Units',
            render: (row: typeof filteredProperties[0]) => row.units?.length ?? 0
        },
        {
            key: 'actions',
            header: '',
            render: (row: typeof filteredProperties[0]) => (
                <Dropdown
                    trigger={
                        <button className="btn btn-icon btn-tertiary" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="w-4 h-4" />
                        </button>
                    }
                >
                    <DropdownItem icon={<Eye className="w-4 h-4" />} onClick={() => handleView(row.id)}>View Details</DropdownItem>
                    <DropdownItem icon={<Edit className="w-4 h-4" />} onClick={() => handleEditOpen(row)}>Edit</DropdownItem>
                    <DropdownDivider />
                    <DropdownItem icon={<Trash2 className="w-4 h-4" />} danger onClick={() => handleDeleteOpen(row)}>Delete</DropdownItem>
                </Dropdown>
            )
        },
    ];

    return (
        <AppShell
            title="Properties"
            breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Properties' }]}
        >
            {/* Page Header */}
            <div className="page-header">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Search properties..."
                            className="form-input pl-10 w-64"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="page-actions">
                    <Button variant="secondary" onClick={handleExport}>
                        <Download className="w-4 h-4" />
                        Export
                    </Button>
                    <Button onClick={() => setShowAddModal(true)}>
                        <Plus className="w-4 h-4" />
                        Add Property
                    </Button>
                </div>
            </div>

            {/* Properties List */}
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
                ) : filteredProperties.length > 0 ? (
                    <Table
                        columns={columns}
                        data={filteredProperties}
                        onRowClick={(row) => router.push(`/properties/${row.id}`)}
                    />
                ) : (
                    <EmptyState
                        icon={<Building2 className="w-16 h-16" />}
                        title="No properties yet"
                        description="Add your first property to start managing your rental portfolio"
                        actionLabel="Add Property"
                        onAction={() => setShowAddModal(true)}
                    />
                )}
            </Card>

            {/* Add Property Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Add Property"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={creating}>
                            {creating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                'Add Property'
                            )}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <Input
                        label="Property Name"
                        placeholder="e.g. Sunset Flats"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <Input
                        label="Address"
                        placeholder="123 Main Street"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        required
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="City"
                            placeholder="Cape Town"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            required
                        />
                        <Input
                            label="Country"
                            placeholder="South Africa"
                            value={formData.country}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            required
                        />
                    </div>
                </div>
            </Modal>

            {/* Edit Property Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Edit Property"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
                        <Button onClick={handleEditSubmit} disabled={editSaving}>
                            {editSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <Input label="Property Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
                    <Input label="Address" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} required />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="City" value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} required />
                        <Input label="Country" value={editForm.country} onChange={(e) => setEditForm({ ...editForm, country: e.target.value })} required />
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
                        <Button onClick={handleDeleteConfirm} disabled={deleteLoading}>
                            {deleteLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</> : 'Delete Property'}
                        </Button>
                    </>
                }
            >
                <div className="text-center py-4">
                    <AlertCircle className="w-12 h-12 text-danger mx-auto mb-3" />
                    <p className="text-lg font-medium mb-2">
                        Are you sure you want to delete &quot;{deletingProperty?.name}&quot;?
                    </p>
                    <p className="text-text-secondary">
                        This will permanently delete the property making this action irreversible.
                    </p>
                </div>
            </Modal>
        </AppShell>
    );
}
