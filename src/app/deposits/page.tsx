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
    Wallet,
    Plus,
    Home,
    User,
    Calendar,
    Loader2,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    MinusCircle,
} from 'lucide-react';

interface Deposit {
    id: string;
    amount: number;
    paidDate: string | null;
    bankName: string | null;
    accountNumber: string | null;
    interestRate: number;
    accruedInterest: number;
    refundedAmount: number | null;
    status: string;
    lease: {
        id: string;
        startDate: string;
        endDate: string;
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
    deductions: Array<{
        id: string;
        reason: string;
        description: string;
        amount: number;
    }>;
    disputes: Array<{
        id: string;
        reason: string;
        status: string;
    }>;
}

interface Lease {
    id: string;
    deposit: number;
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

const STATUS_COLORS: Record<string, 'default' | 'warning' | 'success' | 'danger'> = {
    PENDING: 'warning',
    HELD: 'default',
    REFUNDED: 'success',
    PARTIALLY_REFUNDED: 'warning',
};

export default function DepositsPage() {
    const [deposits, setDeposits] = useState<Deposit[]>([]);
    const [leasesWithoutDeposit, setLeasesWithoutDeposit] = useState<Lease[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeductionModal, setShowDeductionModal] = useState(false);
    const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
    const [creating, setCreating] = useState(false);
    const [formData, setFormData] = useState({
        leaseId: '',
        amount: '',
        paidDate: '',
        bankName: '',
        accountNumber: '',
    });
    const [deductionData, setDeductionData] = useState({
        reason: 'DAMAGE',
        description: '',
        amount: '',
    });

    useEffect(() => {
        fetchDeposits();
        fetchLeasesWithoutDeposit();
    }, []);

    const fetchDeposits = async () => {
        try {
            const response = await fetch('/api/deposits');
            const result = await response.json();
            if (result.success) {
                setDeposits(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch deposits:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLeasesWithoutDeposit = async () => {
        try {
            const response = await fetch('/api/leases?status=ACTIVE');
            const result = await response.json();
            if (result.success) {
                // Filter leases that don't have a deposit record yet
                const leasesWithDeposits = deposits.map(d => d.lease.id);
                const available = result.data.filter((l: Lease) => !leasesWithDeposits.includes(l.id));
                setLeasesWithoutDeposit(available);
            }
        } catch (error) {
            console.error('Failed to fetch leases:', error);
        }
    };

    const handleCreateDeposit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);

        try {
            const response = await fetch('/api/deposits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    amount: parseFloat(formData.amount),
                }),
            });

            const result = await response.json();
            if (result.success) {
                setShowModal(false);
                setFormData({ leaseId: '', amount: '', paidDate: '', bankName: '', accountNumber: '' });
                fetchDeposits();
            }
        } catch (error) {
            console.error('Failed to create deposit:', error);
        } finally {
            setCreating(false);
        }
    };

    const calculateTotalWithInterest = (deposit: Deposit) => {
        // Calculate months held
        if (!deposit.paidDate) return deposit.amount;
        const paidDate = new Date(deposit.paidDate);
        const now = new Date();
        const monthsHeld = Math.floor((now.getTime() - paidDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
        const monthlyRate = deposit.interestRate / 100 / 12;
        const interest = deposit.amount * monthlyRate * monthsHeld;
        return deposit.amount + interest;
    };

    const getTotalDeductions = (deposit: Deposit) => {
        return deposit.deductions.reduce((sum, d) => sum + d.amount, 0);
    };

    return (
        <AppShell title="Deposit Management">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-sm text-text-secondary">Total Held</div>
                            <div className="text-xl font-bold">
                                R{deposits.filter(d => d.status === 'HELD').reduce((sum, d) => sum + (d.amount || 0), 0).toLocaleString()}
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
                            <div className="text-sm text-text-secondary">Accrued Interest</div>
                            <div className="text-xl font-bold">
                                R{deposits.reduce((sum, d) => sum + (d.accruedInterest || 0), 0).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <div className="text-sm text-text-secondary">Pending</div>
                            <div className="text-xl font-bold">
                                {deposits.filter(d => d.status === 'PENDING').length}
                            </div>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-cyan-600" />
                        </div>
                        <div>
                            <div className="text-sm text-text-secondary">Prime Rate</div>
                            <div className="text-xl font-bold">11.75%</div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Action Button */}
            <div className="flex justify-end mb-6">
                <Button onClick={() => setShowModal(true)}>
                    <Plus className="w-4 h-4" />
                    Record Deposit
                </Button>
            </div>

            {/* Deposits List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : deposits.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={<Wallet className="w-16 h-16" />}
                        title="No deposits recorded"
                        description="Record deposit payments to track security deposits with interest"
                        actionLabel="Record Deposit"
                        onAction={() => setShowModal(true)}
                    />
                </Card>
            ) : (
                <div className="space-y-4">
                    {deposits.map((deposit) => (
                        <Card key={deposit.id}>
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center">
                                        <Wallet className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold">
                                                {deposit.lease.tenant.fullName}
                                            </h3>
                                            <Badge variant={STATUS_COLORS[deposit.status] || 'default'}>
                                                {deposit.status}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-text-secondary mt-1">
                                            <span className="flex items-center gap-1">
                                                <Home className="w-4 h-4" />
                                                {deposit.lease.unit.property.name} - Unit {deposit.lease.unit.unitNumber}
                                            </span>
                                            {deposit.paidDate && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    Paid: {new Date(deposit.paidDate).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-primary">
                                        R{(deposit.amount || 0).toLocaleString()}
                                    </div>
                                    <div className="text-sm text-text-secondary">
                                        + R{calculateTotalWithInterest(deposit).toFixed(2)} with interest
                                    </div>
                                    {deposit.deductions.length > 0 && (
                                        <div className="text-sm text-danger flex items-center justify-end gap-1 mt-1">
                                            <MinusCircle className="w-4 h-4" />
                                            R{getTotalDeductions(deposit).toLocaleString()} deducted
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Deductions */}
                            {deposit.deductions.length > 0 && (
                                <div className="mt-4 pt-4 border-t">
                                    <div className="text-sm font-medium mb-2">Deductions</div>
                                    <div className="space-y-2">
                                        {deposit.deductions.map((ded) => (
                                            <div key={ded.id} className="flex items-center justify-between text-sm bg-red-50 p-2 rounded">
                                                <span>{ded.reason}: {ded.description}</span>
                                                <span className="font-medium text-danger">-R{ded.amount.toLocaleString()}</span>
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
                                        setSelectedDeposit(deposit);
                                        setShowDeductionModal(true);
                                    }}
                                >
                                    Add Deduction
                                </Button>
                                {deposit.status === 'HELD' && (
                                    <Button variant="secondary" size="sm">
                                        Process Refund
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Deposit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Record Deposit Payment"
            >
                <form onSubmit={handleCreateDeposit} className="space-y-4">
                    <Select
                        label="Lease *"
                        value={formData.leaseId}
                        onChange={(e) => {
                            const lease = leasesWithoutDeposit.find(l => l.id === e.target.value);
                            setFormData({
                                ...formData,
                                leaseId: e.target.value,
                                amount: lease ? lease.deposit.toString() : '',
                            });
                        }}
                        options={[
                            { value: '', label: 'Select a lease' },
                            ...leasesWithoutDeposit.map((lease) => ({
                                value: lease.id,
                                label: `${lease.tenant.fullName} - ${lease.unit.property.name} Unit ${lease.unit.unitNumber}`,
                            })),
                        ]}
                        required
                    />

                    <Input
                        label="Amount (R) *"
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        required
                    />

                    <Input
                        label="Date Paid"
                        type="date"
                        value={formData.paidDate}
                        onChange={(e) => setFormData({ ...formData, paidDate: e.target.value })}
                    />

                    <Input
                        label="Bank Name"
                        value={formData.bankName}
                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                        placeholder="Interest-bearing account bank"
                    />

                    <Input
                        label="Account Number"
                        value={formData.accountNumber}
                        onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                        placeholder="Account number"
                    />

                    <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                        <strong>Note:</strong> Deposits will accrue interest at the SA Prime Rate (11.75%)
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={creating}>
                            {creating ? 'Recording...' : 'Record Deposit'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Deduction Modal */}
            <Modal
                isOpen={showDeductionModal}
                onClose={() => setShowDeductionModal(false)}
                title="Add Deduction"
            >
                <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!selectedDeposit || !deductionData.description || !deductionData.amount) return;
                    setCreating(true);
                    try {
                        const response = await fetch('/api/deposits/deductions', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                depositId: selectedDeposit.id,
                                reason: deductionData.reason,
                                description: deductionData.description,
                                amount: parseFloat(deductionData.amount),
                            }),
                        });
                        const result = await response.json();
                        if (result.success) {
                            setShowDeductionModal(false);
                            setDeductionData({ reason: 'DAMAGE', description: '', amount: '' });
                            setSelectedDeposit(null);
                            fetchDeposits();
                        } else {
                            alert(result.error || 'Failed to add deduction');
                        }
                    } catch (error) {
                        console.error('Error adding deduction:', error);
                        alert('Failed to add deduction');
                    } finally {
                        setCreating(false);
                    }
                }} className="space-y-4">
                    <Select
                        label="Reason *"
                        value={deductionData.reason}
                        onChange={(e) => setDeductionData({ ...deductionData, reason: e.target.value })}
                        options={[
                            { value: 'DAMAGE', label: 'Damage' },
                            { value: 'CLEANING', label: 'Cleaning' },
                            { value: 'PAINTING', label: 'Painting' },
                            { value: 'REPAIRS', label: 'Repairs' },
                            { value: 'KEYS', label: 'Keys/Locks' },
                            { value: 'OTHER', label: 'Other' },
                        ]}
                    />

                    <Input
                        label="Description *"
                        value={deductionData.description}
                        onChange={(e) => setDeductionData({ ...deductionData, description: e.target.value })}
                        placeholder="Describe the deduction..."
                        required
                    />

                    <Input
                        label="Amount (R) *"
                        type="number"
                        value={deductionData.amount}
                        onChange={(e) => setDeductionData({ ...deductionData, amount: e.target.value })}
                        required
                    />

                    {selectedDeposit && (
                        <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                            <strong>Available balance:</strong> R{(selectedDeposit.amount + selectedDeposit.accruedInterest - selectedDeposit.deductions.reduce((s, d) => s + d.amount, 0)).toFixed(2)}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setShowDeductionModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={creating}>
                            {creating ? 'Adding...' : 'Add Deduction'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </AppShell>
    );
}
