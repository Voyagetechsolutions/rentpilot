'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppShell } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
    User,
    Bell,
    CreditCard,
    Building2,
    Shield,
    Loader2,
    Check,
    Landmark,
} from 'lucide-react';

interface UserSettings {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    notifyPaymentReceived: boolean;
    notifyRentOverdue: boolean;
    notifyMaintenanceRequest: boolean;
    notifyLeaseExpiring: boolean;
    organizationName: string;
    currency: string;
    timezone: string;
}

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [settings, setSettings] = useState<UserSettings>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        notifyPaymentReceived: true,
        notifyRentOverdue: true,
        notifyMaintenanceRequest: true,
        notifyLeaseExpiring: true,
        organizationName: 'My Properties',
        currency: 'ZAR',
        timezone: 'Africa/Johannesburg',
    });

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const fetchSettings = useCallback(async () => {
        try {
            const response = await fetch('/api/settings');
            const result = await response.json();
            if (result.success) {
                setSettings({
                    firstName: result.data.firstName || '',
                    lastName: result.data.lastName || '',
                    email: result.data.email || '',
                    phone: result.data.phone || '',
                    notifyPaymentReceived: result.data.notifyPaymentReceived ?? true,
                    notifyRentOverdue: result.data.notifyRentOverdue ?? true,
                    notifyMaintenanceRequest: result.data.notifyMaintenanceRequest ?? true,
                    notifyLeaseExpiring: result.data.notifyLeaseExpiring ?? true,
                    organizationName: result.data.organizationName || 'My Properties',
                    currency: result.data.currency || 'ZAR',
                    timezone: result.data.timezone || 'Africa/Johannesburg',
                });
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const saveSettings = async () => {
        setSaving(true);
        try {
            const response = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });
            const result = await response.json();
            if (result.success) {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            }
        } catch (error) {
            console.error('Error saving settings:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleNotificationToggle = async (key: keyof UserSettings) => {
        const newSettings = { ...settings, [key]: !settings[key] };
        setSettings(newSettings);

        // Auto-save notification preferences
        try {
            await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSettings),
            });
        } catch (error) {
            console.error('Error saving notification preference:', error);
        }
    };

    const handlePasswordChange = async () => {
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            alert('New passwords do not match');
            return;
        }
        if (passwordForm.newPassword.length < 8) {
            alert('Password must be at least 8 characters');
            return;
        }

        try {
            const response = await fetch('/api/auth/change-password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword,
                }),
            });
            const result = await response.json();
            if (result.success) {
                alert('Password updated successfully');
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                alert(result.error || 'Failed to update password');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            alert('Failed to update password');
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'bank', label: 'Bank Account', icon: Landmark },
        { id: 'billing', label: 'Billing', icon: CreditCard },
        { id: 'organization', label: 'Organization', icon: Building2 },
        { id: 'security', label: 'Security', icon: Shield },
    ];

    if (loading) {
        return (
            <AppShell title="Settings">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell title="Settings">
            <div className="flex gap-6">
                {/* Sidebar Tabs */}
                <div className="w-64 shrink-0">
                    <Card>
                        <nav className="space-y-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === tab.id
                                        ? 'bg-primary-light text-primary'
                                        : 'hover:bg-neutral-light text-text-secondary'
                                        }`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <tab.icon className="w-5 h-5" />
                                    <span className="font-medium">{tab.label}</span>
                                </button>
                            ))}
                        </nav>
                    </Card>
                </div>

                {/* Content */}
                <div className="flex-1">
                    {activeTab === 'profile' && (
                        <Card title="Profile Settings">
                            <div className="space-y-6">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
                                        <User className="w-10 h-10 text-white" />
                                    </div>
                                    <div>
                                        <Button variant="secondary" size="sm">Change Photo</Button>
                                        <p className="text-sm text-text-muted mt-2">JPG, PNG up to 2MB</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="First Name"
                                        value={settings.firstName}
                                        onChange={(e) => setSettings({ ...settings, firstName: e.target.value })}
                                    />
                                    <Input
                                        label="Last Name"
                                        value={settings.lastName}
                                        onChange={(e) => setSettings({ ...settings, lastName: e.target.value })}
                                    />
                                </div>
                                <Input
                                    label="Email"
                                    type="email"
                                    value={settings.email}
                                    disabled
                                />
                                <Input
                                    label="Phone"
                                    type="tel"
                                    value={settings.phone}
                                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                                    placeholder="+27 82 123 4567"
                                />

                                <div className="flex justify-end">
                                    <Button onClick={saveSettings} disabled={saving}>
                                        {saving ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                                        ) : saved ? (
                                            <><Check className="w-4 h-4" /> Saved!</>
                                        ) : (
                                            'Save Changes'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'notifications' && (
                        <Card title="Notification Preferences">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between py-3 border-b border-border">
                                    <div>
                                        <div className="font-medium">Payment Received</div>
                                        <div className="text-sm text-text-muted">Get notified when a tenant makes a payment</div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={settings.notifyPaymentReceived}
                                        onChange={() => handleNotificationToggle('notifyPaymentReceived')}
                                        className="w-5 h-5 cursor-pointer"
                                    />
                                </div>
                                <div className="flex items-center justify-between py-3 border-b border-border">
                                    <div>
                                        <div className="font-medium">Rent Overdue</div>
                                        <div className="text-sm text-text-muted">Get notified when rent becomes overdue</div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={settings.notifyRentOverdue}
                                        onChange={() => handleNotificationToggle('notifyRentOverdue')}
                                        className="w-5 h-5 cursor-pointer"
                                    />
                                </div>
                                <div className="flex items-center justify-between py-3 border-b border-border">
                                    <div>
                                        <div className="font-medium">New Maintenance Request</div>
                                        <div className="text-sm text-text-muted">Get notified when a tenant submits a request</div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={settings.notifyMaintenanceRequest}
                                        onChange={() => handleNotificationToggle('notifyMaintenanceRequest')}
                                        className="w-5 h-5 cursor-pointer"
                                    />
                                </div>
                                <div className="flex items-center justify-between py-3">
                                    <div>
                                        <div className="font-medium">Lease Expiring</div>
                                        <div className="text-sm text-text-muted">Get notified 30 days before lease ends</div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={settings.notifyLeaseExpiring}
                                        onChange={() => handleNotificationToggle('notifyLeaseExpiring')}
                                        className="w-5 h-5 cursor-pointer"
                                    />
                                </div>

                                <p className="text-sm text-text-muted text-center">
                                    Preferences are saved automatically
                                </p>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'bank' && (
                        <Card title="Bank Account Settings">
                            <div className="space-y-6">
                                <div className="text-center py-8">
                                    <Landmark className="w-16 h-16 text-primary mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold mb-2">Receive Payments Directly</h3>
                                    <p className="text-text-secondary mb-6 max-w-md mx-auto">
                                        Set up your bank account to receive tenant rent payments directly into your bank account.
                                    </p>
                                    <a href="/settings/bank">
                                        <Button>
                                            <Landmark className="w-4 h-4" />
                                            Set Up Bank Account
                                        </Button>
                                    </a>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="font-medium text-blue-800 mb-2">How Direct Payouts Work</h4>
                                    <ul className="text-sm text-blue-700 space-y-1">
                                        <li>• Tenants pay via the app → Money goes to your bank</li>
                                        <li>• Payouts arrive within 24 hours</li>
                                        <li>• Small 2% platform fee per transaction</li>
                                    </ul>
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'billing' && (
                        <Card title="Subscription & Billing">
                            <div className="text-center py-12">
                                <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-4">
                                    <CreditCard className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
                                <p className="text-text-secondary max-w-md mx-auto">
                                    Subscription plans and billing management will be available in a future update.
                                    You currently have full access to all features.
                                </p>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'organization' && (
                        <Card title="Organization Settings">
                            <div className="space-y-6">
                                <Input
                                    label="Organization Name"
                                    value={settings.organizationName}
                                    onChange={(e) => setSettings({ ...settings, organizationName: e.target.value })}
                                />
                                <Select
                                    label="Default Currency"
                                    options={[
                                        { value: 'ZAR', label: 'South African Rand (ZAR)' },
                                        { value: 'USD', label: 'US Dollar (USD)' },
                                        { value: 'EUR', label: 'Euro (EUR)' },
                                        { value: 'GBP', label: 'British Pound (GBP)' },
                                    ]}
                                    value={settings.currency}
                                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                                />
                                <Select
                                    label="Timezone"
                                    options={[
                                        { value: 'Africa/Johannesburg', label: '(GMT+2) South Africa' },
                                        { value: 'UTC', label: '(GMT) UTC' },
                                    ]}
                                    value={settings.timezone}
                                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                                />

                                <div className="flex justify-end">
                                    <Button onClick={saveSettings} disabled={saving}>
                                        {saving ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                                        ) : saved ? (
                                            <><Check className="w-4 h-4" /> Saved!</>
                                        ) : (
                                            'Save Changes'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'security' && (
                        <Card title="Security Settings">
                            <div className="space-y-6">
                                <div>
                                    <h4 className="font-medium mb-4">Change Password</h4>
                                    <div className="space-y-4 max-w-md">
                                        <Input
                                            label="Current Password"
                                            type="password"
                                            value={passwordForm.currentPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                        />
                                        <Input
                                            label="New Password"
                                            type="password"
                                            value={passwordForm.newPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                        />
                                        <Input
                                            label="Confirm New Password"
                                            type="password"
                                            value={passwordForm.confirmPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                        />
                                        <Button onClick={handlePasswordChange}>Update Password</Button>
                                    </div>
                                </div>

                                <hr className="border-border" />

                                <div>
                                    <h4 className="font-medium mb-2">Two-Factor Authentication</h4>
                                    <p className="text-sm text-text-muted mb-4">
                                        Add an extra layer of security to your account
                                    </p>
                                    <Button variant="secondary">Enable 2FA</Button>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </AppShell>
    );
}
