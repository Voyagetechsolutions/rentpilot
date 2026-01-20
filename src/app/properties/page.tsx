'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
} from 'lucide-react';

interface PropertyFormData {
    name: string;
    address: string;
    city: string;
    country: string;
}

export default function PropertiesPage() {
    const searchParams = useSearchParams();
    const { data: properties, loading, error, refetch } = useProperties();
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState<PropertyFormData>({
        name: '',
        address: '',
        city: '',
        country: 'South Africa',
    });

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
                        <button className="btn btn-icon btn-tertiary">
                            <MoreVertical className="w-4 h-4" />
                        </button>
                    }
                >
                    <DropdownItem icon={<Eye className="w-4 h-4" />}>View Details</DropdownItem>
                    <DropdownItem icon={<Edit className="w-4 h-4" />}>Edit</DropdownItem>
                    <DropdownDivider />
                    <DropdownItem icon={<Trash2 className="w-4 h-4" />} danger>Delete</DropdownItem>
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
                    <Button variant="secondary">
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
                        onRowClick={(row) => window.location.href = `/properties/${row.id}`}
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
        </AppShell>
    );
}
