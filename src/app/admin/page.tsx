'use client';

import React, { useEffect, useState } from 'react';
import {
    Users,
    Building2,
    DoorOpen,
    FileText,
    CreditCard,
    TrendingUp,
    AlertCircle,
    Loader2,
    UserPlus,
    Home,
    Receipt,
} from 'lucide-react';

interface PlatformStats {
    users: {
        total: number;
        landlords: number;
        tenants: number;
        admins: number;
    };
    properties: number;
    units: {
        total: number;
        occupied: number;
        vacant: number;
    };
    leases: {
        active: number;
        expired: number;
    };
    payments: {
        total: number;
        thisMonth: number;
        totalAmount: number;
        thisMonthAmount: number;
    };
    recentActivity: {
        id: string;
        action: string;
        details: string;
        createdAt: string;
    }[];
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('/api/admin/stats');
                const result = await response.json();
                if (result.success) {
                    setStats(result.data);
                } else {
                    setError(result.error || 'Failed to load stats');
                }
            } catch {
                setError('Failed to load platform statistics');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
                <p className="text-gray-400">{error}</p>
            </div>
        );
    }

    const statCards = [
        {
            label: 'Total Users',
            value: stats?.users.total || 0,
            icon: Users,
            color: 'from-blue-500 to-blue-600',
            subtitle: `${stats?.users.landlords || 0} landlords, ${stats?.users.tenants || 0} tenants`,
        },
        {
            label: 'Properties',
            value: stats?.properties || 0,
            icon: Building2,
            color: 'from-green-500 to-green-600',
        },
        {
            label: 'Units',
            value: stats?.units.total || 0,
            icon: DoorOpen,
            color: 'from-purple-500 to-purple-600',
            subtitle: `${stats?.units.occupied || 0} occupied, ${stats?.units.vacant || 0} vacant`,
        },
        {
            label: 'Active Leases',
            value: stats?.leases.active || 0,
            icon: FileText,
            color: 'from-orange-500 to-orange-600',
        },
        {
            label: 'Total Payments',
            value: stats?.payments.total || 0,
            icon: CreditCard,
            color: 'from-pink-500 to-pink-600',
            subtitle: `${stats?.payments.thisMonth || 0} this month`,
        },
        {
            label: 'Revenue',
            value: `R${(stats?.payments.totalAmount || 0).toLocaleString()}`,
            icon: TrendingUp,
            color: 'from-emerald-500 to-emerald-600',
            subtitle: `R${(stats?.payments.thisMonthAmount || 0).toLocaleString()} this month`,
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Platform Dashboard</h1>
                <p className="text-gray-400">Overview of RentPilot platform metrics</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {statCards.map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-gray-800 rounded-xl p-5 border border-gray-700"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">{stat.label}</p>
                                <p className="text-3xl font-bold mt-1">{stat.value}</p>
                                {stat.subtitle && (
                                    <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                                )}
                            </div>
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                    <h3 className="font-semibold mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <a
                            href="/admin/users"
                            className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                        >
                            <UserPlus className="w-5 h-5 text-blue-400" />
                            <span>Manage Users</span>
                        </a>
                        <a
                            href="/admin/properties"
                            className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                        >
                            <Home className="w-5 h-5 text-green-400" />
                            <span>View Properties</span>
                        </a>
                        <a
                            href="/admin/payments"
                            className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                        >
                            <Receipt className="w-5 h-5 text-purple-400" />
                            <span>View Payments</span>
                        </a>
                        <a
                            href="/admin/logs"
                            className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                        >
                            <FileText className="w-5 h-5 text-orange-400" />
                            <span>Activity Logs</span>
                        </a>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                    <h3 className="font-semibold mb-4">Recent Activity</h3>
                    {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                        <div className="space-y-3">
                            {stats.recentActivity.map((activity) => (
                                <div
                                    key={activity.id}
                                    className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg"
                                >
                                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">
                                            {activity.action.replace(/_/g, ' ')}
                                        </div>
                                        <div className="text-xs text-gray-400 truncate">
                                            {activity.details}
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {new Date(activity.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p>No recent activity</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
