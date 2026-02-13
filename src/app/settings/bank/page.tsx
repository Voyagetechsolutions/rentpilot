'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import {
    Building2,
    Loader2,
    AlertCircle,
    CheckCircle2,
    CreditCard,
    ShieldCheck,
    Clock,
} from 'lucide-react';

interface Bank {
    name: string;
    code: string;
}

interface BankSettings {
    bankName: string | null;
    bankCode: string | null;
    accountNumber: string | null;
    accountName: string | null;
    paystackSubaccountCode: string | null;
    bankVerified: boolean;
    bankVerificationMethod: string | null;
    bankVerifiedAt: string | null;
}

export default function BankSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [banks, setBanks] = useState<Bank[]>([]);
    const [settings, setSettings] = useState<BankSettings | null>(null);
    const [formData, setFormData] = useState({
        bankCode: '',
        bankName: '',
        accountNumber: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/settings/bank');
                const result = await response.json();
                if (result.success) {
                    setBanks(result.data.banks);
                    setSettings(result.data.bankSettings);
                    if (result.data.bankSettings?.bankCode) {
                        setFormData({
                            bankCode: result.data.bankSettings.bankCode,
                            bankName: result.data.bankSettings.bankName || '',
                            accountNumber: result.data.bankSettings.accountNumber || '',
                        });
                    }
                }
            } catch {
                setError('Failed to load settings');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleBankChange = (bankCode: string) => {
        const bank = banks.find(b => b.code === bankCode);
        setFormData({
            ...formData,
            bankCode,
            bankName: bank?.name || '',
        });
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch('/api/settings/bank', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (result.success) {
                setSettings({
                    bankName: result.data.bankName,
                    accountNumber: result.data.accountNumber,
                    accountName: result.data.accountName,
                    paystackSubaccountCode: 'active',
                    bankCode: formData.bankCode,
                    bankVerified: result.data.bankVerified,
                    bankVerificationMethod: result.data.bankVerificationMethod,
                    bankVerifiedAt: result.data.bankVerifiedAt,
                });
                setSuccess(result.message);
            } else {
                setError(result.error);
            }
        } catch {
            setError('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const bankOptions = banks.map(bank => ({
        value: bank.code,
        label: bank.name,
    }));

    return (
        <AppShell title="Bank Settings">
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">Bank Account Settings</h1>
                    <p className="text-text-secondary">
                        Set up your bank account to receive tenant payments directly
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        {/* Status Card */}
                        <Card>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${settings?.paystackSubaccountCode ? 'bg-green-100' : 'bg-yellow-100'
                                    }`}>
                                    <CreditCard className={`w-6 h-6 ${settings?.paystackSubaccountCode ? 'text-green-600' : 'text-yellow-600'
                                        }`} />
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold">Direct Payout Status</div>
                                    <div className="text-text-secondary text-sm">
                                        {settings?.paystackSubaccountCode
                                            ? 'Payments go directly to your bank account'
                                            : 'Set up your bank account to receive direct payouts'}
                                    </div>
                                </div>
                                <Badge variant={settings?.paystackSubaccountCode ? 'success' : 'warning'}>
                                    {settings?.paystackSubaccountCode ? 'Active' : 'Not Set Up'}
                                </Badge>
                            </div>
                        </Card>

                        {/* Verification Status Card */}
                        {settings?.bankVerified && (
                            <Card className="bg-green-50 border-green-200">
                                <div className="flex items-start gap-3">
                                    <ShieldCheck className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <div className="font-semibold text-green-800">Bank Account Verified</div>
                                        <div className="text-sm text-green-700 space-y-1 mt-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">Account Holder:</span>
                                                <span>{settings.accountName}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">Method:</span>
                                                <Badge variant="success">
                                                    {settings.bankVerificationMethod === 'API' ? 'Bank API Verification' : settings.bankVerificationMethod}
                                                </Badge>
                                            </div>
                                            {settings.bankVerifiedAt && (
                                                <div className="flex items-center gap-1 text-green-600">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span>Verified on {new Date(settings.bankVerifiedAt).toLocaleDateString('en-ZA', {
                                                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
                                                    })}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Bank Account Form */}
                        <Card>
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <Building2 className="w-5 h-5" />
                                Bank Account Details
                            </h3>

                            {settings?.bankVerified && (settings?.bankCode !== formData.bankCode || settings?.accountNumber !== formData.accountNumber) && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2 text-yellow-700 mb-4">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <span className="text-sm">Changing bank details will require re-verification and create a new payout account.</span>
                                </div>
                            )}

                            <div className="space-y-4">
                                <Select
                                    label="Bank"
                                    options={bankOptions}
                                    value={formData.bankCode}
                                    onChange={(e) => handleBankChange(e.target.value)}
                                    placeholder="Select your bank"
                                />

                                <Input
                                    label="Account Number"
                                    value={formData.accountNumber}
                                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                                    placeholder="Enter account number"
                                    maxLength={12}
                                />

                                {error && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-600">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                        {error}
                                    </div>
                                )}

                                {success && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-green-600">
                                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                                        {success}
                                    </div>
                                )}

                                <Button
                                    onClick={handleSave}
                                    disabled={saving || !formData.bankCode || !formData.accountNumber}
                                    className="w-full"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Verifying & Saving...
                                        </>
                                    ) : settings?.paystackSubaccountCode ? (
                                        'Update Bank Account'
                                    ) : (
                                        'Verify & Save Bank Account'
                                    )}
                                </Button>
                            </div>
                        </Card>

                        {/* Info Card */}
                        <Card className="bg-blue-50 border-blue-200">
                            <h4 className="font-medium text-blue-800 mb-2">How it works</h4>
                            <ul className="text-sm text-blue-700 space-y-1">
                                <li>• When tenants pay rent online, the money goes directly to your bank account</li>
                                <li>• Payouts typically arrive within 24 hours</li>
                                <li>• A small platform fee (2%) is deducted from each payment</li>
                                <li>• You&apos;ll see all payments in your Payments dashboard</li>
                            </ul>
                        </Card>
                    </>
                )}
            </div>
        </AppShell>
    );
}
