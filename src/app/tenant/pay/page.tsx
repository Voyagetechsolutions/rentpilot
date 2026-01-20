'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TenantLayout } from '@/components/layout/TenantLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    CreditCard,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Home,
    ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

interface LeaseInfo {
    id: string;
    rentAmount: number;
    unit: string;
    property: string;
}

interface RentSummary {
    currentRent: number;
    totalDue: number;
    totalPaid: number;
    balance: number;
}

export default function TenantPayPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [initiating, setInitiating] = useState(false);
    const [lease, setLease] = useState<LeaseInfo | null>(null);
    const [rentSummary, setRentSummary] = useState<RentSummary | null>(null);
    const [customAmount, setCustomAmount] = useState('');
    const [useCustom, setUseCustom] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/tenant/dashboard');
                const result = await response.json();
                if (result.success && result.data.lease) {
                    setLease({
                        id: result.data.lease.id,
                        rentAmount: result.data.lease.rentAmount,
                        unit: result.data.lease.unit,
                        property: result.data.lease.property,
                    });
                    setRentSummary(result.data.rentSummary);
                } else {
                    setError('No active lease found');
                }
            } catch {
                setError('Failed to load payment info');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handlePay = async () => {
        setInitiating(true);
        setError('');

        try {
            const amount = useCustom ? parseFloat(customAmount) : rentSummary?.balance || 0;

            if (amount <= 0) {
                setError('Please enter a valid amount');
                setInitiating(false);
                return;
            }

            const response = await fetch('/api/payments/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount }),
            });

            const result = await response.json();

            if (result.success) {
                // Redirect to Paystack checkout
                window.location.href = result.data.authorizationUrl;
            } else {
                setError(result.error || 'Failed to initiate payment');
            }
        } catch {
            setError('Failed to initiate payment');
        } finally {
            setInitiating(false);
        }
    };

    if (loading) {
        return (
            <TenantLayout title="Pay Rent">
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
            </TenantLayout>
        );
    }

    if (error && !lease) {
        return (
            <TenantLayout title="Pay Rent">
                <div className="text-center py-20">
                    <AlertCircle className="w-16 h-16 text-danger mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Unable to load</h2>
                    <p className="text-text-secondary mb-4">{error}</p>
                    <Link href="/tenant">
                        <Button>Back to Dashboard</Button>
                    </Link>
                </div>
            </TenantLayout>
        );
    }

    const paymentAmount = useCustom ? parseFloat(customAmount) || 0 : rentSummary?.balance || 0;

    return (
        <TenantLayout title="Pay Rent">
            <div className="max-w-lg mx-auto space-y-6">
                {/* Back Link */}
                <Link href="/tenant" className="inline-flex items-center gap-2 text-text-secondary hover:text-primary">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>

                {/* Property Info */}
                <Card>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center">
                            <Home className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <div className="font-semibold">{lease?.property}</div>
                            <div className="text-sm text-text-muted">Unit {lease?.unit}</div>
                        </div>
                    </div>
                </Card>

                {/* Payment Card */}
                <Card>
                    <div className="text-center mb-6">
                        <CreditCard className="w-12 h-12 text-primary mx-auto mb-4" />
                        <h2 className="text-xl font-bold">Pay Your Rent</h2>
                        <p className="text-text-secondary">
                            Secure payment powered by Paystack
                        </p>
                    </div>

                    {/* Balance Summary */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <div className="flex justify-between mb-2">
                            <span className="text-text-muted">Monthly Rent</span>
                            <span>R{rentSummary?.currentRent?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                            <span className="text-text-muted">Already Paid</span>
                            <span className="text-success">R{rentSummary?.totalPaid?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                            <span>Balance Due</span>
                            <span className={rentSummary?.balance && rentSummary.balance > 0 ? 'text-danger' : 'text-success'}>
                                R{rentSummary?.balance?.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {rentSummary?.balance === 0 ? (
                        <div className="text-center py-6">
                            <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
                            <h3 className="font-semibold">All Paid Up!</h3>
                            <p className="text-text-secondary">You have no outstanding rent balance.</p>
                        </div>
                    ) : (
                        <>
                            {/* Amount Selection */}
                            <div className="space-y-4 mb-6">
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 flex-1">
                                        <input
                                            type="radio"
                                            name="amount"
                                            checked={!useCustom}
                                            onChange={() => setUseCustom(false)}
                                            className="w-4 h-4 text-primary"
                                        />
                                        <span>Pay full balance</span>
                                    </label>
                                    <span className="font-bold">R{rentSummary?.balance?.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="amount"
                                            checked={useCustom}
                                            onChange={() => setUseCustom(true)}
                                            className="w-4 h-4 text-primary"
                                        />
                                        <span>Custom amount</span>
                                    </label>
                                </div>
                                {useCustom && (
                                    <Input
                                        type="number"
                                        placeholder="Enter amount"
                                        value={customAmount}
                                        onChange={(e) => setCustomAmount(e.target.value)}
                                        min="1"
                                        max={rentSummary?.balance}
                                    />
                                )}
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
                                    {error}
                                </div>
                            )}

                            {/* Pay Button */}
                            <Button
                                className="w-full"
                                onClick={handlePay}
                                disabled={initiating || paymentAmount <= 0}
                            >
                                {initiating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Initiating Payment...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="w-4 h-4" />
                                        Pay R{paymentAmount.toLocaleString()}
                                    </>
                                )}
                            </Button>
                        </>
                    )}

                    {/* Security Note */}
                    <p className="text-xs text-text-muted text-center mt-4">
                        🔒 Payments are securely processed by Paystack
                    </p>
                </Card>
            </div>
        </TenantLayout>
    );
}
