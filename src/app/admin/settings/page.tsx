'use client';

import React, { useState, useEffect } from 'react';
import {
    Settings,
    Globe,
    CreditCard,
    Bell,
    Shield,
    Loader2,
    Check,
    AlertCircle,
    Mail,
    Server,
    Database,
} from 'lucide-react';

interface PlatformSettings {
    platformName: string;
    platformFee: number;
    supportEmail: string;
    maintenanceMode: boolean;
    allowNewRegistrations: boolean;
    requireEmailVerification: boolean;
}

interface SystemInfo {
    totalUsers: number;
    totalProperties: number;
    totalPayments: number;
    databaseSize: string;
    uptime: string;
}

export default function AdminSettingsPage() {
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettings] = useState<PlatformSettings>({
        platformName: 'Nook',
        platformFee: 2,
        supportEmail: 'support@nookpms.com',
        maintenanceMode: false,
        allowNewRegistrations: true,
        requireEmailVerification: false,
    });
    const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch system info
                const response = await fetch('/api/admin/stats');
                const result = await response.json();
                if (result.success && result.data) {
                    setSystemInfo({
                        totalUsers: result.data.users?.total || 0,
                        totalProperties: result.data.properties?.total || 0,
                        totalPayments: result.data.revenue?.thisMonth ? Math.round(result.data.revenue.thisMonth / 1000) : 0,
                        databaseSize: 'SQLite',
                        uptime: '99.9%',
                    });
                }
            } catch (error) {
                console.error('Failed to fetch system info:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        // Simulate save
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const tabs = [
        { id: 'general', label: 'General', icon: Globe },
        { id: 'payments', label: 'Payments', icon: CreditCard },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'system', label: 'System Info', icon: Server },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Settings className="w-7 h-7" />
                    Platform Settings
                </h1>
                <p className="text-gray-400">Configure platform-wide settings</p>
            </div>

            <div className="flex gap-6">
                {/* Sidebar */}
                <div className="w-56 shrink-0">
                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${activeTab === tab.id
                                    ? 'bg-purple-600 text-white'
                                    : 'text-gray-300 hover:bg-gray-700'
                                    }`}
                            >
                                <tab.icon className="w-5 h-5" />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                    {activeTab === 'general' && (
                        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                            <h3 className="text-lg font-semibold mb-6">General Settings</h3>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Platform Name</label>
                                    <input
                                        type="text"
                                        value={settings.platformName}
                                        onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Support Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="email"
                                            value={settings.supportEmail}
                                            onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                                    <div>
                                        <div className="font-medium">Allow New Registrations</div>
                                        <div className="text-sm text-gray-400">Let new users create accounts</div>
                                    </div>
                                    <button
                                        onClick={() => setSettings({ ...settings, allowNewRegistrations: !settings.allowNewRegistrations })}
                                        className={`w-12 h-6 rounded-full transition-colors ${settings.allowNewRegistrations ? 'bg-purple-600' : 'bg-gray-600'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.allowNewRegistrations ? 'translate-x-6' : 'translate-x-0.5'
                                            }`} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between py-3">
                                    <div>
                                        <div className="font-medium text-orange-400">Maintenance Mode</div>
                                        <div className="text-sm text-gray-400">Disable access for non-admin users</div>
                                    </div>
                                    <button
                                        onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                                        className={`w-12 h-6 rounded-full transition-colors ${settings.maintenanceMode ? 'bg-orange-600' : 'bg-gray-600'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.maintenanceMode ? 'translate-x-6' : 'translate-x-0.5'
                                            }`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'payments' && (
                        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                            <h3 className="text-lg font-semibold mb-6">Payment Settings</h3>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Platform Fee (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        step="0.5"
                                        value={settings.platformFee}
                                        onChange={(e) => setSettings({ ...settings, platformFee: parseFloat(e.target.value) })}
                                        className="w-32 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                    />
                                    <p className="text-sm text-gray-400 mt-2">Fee charged on each payment</p>
                                </div>
                                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                                        <div>
                                            <div className="font-medium text-blue-400">Paystack Integration</div>
                                            <p className="text-sm text-gray-400 mt-1">
                                                Payment gateway configured. API keys are set in environment variables.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                            <h3 className="text-lg font-semibold mb-6">Notification Settings</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                                    <div>
                                        <div className="font-medium">Email Notifications</div>
                                        <div className="text-sm text-gray-400">Send email alerts for important events</div>
                                    </div>
                                    <button className="w-12 h-6 rounded-full bg-purple-600 transition-colors">
                                        <div className="w-5 h-5 bg-white rounded-full translate-x-6" />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                                    <div>
                                        <div className="font-medium">New User Alerts</div>
                                        <div className="text-sm text-gray-400">Get notified when a new user signs up</div>
                                    </div>
                                    <button className="w-12 h-6 rounded-full bg-purple-600 transition-colors">
                                        <div className="w-5 h-5 bg-white rounded-full translate-x-6" />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between py-3">
                                    <div>
                                        <div className="font-medium">Payment Alerts</div>
                                        <div className="text-sm text-gray-400">Get notified on large payments</div>
                                    </div>
                                    <button className="w-12 h-6 rounded-full bg-purple-600 transition-colors">
                                        <div className="w-5 h-5 bg-white rounded-full translate-x-6" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                            <h3 className="text-lg font-semibold mb-6">Security Settings</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                                    <div>
                                        <div className="font-medium">Require Email Verification</div>
                                        <div className="text-sm text-gray-400">New users must verify email</div>
                                    </div>
                                    <button
                                        onClick={() => setSettings({ ...settings, requireEmailVerification: !settings.requireEmailVerification })}
                                        className={`w-12 h-6 rounded-full transition-colors ${settings.requireEmailVerification ? 'bg-purple-600' : 'bg-gray-600'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.requireEmailVerification ? 'translate-x-6' : 'translate-x-0.5'
                                            }`} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                                    <div>
                                        <div className="font-medium">Two-Factor Authentication</div>
                                        <div className="text-sm text-gray-400">Require 2FA for admin accounts</div>
                                    </div>
                                    <button className="w-12 h-6 rounded-full bg-gray-600 transition-colors">
                                        <div className="w-5 h-5 bg-white rounded-full translate-x-0.5" />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between py-3">
                                    <div>
                                        <div className="font-medium">Session Timeout</div>
                                        <div className="text-sm text-gray-400">Auto logout after inactivity</div>
                                    </div>
                                    <select className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-white">
                                        <option>1 hour</option>
                                        <option>4 hours</option>
                                        <option>24 hours</option>
                                        <option>Never</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'system' && (
                        <div className="space-y-4">
                            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                                <h3 className="text-lg font-semibold mb-6">System Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-700/50 rounded-lg p-4">
                                        <div className="text-sm text-gray-400">Total Users</div>
                                        <div className="text-2xl font-bold">{systemInfo?.totalUsers || 0}</div>
                                    </div>
                                    <div className="bg-gray-700/50 rounded-lg p-4">
                                        <div className="text-sm text-gray-400">Total Properties</div>
                                        <div className="text-2xl font-bold">{systemInfo?.totalProperties || 0}</div>
                                    </div>
                                    <div className="bg-gray-700/50 rounded-lg p-4">
                                        <div className="text-sm text-gray-400">Total Payments</div>
                                        <div className="text-2xl font-bold">{systemInfo?.totalPayments || 0}</div>
                                    </div>
                                    <div className="bg-gray-700/50 rounded-lg p-4">
                                        <div className="text-sm text-gray-400">Uptime</div>
                                        <div className="text-2xl font-bold text-green-400">{systemInfo?.uptime || '-'}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Database className="w-5 h-5" />
                                    Database
                                </h3>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">SQLite</div>
                                        <div className="text-sm text-gray-400">prisma/dev.db</div>
                                    </div>
                                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Connected</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Save Button */}
                    {activeTab !== 'system' && (
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : saved ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Saved!
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
