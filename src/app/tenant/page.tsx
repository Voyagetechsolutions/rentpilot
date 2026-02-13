'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { TenantLayout } from '@/components/layout/TenantLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
    Home,
    CreditCard,
    Wrench,
    Calendar,
    ArrowRight,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Clock,
    FileText,
    Settings,
} from 'lucide-react';

interface DashboardData {
    tenant: {
        id: string;
        fullName: string;
        phone: string;
    };
    lease: {
        id: string;
        unit: string;
        property: string;
        address: string;
        city: string;
        startDate: string;
        endDate: string;
        rentAmount: number;
        dueDay: number;
    } | null;
    rentSummary: {
        currentRent: number;
        totalDue: number;
        totalPaid: number;
        balance: number;
        nextDueDate: string | null;
        canPay: boolean;
    };
    recentPayments: {
        id: string;
        amount: number;
        date: string;
        method: string;
        reference: string;
        status: string;
    }[];
    recentMaintenance: {
        id: string;
        title: string;
        status: string;
        priority: string;
        createdAt: string;
        unit: string;
    }[];
    stats: {
        openMaintenanceCount: number;
    };
}

export default function TenantDashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const response = await fetch('/api/tenant/dashboard');
                const result = await response.json();
                if (result.success) {
                    setData(result.data);
                } else {
                    setError(result.error || 'Failed to load dashboard');
                }
            } catch {
                setError('Failed to load dashboard');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    if (loading) {
        return (
            <TenantLayout title="Dashboard">
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
            </TenantLayout>
        );
    }

    if (error || !data) {
        return (
            <TenantLayout title="Dashboard">
                <div className="text-center py-20">
                    <AlertCircle className="w-16 h-16 text-danger mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Unable to load dashboard</h2>
                    <p className="text-text-secondary mb-4">{error}</p>
                    <Button onClick={() => window.location.reload()}>Try Again</Button>
                </div>
            </TenantLayout>
        );
    }

    const getPaymentStatusBadge = (status: string) => {
        const variants: Record<string, 'success' | 'warning' | 'info' | 'danger'> = {
            SUCCESS: 'success',
            APPROVED: 'success',
            PENDING: 'warning',
            FAILED: 'danger',
            REJECTED: 'danger',
        };
        const labels: Record<string, string> = {
            SUCCESS: 'Paid',
            APPROVED: 'Approved',
            PENDING: 'Pending',
            FAILED: 'Failed',
            REJECTED: 'Rejected',
        };
        return <Badge variant={variants[status] || 'info'}>{labels[status] || status}</Badge>;
    };

    const getMaintenanceStatusBadge = (status: string) => {
        const variants: Record<string, 'success' | 'warning' | 'info' | 'danger'> = {
            SUBMITTED: 'info',
            IN_REVIEW: 'warning',
            IN_PROGRESS: 'warning',
            COMPLETED: 'success',
            REJECTED: 'danger',
        };
        return <Badge variant={variants[status] || 'info'}>{status.replace('_', ' ')}</Badge>;
    };

    const formatNextDueDate = (dateStr: string | null) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const day = date.getDate();
        const suffixes = ['th', 'st', 'nd', 'rd'];
        const suffix = ((day % 100) > 10 && (day % 100) < 20) ? 'th' : (suffixes[day % 10] || 'th');
        const month = date.toLocaleString('default', { month: 'long' });
        return `${day}${suffix} of ${month}`;
    };

    return (
        <TenantLayout title="Dashboard">
            <div className="space-y-6">
                {/* Welcome Section */}
                <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-6 text-white">
                    <h1 className="text-2xl font-bold mb-2">
                        Welcome back, {data.tenant.fullName.split(' ')[0]}!
                    </h1>
                    {data.lease ? (
                        <p className="text-white/80">
                            You&apos;re renting {data.lease.unit} at {data.lease.property}
                        </p>
                    ) : (
                        <p className="text-white/80">
                            You don&apos;t have an active lease yet.
                        </p>
                    )}
                </div>

                {/* Rent Summary Cards */}
                {data.lease && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Monthly Rent */}
                        <Card className="border-l-4 border-l-primary">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center">
                                    <Home className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <div className="text-sm text-text-muted">Monthly Rent</div>
                                    <div className="text-2xl font-bold">
                                        R{data.rentSummary.currentRent.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Balance Due */}
                        <Card className={`border-l-4 ${data.rentSummary.balance > 0 ? 'border-l-danger' : 'border-l-success'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${data.rentSummary.balance > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                                        <CreditCard className={`w-6 h-6 ${data.rentSummary.balance > 0 ? 'text-red-600' : 'text-green-600'}`} />
                                    </div>
                                    <div>
                                        <div className="text-sm text-text-muted">Balance Due</div>
                                        <div className={`text-2xl font-bold ${data.rentSummary.balance > 0 ? 'text-danger' : 'text-success'}`}>
                                            {data.rentSummary.balance > 0
                                                ? `R${data.rentSummary.balance.toLocaleString()}`
                                                : 'Paid ✓'}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <Link href="/tenant/pay">
                                        <Button
                                            size="sm"
                                            disabled={!data.rentSummary.canPay}
                                            title={!data.rentSummary.canPay ? (data.rentSummary.balance <= 0 ? 'Nothing due' : 'Payment opens on the 20th') : 'Pay now'}
                                        >
                                            Pay Now
                                        </Button>
                                    </Link>
                                    {!data.rentSummary.canPay && data.rentSummary.balance > 0 && (
                                        <span className="text-xs text-text-muted">Opens on 20th</span>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Next Due Date */}
                        <Card className="border-l-4 border-l-warning">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                                    <Calendar className="w-6 h-6 text-orange-600" />
                                </div>
                                <div>
                                    <div className="text-sm text-text-muted">Next Due Date</div>
                                    <div className="text-lg font-bold">
                                        {formatNextDueDate(data.rentSummary.nextDueDate)}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link href="/tenant/payments">
                        <Card className="hover:border-primary transition-colors cursor-pointer text-center py-6">
                            <CreditCard className="w-8 h-8 text-primary mx-auto mb-2" />
                            <div className="font-medium">Payment History</div>
                        </Card>
                    </Link>
                    <Link href="/tenant/maintenance?action=new">
                        <Card className="hover:border-primary transition-colors cursor-pointer text-center py-6">
                            <Wrench className="w-8 h-8 text-primary mx-auto mb-2" />
                            <div className="font-medium">Report Issue</div>
                        </Card>
                    </Link>
                    <Link href="/tenant/lease">
                        <Card className="hover:border-primary transition-colors cursor-pointer text-center py-6">
                            <FileText className="w-8 h-8 text-primary mx-auto mb-2" />
                            <div className="font-medium">View Lease</div>
                        </Card>
                    </Link>
                    <Link href="/tenant/maintenance">
                        <Card className="hover:border-primary transition-colors cursor-pointer text-center py-6 relative">
                            <Wrench className="w-8 h-8 text-primary mx-auto mb-2" />
                            <div className="font-medium">Maintenance</div>
                            {data.stats.openMaintenanceCount > 0 && (
                                <span className="absolute top-2 right-2 bg-danger text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {data.stats.openMaintenanceCount}
                                </span>
                            )}
                        </Card>
                    </Link>
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Payments */}
                    <Card>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">Recent Payments</h3>
                            <Link href="/tenant/payments" className="text-primary text-sm hover:underline flex items-center gap-1">
                                View All <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                        {data.recentPayments.length > 0 ? (
                            <div className="space-y-3">
                                {data.recentPayments.map((payment) => (
                                    <div key={payment.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${payment.status === 'SUCCESS' ? 'bg-green-100' :
                                                    payment.status === 'PENDING' ? 'bg-orange-100' :
                                                        'bg-red-100'
                                                }`}>
                                                {payment.status === 'SUCCESS' ? <CheckCircle2 className="w-4 h-4 text-green-600" /> :
                                                    payment.status === 'PENDING' ? <Clock className="w-4 h-4 text-orange-600" /> :
                                                        <AlertCircle className="w-4 h-4 text-red-600" />}
                                            </div>
                                            <div>
                                                <div className="font-medium">R{payment.amount.toLocaleString()}</div>
                                                <div className="text-sm text-text-muted">
                                                    {new Date(payment.date).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        {getPaymentStatusBadge(payment.status)}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-text-muted">
                                <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                <p>No payment history yet</p>
                            </div>
                        )}
                    </Card>

                    {/* Recent Maintenance */}
                    <Card>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">Maintenance Requests</h3>
                            <Link href="/tenant/maintenance" className="text-primary text-sm hover:underline flex items-center gap-1">
                                View All <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                        {data.recentMaintenance.length > 0 ? (
                            <div className="space-y-3">
                                {data.recentMaintenance.map((request) => (
                                    <div key={request.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                                        <div className="flex items-center gap-3">
                                            <Clock className="w-5 h-5 text-text-muted" />
                                            <div>
                                                <div className="font-medium">{request.title}</div>
                                                <div className="text-sm text-text-muted">
                                                    {new Date(request.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        {getMaintenanceStatusBadge(request.status)}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-text-muted">
                                <Wrench className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                <p>No maintenance requests</p>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </TenantLayout>
    );
}
