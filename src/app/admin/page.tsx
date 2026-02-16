'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Users,
    Building2,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    AlertCircle,
    Loader2,
    UserPlus,
    Home,
    Receipt,
    FileText,
    PieChart,
    Activity,
    Clock,
    CheckCircle,
    XCircle,
    ChevronRight,
    Wrench,
    Bell,
    DollarSign,
    Calendar,
    RefreshCw,
    ArrowUpRight,
    ArrowDownRight,
    BarChart3,
    Percent,
} from 'lucide-react';

// Types for the comprehensive stats
interface PlatformStats {
    users: {
        total: number;
        growth: number;
        newThisMonth: number;
        activeUsers: number;
        landlords: number;
        tenants: number;
        admins: number;
    };
    properties: {
        total: number;
        growth: number;
        newThisMonth: number;
    };
    units: {
        total: number;
        occupied: number;
        vacant: number;
        occupancyRate: number;
        potentialMonthlyRevenue: number;
    };
    leases: {
        active: number;
        ended: number;
        expiringSoon: number;
    };
    revenue: {
        total: number;
        thisMonth: number;
        lastMonth: number;
        growth: number;
        onlineThisMonth: number;
        failedPayments: number;
        pendingPayments: number;
        monthlyTrend: { month: string; year: number; amount: number }[];
    };
    collection: {
        totalDue: number;
        totalCollected: number;
        outstanding: number;
        collectionRate: number;
    };
    maintenance: {
        total: number;
        open: number;
        completed: number;
        urgent: number;
        completionRate: number;
    };
    alerts: {
        type: 'danger' | 'warning' | 'info';
        title: string;
        message: string;
        count?: number;
    }[];
    recentActivity: {
        id: string;
        message: string;
        action: string;
        timestamp: string;
        type: 'success' | 'warning' | 'danger' | 'info';
    }[];
    charts: {
        revenueByMonth: { month: string; year: number; amount: number }[];
        userGrowthByMonth: { month: string; year: number; count: number }[];
    };
    overdueTenants: {
        id: string;
        tenant: string;
        property: string;
        unit: string;
        amountDue: number;
        amountPaid: number;
        outstanding: number;
        dueDate: string;
    }[];
}

// Metric Card Component
function MetricCard({
    label,
    value,
    subtitle,
    growth,
    icon: Icon,
    trend,
    color,
}: {
    label: string;
    value: string | number;
    subtitle?: string;
    growth?: number;
    icon: React.ElementType;
    trend?: 'up' | 'down' | 'neutral';
    color: string;
}) {
    return (
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-gray-600 transition-colors">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-gray-400 text-sm font-medium">{label}</p>
                    <div className="flex items-baseline gap-2 mt-1">
                        <p className="text-2xl font-bold">{value}</p>
                        {growth !== undefined && (
                            <span
                                className={`text-sm font-medium flex items-center ${
                                    growth > 0 ? 'text-green-400' : growth < 0 ? 'text-red-400' : 'text-gray-400'
                                }`}
                            >
                                {growth > 0 ? (
                                    <ArrowUpRight className="w-4 h-4" />
                                ) : growth < 0 ? (
                                    <ArrowDownRight className="w-4 h-4" />
                                ) : null}
                                {Math.abs(growth)}%
                            </span>
                        )}
                    </div>
                    {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
                </div>
                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
        </div>
    );
}

// Alert Card Component
function AlertCard({ alert }: { alert: PlatformStats['alerts'][0] }) {
    const colors = {
        danger: 'bg-red-500/10 border-red-500/30 text-red-400',
        warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
        info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    };

    const icons = {
        danger: XCircle,
        warning: AlertTriangle,
        info: AlertCircle,
    };

    const Icon = icons[alert.type];

    return (
        <div className={`p-4 rounded-lg border ${colors[alert.type]}`}>
            <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                    <div className="font-medium">{alert.title}</div>
                    <div className="text-sm opacity-80 mt-0.5">{alert.message}</div>
                </div>
                {alert.count && (
                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-white/10">
                        {alert.count}
                    </span>
                )}
            </div>
        </div>
    );
}

// Activity Item Component
function ActivityItem({ activity }: { activity: PlatformStats['recentActivity'][0] }) {
    const colors = {
        success: 'bg-green-500',
        warning: 'bg-yellow-500',
        danger: 'bg-red-500',
        info: 'bg-blue-500',
    };

    return (
        <div className="flex items-start gap-3 p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors">
            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${colors[activity.type]}`} />
            <div className="flex-1 min-w-0">
                <p className="text-sm">{activity.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                    {new Date(activity.timestamp).toLocaleString()}
                </p>
            </div>
        </div>
    );
}

// Mini Chart Component (simple bar visualization)
function MiniChart({ data, maxHeight = 60 }: { data: { value: number; label: string }[]; maxHeight?: number }) {
    const max = Math.max(...data.map((d) => d.value), 1);

    return (
        <div className="flex items-end gap-1 h-16">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                    <div
                        className="w-full bg-purple-500/80 rounded-t transition-all hover:bg-purple-400"
                        style={{ height: `${(d.value / max) * maxHeight}px`, minHeight: d.value > 0 ? '4px' : '0' }}
                    />
                    <span className="text-[10px] text-gray-500 mt-1">{d.label}</span>
                </div>
            ))}
        </div>
    );
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        try {
            const response = await fetch('/api/admin/stats');
            const result = await response.json();
            if (result.success) {
                setStats(result.data);
                setError('');
            } else {
                setError(result.error || 'Failed to load stats');
            }
        } catch {
            setError('Failed to load platform statistics');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
        // Auto-refresh every 5 minutes
        const interval = setInterval(() => fetchStats(true), 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-purple-500 mx-auto" />
                    <p className="text-gray-400 mt-4">Loading command center...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
                <p className="text-gray-400 mb-4">{error}</p>
                <button
                    onClick={() => fetchStats()}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Platform Command Center</h1>
                    <p className="text-gray-400">Real-time overview of RentPilot platform</p>
                </div>
                <button
                    onClick={() => fetchStats(true)}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* SECTION 1: Platform Health Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <MetricCard
                    label="Total Users"
                    value={stats?.users.total || 0}
                    growth={stats?.users.growth}
                    subtitle={`${stats?.users.activeUsers || 0} active last 30 days`}
                    icon={Users}
                    color="bg-gradient-to-br from-blue-500 to-blue-600"
                />
                <MetricCard
                    label="Active Properties"
                    value={stats?.properties.total || 0}
                    growth={stats?.properties.growth}
                    subtitle={`${stats?.properties.newThisMonth || 0} new this month`}
                    icon={Building2}
                    color="bg-gradient-to-br from-green-500 to-green-600"
                />
                <MetricCard
                    label="Occupancy Rate"
                    value={`${stats?.units.occupancyRate || 0}%`}
                    subtitle={`${stats?.units.occupied || 0} of ${stats?.units.total || 0} units`}
                    icon={PieChart}
                    color="bg-gradient-to-br from-purple-500 to-purple-600"
                />
                <MetricCard
                    label="Monthly Revenue"
                    value={`R${(stats?.revenue.thisMonth || 0).toLocaleString()}`}
                    growth={stats?.revenue.growth}
                    subtitle={`vs R${(stats?.revenue.lastMonth || 0).toLocaleString()} last month`}
                    icon={TrendingUp}
                    color="bg-gradient-to-br from-emerald-500 to-emerald-600"
                />
                <MetricCard
                    label="Failed Payments"
                    value={stats?.revenue.failedPayments || 0}
                    subtitle={`${stats?.revenue.pendingPayments || 0} pending`}
                    icon={AlertTriangle}
                    color={
                        (stats?.revenue.failedPayments || 0) > 0
                            ? 'bg-gradient-to-br from-red-500 to-red-600'
                            : 'bg-gradient-to-br from-gray-500 to-gray-600'
                    }
                />
            </div>

            {/* SECTION 2: Operational Alerts */}
            {stats?.alerts && stats.alerts.length > 0 && (
                <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Bell className="w-5 h-5 text-yellow-400" />
                            Operational Alerts
                        </h3>
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">
                            {stats.alerts.length} active
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {stats.alerts.map((alert, i) => (
                            <AlertCard key={i} alert={alert} />
                        ))}
                    </div>
                </div>
            )}

            {/* SECTION 3: Charts + Financial Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Trend Chart */}
                <div className="lg:col-span-2 bg-gray-800 rounded-xl p-5 border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-purple-400" />
                            Revenue Trend (Last 6 Months)
                        </h3>
                        <span className="text-sm text-gray-400">
                            Total: R{(stats?.revenue.total || 0).toLocaleString()}
                        </span>
                    </div>
                    <MiniChart
                        data={
                            stats?.charts.revenueByMonth.map((m) => ({
                                value: m.amount,
                                label: m.month,
                            })) || []
                        }
                        maxHeight={80}
                    />
                    <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-700">
                        <div>
                            <p className="text-xs text-gray-400">Collection Rate</p>
                            <p className="text-lg font-bold text-green-400">
                                {stats?.collection.collectionRate || 0}%
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Outstanding</p>
                            <p className="text-lg font-bold text-yellow-400">
                                R{(stats?.collection.outstanding || 0).toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Potential Monthly</p>
                            <p className="text-lg font-bold text-blue-400">
                                R{(stats?.units.potentialMonthlyRevenue || 0).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Platform Breakdown */}
                <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                    <h3 className="font-semibold flex items-center gap-2 mb-4">
                        <Activity className="w-5 h-5 text-blue-400" />
                        Platform Breakdown
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                    <Users className="w-4 h-4 text-blue-400" />
                                </div>
                                <span className="text-sm">Landlords</span>
                            </div>
                            <span className="font-bold">{stats?.users.landlords || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                                    <Users className="w-4 h-4 text-green-400" />
                                </div>
                                <span className="text-sm">Tenants</span>
                            </div>
                            <span className="font-bold">{stats?.users.tenants || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                    <FileText className="w-4 h-4 text-purple-400" />
                                </div>
                                <span className="text-sm">Active Leases</span>
                            </div>
                            <span className="font-bold">{stats?.leases.active || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                                    <Calendar className="w-4 h-4 text-orange-400" />
                                </div>
                                <span className="text-sm">Expiring Soon</span>
                            </div>
                            <span className={`font-bold ${(stats?.leases.expiringSoon || 0) > 0 ? 'text-orange-400' : ''}`}>
                                {stats?.leases.expiringSoon || 0}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center">
                                    <Wrench className="w-4 h-4 text-pink-400" />
                                </div>
                                <span className="text-sm">Open Maintenance</span>
                            </div>
                            <span className={`font-bold ${(stats?.maintenance.urgent || 0) > 0 ? 'text-red-400' : ''}`}>
                                {stats?.maintenance.open || 0}
                                {(stats?.maintenance.urgent || 0) > 0 && (
                                    <span className="text-xs ml-1">({stats?.maintenance.urgent} urgent)</span>
                                )}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 4: Activity Feed + Quick Actions + Overdue */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Activity Feed */}
                <div className="lg:col-span-2 bg-gray-800 rounded-xl p-5 border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Clock className="w-5 h-5 text-green-400" />
                            Recent Activity
                        </h3>
                        <Link
                            href="/admin/logs"
                            className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                        >
                            View All <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                    {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                            {stats.recentActivity.map((activity) => (
                                <ActivityItem key={activity.id} activity={activity} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p>No recent activity</p>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="space-y-6">
                    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                        <h3 className="font-semibold mb-4">Quick Actions</h3>
                        <div className="space-y-2">
                            <Link
                                href="/admin/users"
                                className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <UserPlus className="w-5 h-5 text-blue-400" />
                                    <span>Manage Users</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                            </Link>
                            <Link
                                href="/admin/properties"
                                className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <Home className="w-5 h-5 text-green-400" />
                                    <span>View Properties</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                            </Link>
                            <Link
                                href="/admin/payments"
                                className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <Receipt className="w-5 h-5 text-purple-400" />
                                    <span>View Payments</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                            </Link>
                            <Link
                                href="/admin/leases"
                                className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-orange-400" />
                                    <span>Manage Leases</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                            </Link>
                            <Link
                                href="/admin/logs"
                                className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <Activity className="w-5 h-5 text-pink-400" />
                                    <span>Activity Logs</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                            </Link>
                        </div>
                    </div>

                    {/* Overdue Tenants */}
                    {stats?.overdueTenants && stats.overdueTenants.length > 0 && (
                        <div className="bg-gray-800 rounded-xl p-5 border border-red-500/30">
                            <h3 className="font-semibold mb-4 flex items-center gap-2 text-red-400">
                                <DollarSign className="w-5 h-5" />
                                Overdue Payments
                            </h3>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {stats.overdueTenants.slice(0, 5).map((item) => (
                                    <div key={item.id} className="p-3 bg-red-500/10 rounded-lg">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium text-sm">{item.tenant}</p>
                                                <p className="text-xs text-gray-400">
                                                    {item.property} - Unit {item.unit}
                                                </p>
                                            </div>
                                            <span className="font-bold text-red-400">
                                                R{item.outstanding.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* SECTION 5: User Growth Chart */}
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                        User Growth (Last 6 Months)
                    </h3>
                    <span className="text-sm text-gray-400">
                        {stats?.users.newThisMonth || 0} new this month
                    </span>
                </div>
                <MiniChart
                    data={
                        stats?.charts.userGrowthByMonth.map((m) => ({
                            value: m.count,
                            label: m.month,
                        })) || []
                    }
                    maxHeight={60}
                />
            </div>
        </div>
    );
}
