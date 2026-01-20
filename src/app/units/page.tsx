'use client';

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
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/ui/Dropdown';
import { useUnits, useProperties, useMutation } from '@/lib/hooks';
import {
    Plus,
    Download,
    DoorOpen,
    Search,
    MoreVertical,
    Eye,
    Edit,
    Trash2,
    Loader2,
} from 'lucide-react';

interface UnitFormData {
    unitNumber: string;
    propertyId: string;
    bedrooms: number;
    bathrooms: number;
    rentAmount: number;
}

const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'vacant', label: 'Vacant' },
    { value: 'occupied', label: 'Occupied' },
];

export default function UnitsPage() {
    const searchParams = useSearchParams();
    const [propertyFilter, setPropertyFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const { data: units, loading, error, refetch } = useUnits(propertyFilter, statusFilter);
    const { data: properties } = useProperties();
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState<UnitFormData>({
        unitNumber: '',
        propertyId: '',
        bedrooms: 1,
        bathrooms: 1,
        rentAmount: 0,
    });

    // Auto-open modal if action=new in URL
    useEffect(() => {
        if (searchParams.get('action') === 'new') {
            setShowAddModal(true);
        }
    }, [searchParams]);

    const { mutate: createUnit, loading: creating } = useMutation<UnitFormData>({
        url: '/api/units',
        onSuccess: () => {
            setShowAddModal(false);
            setFormData({ unitNumber: '', propertyId: '', bedrooms: 1, bathrooms: 1, rentAmount: 0 });
            refetch();
        },
    });

    const handleSubmit = async () => {
        if (!formData.unitNumber || !formData.propertyId || !formData.rentAmount) return;
        await createUnit(formData);
    };

    const propertyOptions = [
        { value: '', label: 'All Properties' },
        ...(properties?.map(p => ({ value: p.id, label: p.name })) || [])
    ];

    const filteredUnits = units?.filter(u =>
        u.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.property?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    ) ?? [];

    const columns = [
        {
            key: 'unitNumber',
            header: 'Unit',
            render: (row: typeof filteredUnits[0]) => (
                <div className="font-medium">{row.unitNumber}</div>
            )
        },
        {
            key: 'property',
            header: 'Property',
            render: (row: typeof filteredUnits[0]) => row.property?.name || '-'
        },
        {
            key: 'bedrooms',
            header: 'Beds/Baths',
            render: (row: typeof filteredUnits[0]) => `${row.bedrooms} bed / ${row.bathrooms} bath`
        },
        {
            key: 'rentAmount',
            header: 'Rent',
            render: (row: typeof filteredUnits[0]) => `R${row.rentAmount.toLocaleString()}`
        },
        {
            key: 'status',
            header: 'Status',
            render: (row: typeof filteredUnits[0]) => (
                <Badge variant={row.status === 'VACANT' ? 'vacant' : 'occupied'}>
                    {row.status}
                </Badge>
            )
        },
        {
            key: 'actions',
            header: '',
            render: (row: typeof filteredUnits[0]) => (
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
            title="Units"
            breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Units' }]}
        >
            {/* Page Header */}
            <div className="page-header">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Search units..."
                            className="form-input pl-10 w-64"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Select
                        options={propertyOptions}
                        value={propertyFilter}
                        onChange={(e) => setPropertyFilter(e.target.value)}
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
                    <Button onClick={() => setShowAddModal(true)}>
                        <Plus className="w-4 h-4" />
                        Add Unit
                    </Button>
                </div>
            </div>

            {/* Units List */}
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
                ) : filteredUnits.length > 0 ? (
                    <Table columns={columns} data={filteredUnits} />
                ) : (
                    <EmptyState
                        icon={<DoorOpen className="w-16 h-16" />}
                        title="No units yet"
                        description="Add units to your properties to start managing rentals"
                        actionLabel="Add Unit"
                        onAction={() => setShowAddModal(true)}
                    />
                )}
            </Card>

            {/* Add Unit Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Add Unit"
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
                                'Add Unit'
                            )}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <Select
                        label="Property"
                        options={properties?.map(p => ({ value: p.id, label: p.name })) || []}
                        value={formData.propertyId}
                        onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                        placeholder="Select property"
                    />
                    <Input
                        label="Unit Number"
                        placeholder="e.g. A1, 101, Ground Floor"
                        value={formData.unitNumber}
                        onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                        required
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Bedrooms"
                            type="number"
                            min={0}
                            value={formData.bedrooms}
                            onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) || 0 })}
                        />
                        <Input
                            label="Bathrooms"
                            type="number"
                            min={0}
                            value={formData.bathrooms}
                            onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value) || 0 })}
                        />
                    </div>
                    <Input
                        label="Monthly Rent (R)"
                        type="number"
                        min={0}
                        value={formData.rentAmount}
                        onChange={(e) => setFormData({ ...formData, rentAmount: parseFloat(e.target.value) || 0 })}
                        required
                    />
                </div>
            </Modal>
        </AppShell>
    );
}
