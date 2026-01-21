'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import {
    ClipboardCheck,
    Save,
    ArrowLeft,
    Home,
    User,
    Calendar,
    CheckCircle2,
    Clock,
    Camera,
    Loader2,
} from 'lucide-react';
import Link from 'next/link';

interface InspectionItem {
    id: string;
    room: string;
    item: string;
    condition: string;
    notes: string | null;
    photos: string;
}

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
    items: InspectionItem[];
    signatures: Array<{ id: string; signedBy: string; signedAt: string }>;
}

const CONDITION_OPTIONS = [
    { value: 'GOOD', label: 'Good' },
    { value: 'FAIR', label: 'Fair' },
    { value: 'POOR', label: 'Poor' },
    { value: 'DAMAGED', label: 'Damaged' },
    { value: 'N/A', label: 'N/A' },
];

const CONDITION_COLORS: Record<string, string> = {
    GOOD: 'bg-green-100 text-green-800',
    FAIR: 'bg-yellow-100 text-yellow-800',
    POOR: 'bg-orange-100 text-orange-800',
    DAMAGED: 'bg-red-100 text-red-800',
    'N/A': 'bg-gray-100 text-gray-600',
};

const ROOM_LABELS: Record<string, string> = {
    LIVING_ROOM: 'Living Room',
    KITCHEN: 'Kitchen',
    BEDROOM_1: 'Bedroom 1',
    BEDROOM_2: 'Bedroom 2',
    BATHROOM: 'Bathroom',
    ENTRANCE: 'Entrance',
};

const ITEM_LABELS: Record<string, string> = {
    WALLS: 'Walls',
    FLOORS: 'Floors',
    WINDOWS: 'Windows',
    DOORS: 'Doors',
    FIXTURES: 'Fixtures',
    ELECTRICAL: 'Electrical',
};

const TYPE_LABELS: Record<string, string> = {
    MOVE_IN: 'Move-In',
    PERIODIC: 'Periodic',
    MOVE_OUT: 'Move-Out',
};

export default function InspectionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const inspectionId = params.id as string;

    const [inspection, setInspection] = useState<Inspection | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editedItems, setEditedItems] = useState<Record<string, { condition: string; notes: string }>>({});
    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState('');

    useEffect(() => {
        fetchInspection();
    }, [inspectionId]);

    const fetchInspection = async () => {
        try {
            const response = await fetch(`/api/inspections/${inspectionId}`);
            const result = await response.json();
            if (result.success) {
                setInspection(result.data);
                setNotes(result.data.notes || '');
                setStatus(result.data.status);
                // Initialize edited items
                const items: Record<string, { condition: string; notes: string }> = {};
                result.data.items.forEach((item: InspectionItem) => {
                    items[item.id] = { condition: item.condition, notes: item.notes || '' };
                });
                setEditedItems(items);
            }
        } catch (error) {
            console.error('Failed to fetch inspection:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleItemChange = (itemId: string, field: 'condition' | 'notes', value: string) => {
        setEditedItems((prev) => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                [field]: value,
            },
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const itemsToUpdate = Object.entries(editedItems).map(([id, data]) => ({
                id,
                condition: data.condition,
                notes: data.notes || null,
            }));

            const response = await fetch(`/api/inspections/${inspectionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status,
                    notes,
                    items: itemsToUpdate,
                    completedAt: status === 'COMPLETED' ? new Date().toISOString() : null,
                }),
            });

            const result = await response.json();
            if (result.success) {
                setInspection(result.data);
            }
        } catch (error) {
            console.error('Failed to save inspection:', error);
        } finally {
            setSaving(false);
        }
    };

    // Group items by room
    const groupedItems = inspection?.items.reduce((acc, item) => {
        if (!acc[item.room]) {
            acc[item.room] = [];
        }
        acc[item.room].push(item);
        return acc;
    }, {} as Record<string, InspectionItem[]>) || {};

    if (loading) {
        return (
            <AppShell title="Inspection Details">
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </AppShell>
        );
    }

    if (!inspection) {
        return (
            <AppShell title="Inspection Details">
                <Card>
                    <div className="text-center py-10">
                        <p className="text-text-secondary">Inspection not found</p>
                        <Link href="/inspections">
                            <Button className="mt-4">Back to Inspections</Button>
                        </Link>
                    </div>
                </Card>
            </AppShell>
        );
    }

    return (
        <AppShell title="Inspection Details">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/inspections">
                        <Button variant="secondary" size="sm">
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-semibold">
                            {TYPE_LABELS[inspection.type] || inspection.type} Inspection
                        </h1>
                        <div className="flex items-center gap-3 text-sm text-text-secondary mt-1">
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
                                {new Date(inspection.scheduledDate).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>

            {/* Status Card */}
            <Card className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select
                        label="Status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        options={[
                            { value: 'SCHEDULED', label: 'Scheduled' },
                            { value: 'IN_PROGRESS', label: 'In Progress' },
                            { value: 'COMPLETED', label: 'Completed' },
                            { value: 'CANCELLED', label: 'Cancelled' },
                        ]}
                    />
                    <div className="md:col-span-2">
                        <Input
                            label="Notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="General notes about this inspection..."
                        />
                    </div>
                </div>
            </Card>

            {/* Inspection Items by Room */}
            <div className="space-y-6">
                {Object.entries(groupedItems).map(([room, items]) => (
                    <Card key={room} title={ROOM_LABELS[room] || room}>
                        <div className="space-y-4">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex-1">
                                        <div className="font-medium">
                                            {ITEM_LABELS[item.item] || item.item}
                                        </div>
                                    </div>
                                    <div className="flex flex-col md:flex-row gap-3 md:items-center">
                                        <Select
                                            value={editedItems[item.id]?.condition || item.condition}
                                            onChange={(e) => handleItemChange(item.id, 'condition', e.target.value)}
                                            options={CONDITION_OPTIONS}
                                        />
                                        <Input
                                            value={editedItems[item.id]?.notes || ''}
                                            onChange={(e) => handleItemChange(item.id, 'notes', e.target.value)}
                                            placeholder="Notes..."
                                            className="md:w-48"
                                        />
                                        <Button variant="secondary" size="sm" disabled>
                                            <Camera className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Signatures Section */}
            <Card title="Signatures" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                        <div className="text-sm text-text-secondary mb-2">Landlord Signature</div>
                        {inspection.signatures.find((s) => s.signedBy === 'LANDLORD') ? (
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle2 className="w-5 h-5" />
                                <span>Signed</span>
                            </div>
                        ) : (
                            <Button variant="secondary" size="sm" disabled>
                                Sign as Landlord
                            </Button>
                        )}
                    </div>
                    <div className="p-4 border rounded-lg">
                        <div className="text-sm text-text-secondary mb-2">Tenant Signature</div>
                        {inspection.signatures.find((s) => s.signedBy === 'TENANT') ? (
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle2 className="w-5 h-5" />
                                <span>Signed</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-text-muted">
                                <Clock className="w-5 h-5" />
                                <span>Pending tenant signature</span>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </AppShell>
    );
}
