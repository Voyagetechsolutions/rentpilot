'use client';

import React from 'react';
import { AppShell } from '@/components/layout';
import { KpiCard } from '@/components/ui/KpiCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDashboard } from '@/lib/hooks';
import {
    DollarSign,
    TrendingUp,
    AlertCircle,
    Home,
    Wrench,
    DoorOpen,
    Plus,
    Loader2,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
    const { data, loading, error } = useDashboard();

    if (loading) {
        return (
            <AppShell title="Overview">
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </AppShell>
        );
    }

    if (error) {
        return (
            <AppShell title="Overview">
                <Card>
                    <div className="text-center py-10">
                        <p className="text-danger mb-4">Error loading dashboard: {error}</p>
                        <Button onClick={() => window.location.reload()}>Retry</Button>
                    </div>
                </Card>
            </AppShell>
        );
    }

    const hasData = data && data.kpis.totalUnits > 0;

    if (!hasData) {
        return (
            <AppShell title="Overview">
                {/* Welcome Message */}
                <div className="bg-gradient-to-r from-cyan-500 to-teal-600 rounded-2xl p-8 text-white mb-8">
                    <h2 className="text-2xl font-bold mb-2">Welcome to RentPilot! 👋</h2>
                    <p className="text-cyan-100 mb-6">
                        Let's get you started. Add your first property to begin managing your rentals.
                    </p>
                    <Link href="/properties">
                        <Button className="bg-white text-cyan-600 hover:bg-cyan-50">
                            <Plus className="w-4 h-4" />
                            Add Your First Property
                        </Button>
                    </Link>
                </div>

                {/* KPI Cards - Showing zeros */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    <KpiCard label="Rent Due (This Month)" value="R0" icon={<DollarSign className="w-5 h-5" />} />
                    <KpiCard label="Collected (This Month)" value="R0" icon={<TrendingUp className="w-5 h-5" />} />
                    <KpiCard label="Overdue Amount" value="R0" icon={<AlertCircle className="w-5 h-5" />} />
                    <KpiCard label="Occupancy Rate" value="0%" icon={<Home className="w-5 h-5" />} />
                    <KpiCard label="Open Maintenance" value="0" icon={<Wrench className="w-5 h-5" />} />
                    <KpiCard label="Vacant Units" value="0" icon={<DoorOpen className="w-5 h-5" />} />
                </div>

                {/* Getting Started Checklist */}
                <Card title="Getting Started Checklist" className="mb-8">
                    <div className="space-y-4">
                        {[
                            { step: 1, title: 'Add your first property', desc: 'Create a property to organize your units', href: '/properties' },
                            { step: 2, title: 'Add units to your property', desc: 'Define the units within your property', href: '/units' },
                            { step: 3, title: 'Add a tenant', desc: 'Register your first tenant', href: '/tenants' },
                            { step: 4, title: 'Create a lease', desc: 'Link a tenant to a unit with a lease agreement', href: '/leases' },
                        ].map((item) => (
                            <Link key={item.step} href={item.href}
                                className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary-light transition-colors">
                                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center">
                                    {item.step}
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900">{item.title}</div>
                                    <div className="text-sm text-gray-500">{item.desc}</div>
                                </div>
                                <div className="text-primary">→</div>
                            </Link>
                        ))}
                    </div>
                </Card>

                {/* Empty State Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <EmptyState icon={<DollarSign className="w-16 h-16" />} title="No rent charges yet" description="Rent charges will appear here once you have active leases" />
                    </Card>
                    <Card>
                        <EmptyState icon={<Wrench className="w-16 h-16" />} title="No maintenance requests" description="Maintenance tickets from tenants will appear here" />
                    </Card>
                </div>
            </AppShell>
        );
    }

    // When there's data, show the full dashboard
    const { kpis, overdueLeases, recentMaintenance } = data;

    return (
        <AppShell title="Overview">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <KpiCard
                    label="Rent Due (This Month)"
                    value={`R${kpis.rentDue.toLocaleString()}`}
                    icon={<DollarSign className="w-5 h-5" />}
                    onClick={() => window.location.href = '/rent-ledger'}
                />
                <KpiCard
                    label="Collected (This Month)"
                    value={`R${kpis.rentCollected.toLocaleString()}`}
                    icon={<TrendingUp className="w-5 h-5" />}
                    onClick={() => window.location.href = '/payments'}
                />
                <KpiCard
                    label="Overdue Amount"
                    value={`R${kpis.overdueAmount.toLocaleString()}`}
                    icon={<AlertCircle className="w-5 h-5" />}
                    onClick={() => window.location.href = '/rent-ledger?status=overdue'}
                />
                <KpiCard
                    label="Occupancy Rate"
                    value={`${kpis.occupancyRate}%`}
                    icon={<Home className="w-5 h-5" />}
                    onClick={() => window.location.href = '/units'}
                />
                <KpiCard
                    label="Open Maintenance"
                    value={kpis.openTickets.toString()}
                    icon={<Wrench className="w-5 h-5" />}
                    onClick={() => window.location.href = '/maintenance'}
                />
                <KpiCard
                    label="Vacant Units"
                    value={kpis.vacantUnits.toString()}
                    icon={<DoorOpen className="w-5 h-5" />}
                    onClick={() => window.location.href = '/units?status=vacant'}
                />
            </div>

            {/* Overdue Tenants & Maintenance Queue */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Overdue Tenants" actions={
                    <Link href="/rent-ledger?status=overdue" className="text-sm text-primary hover:underline">
                        View All
                    </Link>
                }>
                    {overdueLeases.length > 0 ? (
                        <div className="space-y-3">
                            {overdueLeases.slice(0, 5).map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-3 bg-danger-light rounded-lg">
                                    <div>
                                        <div className="font-medium">{item.tenant}</div>
                                        <div className="text-sm text-text-secondary">{item.unit}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold text-danger">R{item.amount.toLocaleString()}</div>
                                        <div className="text-xs text-text-muted">Due {new Date(item.dueDate).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={<DollarSign className="w-12 h-12" />} title="No overdue tenants" description="All tenants are up to date with payments" />
                    )}
                </Card>

                <Card title="Maintenance Queue" actions={
                    <Link href="/maintenance" className="text-sm text-primary hover:underline">
                        View All
                    </Link>
                }>
                    {recentMaintenance.length > 0 ? (
                        <div className="space-y-3">
                            {recentMaintenance.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                                    <div>
                                        <div className="font-medium">{item.title}</div>
                                        <div className="text-sm text-text-secondary">{item.unit}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={item.priority.toLowerCase() as 'low' | 'medium' | 'high' | 'urgent'}>
                                            {item.priority}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={<Wrench className="w-12 h-12" />} title="No open tickets" description="All maintenance requests have been resolved" />
                    )}
                </Card>
            </div>
        </AppShell>
    );
}
