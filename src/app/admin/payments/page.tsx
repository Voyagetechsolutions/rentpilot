'use client';

import React, { useEffect, useState } from 'react';
import {
    CreditCard,
    Search,
    Loader2,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Download,
    TrendingUp,
    DollarSign,
    XCircle,
    Clock,
} from 'lucide-react';

interface Payment {
    id: string;
    amount: number;
    method: string;
    datePaid: string;
    reference: string | null;
    status: string;
    source: string;
    tenant: {
        fullName: string;
    };
    lease: {
        unit: {
            unitNumber: string;
            property: {
                name: string;
            };
        };
    };
}

interface FinanceOverview {
    totalRevenue: number;
    totalPayments: number;
    thisMonthRevenue: number;
    thisMonthPayments: number;
    monthlyGrowth: number;
    platformFeesCollected: number;
    failedPayments: number;
    pendingPayments: number;
}

export default function AdminPaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [finance, setFinance] = useState<FinanceOverview | null>(null);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '15',
            });
            if (search) params.append('search', search);

            const response = await fetch(`/api/admin/payments?${params}`);
            const result = await response.json();
            if (result.success) {
                setPayments(result.data.payments);
                setTotalPages(result.data.totalPages);
            } else {
                setError(result.error);
            }
        } catch {
            setError('Failed to load payments');
        } finally {
            setLoading(false);
        }
    };

    const fetchFinance = async () => {
        try {
            const response = await fetch('/api/admin/finance');
            const result = await response.json();
            if (result.success) {
                setFinance(result.data.overview);
            }
        } catch {
            // Finance KPIs are supplementary
        }
    };

    useEffect(() => {
        fetchFinance();
    }, []);

    useEffect(() => {
        fetchPayments();
    }, [page]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchPayments();
    };

    const getMethodBadge = (method: string) => {
        const colors: Record<string, string> = {
            ONLINE: 'bg-green-500/20 text-green-400',
            CASH: 'bg-blue-500/20 text-blue-400',
            BANK_TRANSFER: 'bg-purple-500/20 text-purple-400',
            CARD: 'bg-orange-500/20 text-orange-400',
        };
        return colors[method] || 'bg-gray-500/20 text-gray-400';
    };

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            SUCCESS: 'bg-green-500/20 text-green-400',
            PENDING: 'bg-yellow-500/20 text-yellow-400',
            FAILED: 'bg-red-500/20 text-red-400',
        };
        return colors[status] || 'bg-gray-500/20 text-gray-400';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <CreditCard className="w-7 h-7" />
                        Payment Monitoring
                    </h1>
                    <p className="text-gray-400">Track all payments across the platform</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                    <Download className="w-4 h-4" />
                    Export
                </button>
            </div>

            {/* Finance KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Total Revenue</p>
                            <p className="text-2xl font-bold">R{(finance?.totalRevenue || 0).toLocaleString()}</p>
                            <p className="text-xs text-gray-500 mt-1">{finance?.totalPayments || 0} total payments</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>
                <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">This Month</p>
                            <p className="text-2xl font-bold">R{(finance?.thisMonthRevenue || 0).toLocaleString()}</p>
                            <p className="text-xs mt-1">
                                {finance?.monthlyGrowth !== undefined && (
                                    <span className={finance.monthlyGrowth >= 0 ? 'text-green-400' : 'text-red-400'}>
                                        {finance.monthlyGrowth >= 0 ? '↑' : '↓'} {Math.abs(finance.monthlyGrowth)}% vs last month
                                    </span>
                                )}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>
                <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Platform Fees</p>
                            <p className="text-2xl font-bold">R{(finance?.platformFeesCollected || 0).toLocaleString()}</p>
                            <p className="text-xs text-gray-500 mt-1">2% per transaction</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                            <CreditCard className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>
                <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Issues</p>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="flex items-center gap-1">
                                    <XCircle className="w-4 h-4 text-red-400" />
                                    <span className="text-lg font-bold">{finance?.failedPayments || 0}</span>
                                    <span className="text-xs text-gray-500">failed</span>
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4 text-yellow-400" />
                                    <span className="text-lg font-bold">{finance?.pendingPayments || 0}</span>
                                    <span className="text-xs text-gray-500">pending</span>
                                </span>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <form onSubmit={handleSearch} className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by tenant name or reference..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
                    >
                        Search
                    </button>
                </form>
            </div>

            {/* Payments Table */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <AlertCircle className="w-12 h-12 text-red-500 mb-2" />
                        <p className="text-gray-400">{error}</p>
                    </div>
                ) : payments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <CreditCard className="w-12 h-12 text-gray-500 mb-2" />
                        <p className="text-gray-400">No payments found</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-700/50">
                            <tr>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Tenant</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Property / Unit</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Amount</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Method</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Status</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Date</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Reference</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {payments.map((payment) => (
                                <tr key={payment.id} className="hover:bg-gray-700/30">
                                    <td className="px-4 py-4 font-medium">
                                        {payment.tenant.fullName}
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="text-sm">
                                            <div>{payment.lease.unit.property.name}</div>
                                            <div className="text-gray-400">Unit {payment.lease.unit.unitNumber}</div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 font-bold text-green-400">
                                        R{payment.amount.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getMethodBadge(payment.method)}`}>
                                            {payment.method}
                                        </span>
                                        {payment.source === 'online' && (
                                            <span className="ml-1 text-[10px] text-blue-400">⚡</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(payment.status)}`}>
                                            {payment.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-gray-400">
                                        {new Date(payment.datePaid).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-4 text-gray-400 font-mono text-sm">
                                        {payment.reference || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Pagination */}
                {!loading && payments.length > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700">
                        <div className="text-sm text-gray-400">
                            Page {page} of {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
