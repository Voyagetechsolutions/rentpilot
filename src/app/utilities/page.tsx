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
    Zap,
    Plus,
    Home,
    User,
    Calendar,
    Loader2,
    Droplets,
    Flame,
    Wifi,
    Trash2,
    Edit2,
    TrendingUp,
} from 'lucide-react';

interface UtilityBilling {
    id: string;
    type: string;
    billingMethod: string;
    fixedAmount: number | null;
    ratePerUnit: number | null;
    lease: {
        id: string;
        tenant: {
            fullName: string;
        };
        unit: {
            unitNumber: string;
            property: {
                name: string;
            };
        };
    };
    readings: MeterReading[];
}

interface MeterReading {
    id: string;
    month: string;
    previousReading: number;
    currentReading: number;
    unitsUsed: number;
    totalCharge: number;
}

interface Lease {
    id: string;
    tenant: {
        fullName: string;
    };
    unit: {
        unitNumber: string;
        property: {
            name: string;
        };
    };
}

const UTILITY_ICONS: Record<string, React.ReactNode> = {
    ELECTRICITY: <Zap className="w-5 h-5" />,
    WATER: <Droplets className="w-5 h-5" />,
    GAS: <Flame className="w-5 h-5" />,
    WIFI: <Wifi className="w-5 h-5" />,
    REFUSE: <Trash2 className="w-5 h-5" />,
};

const UTILITY_COLORS: Record<string, string> = {
    ELECTRICITY: 'bg-yellow-100 text-yellow-600',
    WATER: 'bg-blue-100 text-blue-600',
    GAS: 'bg-orange-100 text-orange-600',
    WIFI: 'bg-purple-100 text-purple-600',
    REFUSE: 'bg-gray-100 text-gray-600',
};

export default function UtilitiesPage() {
    const [utilities, setUtilities] = useState<UtilityBilling[]>([]);
    const [leases, setLeases] = useState<Lease[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showReadingModal, setShowReadingModal] = useState(false);
    const [selectedUtility, setSelectedUtility] = useState<UtilityBilling | null>(null);
    const [creating, setCreating] = useState(false);
    const [formData, setFormData] = useState({
        leaseId: '',
        type: 'ELECTRICITY',
        billingMethod: 'METERED',
        fixedAmount: '',
        ratePerUnit: '',
    });
    const [readingData, setReadingData] = useState({
        month: new Date().toISOString().substring(0, 7),
        previousReading: '',
        currentReading: '',
    });

    useEffect(() => {
        fetchUtilities();
        fetchLeases();
    }, []);

    const fetchUtilities = async () => {
        try {
            const response = await fetch('/api/utilities');
            const result = await response.json();
            if (result.success) {
                setUtilities(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch utilities:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLeases = async () => {
        try {
            const response = await fetch('/api/leases?status=ACTIVE');
            const result = await response.json();
            if (result.success) {
                setLeases(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch leases:', error);
        }
    };

    const handleCreateUtility = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);

        try {
            const response = await fetch('/api/utilities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    fixedAmount: formData.fixedAmount ? parseFloat(formData.fixedAmount) : null,
                    ratePerUnit: formData.ratePerUnit ? parseFloat(formData.ratePerUnit) : null,
                }),
            });

            const result = await response.json();
            if (result.success) {
                setShowModal(false);
                setFormData({ leaseId: '', type: 'ELECTRICITY', billingMethod: 'METERED', fixedAmount: '', ratePerUnit: '' });
                fetchUtilities();
            }
        } catch (error) {
            console.error('Failed to create utility:', error);
        } finally {
            setCreating(false);
        }
    };

    const handleAddReading = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUtility) return;

        try {
            const prev = parseFloat(readingData.previousReading);
            const curr = parseFloat(readingData.currentReading);
            const unitsUsed = curr - prev;
            const totalCharge = unitsUsed * (selectedUtility.ratePerUnit || 0);

            const response = await fetch(`/api/utilities/${selectedUtility.id}/readings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...readingData,
                    previousReading: prev,
                    currentReading: curr,
                    unitsUsed,
                    totalCharge,
                }),
            });

            const result = await response.json();
            if (result.success) {
                setShowReadingModal(false);
                setReadingData({ month: new Date().toISOString().substring(0, 7), previousReading: '', currentReading: '' });
                fetchUtilities();
            }
        } catch (error) {
            console.error('Failed to add reading:', error);
        }
    };

    // Calculate totals
    const totalThisMonth = utilities.reduce((sum, u) => {
        const latestReading = u.readings[0];
        if (latestReading) {
            return sum + latestReading.totalCharge;
        }
        if (u.billingMethod === 'FIXED' && u.fixedAmount) {
            return sum + u.fixedAmount;
        }
        return sum;
    }, 0);

    return (
        <AppShell title="Utilities Billing">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <div className="text-sm text-text-secondary">Electricity</div>
                            <div className="text-xl font-bold">
                                {utilities.filter(u => u.type === 'ELECTRICITY').length}
                            </div>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Droplets className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-sm text-text-secondary">Water</div>
                            <div className="text-xl font-bold">
                                {utilities.filter(u => u.type === 'WATER').length}
                            </div>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <div className="text-sm text-text-secondary">This Month</div>
                            <div className="text-xl font-bold">
                                R{totalThisMonth.toLocaleString()}
                            </div>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Home className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <div className="text-sm text-text-secondary">Active Configs</div>
                            <div className="text-xl font-bold">{utilities.length}</div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Action Button */}
            <div className="flex justify-end mb-6">
                <Button onClick={() => setShowModal(true)}>
                    <Plus className="w-4 h-4" />
                    Add Utility
                </Button>
            </div>

            {/* Utilities List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : utilities.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={<Zap className="w-16 h-16" />}
                        title="No utilities configured"
                        description="Set up utility billing to track electricity, water, and other charges"
                        actionLabel="Add Utility"
                        onAction={() => setShowModal(true)}
                    />
                </Card>
            ) : (
                <div className="space-y-4">
                    {utilities.map((utility) => (
                        <Card key={utility.id}>
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${UTILITY_COLORS[utility.type]}`}>
                                        {UTILITY_ICONS[utility.type] || <Zap className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold">{utility.type}</h3>
                                            <Badge variant="default">
                                                {utility.billingMethod}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-text-secondary mt-1">
                                            <span className="flex items-center gap-1">
                                                <Home className="w-4 h-4" />
                                                {utility.lease.unit.property.name} - Unit {utility.lease.unit.unitNumber}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <User className="w-4 h-4" />
                                                {utility.lease.tenant.fullName}
                                            </span>
                                        </div>
                                        {utility.billingMethod === 'METERED' && (
                                            <div className="text-sm text-text-secondary mt-1">
                                                Rate: R{utility.ratePerUnit}/unit
                                            </div>
                                        )}
                                        {utility.billingMethod === 'FIXED' && (
                                            <div className="text-sm text-text-secondary mt-1">
                                                Fixed: R{utility.fixedAmount}/month
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    {utility.readings.length > 0 && (
                                        <>
                                            <div className="text-2xl font-bold text-primary">
                                                R{utility.readings[0].totalCharge.toLocaleString()}
                                            </div>
                                            <div className="text-sm text-text-secondary">
                                                {utility.readings[0].unitsUsed} units ({utility.readings[0].month})
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Recent Readings */}
                            {utility.readings.length > 0 && (
                                <div className="mt-4 pt-4 border-t">
                                    <div className="text-sm font-medium mb-2">Recent Readings</div>
                                    <div className="space-y-2">
                                        {utility.readings.slice(0, 3).map((reading) => (
                                            <div key={reading.id} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                                                <span>{reading.month}</span>
                                                <span>{reading.previousReading} → {reading.currentReading}</span>
                                                <span>{reading.unitsUsed} units</span>
                                                <span className="font-medium">R{reading.totalCharge.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="mt-4 pt-4 border-t flex gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedUtility(utility);
                                        // Set previous reading from last reading if exists
                                        if (utility.readings.length > 0) {
                                            setReadingData(prev => ({
                                                ...prev,
                                                previousReading: utility.readings[0].currentReading.toString(),
                                            }));
                                        }
                                        setShowReadingModal(true);
                                    }}
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Add Reading
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Utility Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Add Utility Configuration"
            >
                <form onSubmit={handleCreateUtility} className="space-y-4">
                    <Select
                        label="Lease *"
                        value={formData.leaseId}
                        onChange={(e) => setFormData({ ...formData, leaseId: e.target.value })}
                        options={[
                            { value: '', label: 'Select a lease' },
                            ...leases.map((lease) => ({
                                value: lease.id,
                                label: `${lease.tenant.fullName} - ${lease.unit.property.name} Unit ${lease.unit.unitNumber}`,
                            })),
                        ]}
                        required
                    />

                    <Select
                        label="Utility Type *"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        options={[
                            { value: 'ELECTRICITY', label: 'Electricity' },
                            { value: 'WATER', label: 'Water' },
                            { value: 'GAS', label: 'Gas' },
                            { value: 'WIFI', label: 'WiFi/Internet' },
                            { value: 'REFUSE', label: 'Refuse/Waste' },
                            { value: 'OTHER', label: 'Other' },
                        ]}
                        required
                    />

                    <Select
                        label="Billing Method *"
                        value={formData.billingMethod}
                        onChange={(e) => setFormData({ ...formData, billingMethod: e.target.value })}
                        options={[
                            { value: 'METERED', label: 'Metered (usage-based)' },
                            { value: 'FIXED', label: 'Fixed monthly' },
                            { value: 'PREPAID', label: 'Prepaid' },
                        ]}
                        required
                    />

                    {formData.billingMethod === 'FIXED' && (
                        <Input
                            label="Fixed Amount (R/month) *"
                            type="number"
                            value={formData.fixedAmount}
                            onChange={(e) => setFormData({ ...formData, fixedAmount: e.target.value })}
                            required
                        />
                    )}

                    {formData.billingMethod === 'METERED' && (
                        <Input
                            label="Rate per Unit (R) *"
                            type="number"
                            step="0.01"
                            value={formData.ratePerUnit}
                            onChange={(e) => setFormData({ ...formData, ratePerUnit: e.target.value })}
                            required
                        />
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={creating}>
                            {creating ? 'Creating...' : 'Add Utility'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Add Reading Modal */}
            <Modal
                isOpen={showReadingModal}
                onClose={() => setShowReadingModal(false)}
                title="Add Meter Reading"
            >
                <form onSubmit={handleAddReading} className="space-y-4">
                    <Input
                        label="Month *"
                        type="month"
                        value={readingData.month}
                        onChange={(e) => setReadingData({ ...readingData, month: e.target.value })}
                        required
                    />

                    <Input
                        label="Previous Reading *"
                        type="number"
                        value={readingData.previousReading}
                        onChange={(e) => setReadingData({ ...readingData, previousReading: e.target.value })}
                        required
                    />

                    <Input
                        label="Current Reading *"
                        type="number"
                        value={readingData.currentReading}
                        onChange={(e) => setReadingData({ ...readingData, currentReading: e.target.value })}
                        required
                    />

                    {readingData.previousReading && readingData.currentReading && selectedUtility?.ratePerUnit && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <div className="text-sm text-blue-800">
                                <strong>Units Used:</strong> {parseFloat(readingData.currentReading) - parseFloat(readingData.previousReading)}
                            </div>
                            <div className="text-sm text-blue-800">
                                <strong>Total Charge:</strong> R{((parseFloat(readingData.currentReading) - parseFloat(readingData.previousReading)) * (selectedUtility?.ratePerUnit || 0)).toFixed(2)}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setShowReadingModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            Add Reading
                        </Button>
                    </div>
                </form>
            </Modal>
        </AppShell>
    );
}
