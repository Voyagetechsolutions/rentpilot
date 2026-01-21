'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import {
    Download,
    BarChart3,
    TrendingUp,
    DollarSign,
    Home,
    Users,
    Loader2,
    FileSpreadsheet,
} from 'lucide-react';

const periodOptions = [
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_quarter', label: 'This Quarter' },
    { value: 'this_year', label: 'This Year' },
];

interface ReportData {
    kpis: {
        totalIncome: number;
        occupancyRate: number;
        outstanding: number;
        activeTenants: number;
    };
    periodLabel: string;
}

export default function ReportsPage() {
    const [period, setPeriod] = useState('this_month');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<ReportData | null>(null);

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/reports?period=${period}`);
                const result = await response.json();
                if (result.success) {
                    setData(result.data);
                }
            } catch (error) {
                console.error('Error fetching report data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, [period]);

    const reports = [
        {
            id: 'income',
            title: 'Income Report',
            description: 'Summary of all rent collected and payment sources',
            icon: DollarSign,
            category: 'Financial',
        },
        {
            id: 'arrears-aging',
            title: 'Arrears Aging Report',
            description: 'Outstanding rent by age (30/60/90+ days overdue)',
            icon: TrendingUp,
            category: 'Financial',
        },
        {
            id: 'unit-profitability',
            title: 'Unit Profitability Report',
            description: 'Income vs expenses per unit, ROI analysis',
            icon: BarChart3,
            category: 'Financial',
        },
        {
            id: 'occupancy',
            title: 'Occupancy Report',
            description: 'Unit occupancy rates and vacancy trends',
            icon: Home,
            category: 'Property',
        },
        {
            id: 'vacancy-analysis',
            title: 'Vacancy Analysis',
            description: 'Vacant units, days vacant, turnover rate',
            icon: Home,
            category: 'Property',
        },
        {
            id: 'maintenance-costs',
            title: 'Maintenance Cost Report',
            description: 'Maintenance expenses by property and category',
            icon: TrendingUp,
            category: 'Property',
        },
        {
            id: 'tenant-performance',
            title: 'Tenant Payment Performance',
            description: 'On-time payment rate, payment history by tenant',
            icon: Users,
            category: 'Tenant',
        },
        {
            id: 'lease-expiry',
            title: 'Lease Expiry Report',
            description: 'Upcoming lease expirations (30/60/90 days)',
            icon: Users,
            category: 'Tenant',
        },
    ];

    const formatCurrency = (amount: number) => `R${amount.toLocaleString()}`;

    return (
        <AppShell
            title="Reports"
            breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Reports' }]}
        >
            {/* Page Header */}
            <div className="page-header">
                <div className="flex items-center gap-4">
                    <Select
                        options={periodOptions}
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                    />
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <div className="text-sm text-text-muted">Total Income</div>
                            <div className="text-xl font-bold">
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    formatCurrency(data?.kpis.totalIncome || 0)
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Home className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-sm text-text-muted">Occupancy Rate</div>
                            <div className="text-xl font-bold">
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    `${data?.kpis.occupancyRate || 0}%`
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <div className="text-sm text-text-muted">Outstanding</div>
                            <div className="text-xl font-bold">
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    formatCurrency(data?.kpis.outstanding || 0)
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                            <Users className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <div className="text-sm text-text-muted">Active Tenants</div>
                            <div className="text-xl font-bold">
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    data?.kpis.activeTenants || 0
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Report Cards */}
            <h3 className="text-lg font-semibold mb-4">Available Reports</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reports.map((report) => (
                    <Card key={report.id} className="hover:border-primary transition-colors cursor-pointer">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
                                <report.icon className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-lg mb-1">{report.title}</h4>
                                <p className="text-text-secondary text-sm mb-4">{report.description}</p>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="secondary">
                                        <BarChart3 className="w-4 h-4" />
                                        View
                                    </Button>
                                    <Button size="sm" variant="tertiary">
                                        <Download className="w-4 h-4" />
                                        PDF
                                    </Button>
                                    <Button size="sm" variant="tertiary">
                                        <FileSpreadsheet className="w-4 h-4" />
                                        Excel
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </AppShell >
    );
}
