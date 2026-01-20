'use client';

import React, { useEffect, useState } from 'react';
import {
    FileText,
    Search,
    Loader2,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Users,
    Home,
    DollarSign,
} from 'lucide-react';

interface Lease {
    id: string;
    startDate: string;
    endDate: string;
    monthlyRent: number;
    status: string;
    tenant: {
        fullName: string;
        email: string;
    };
    unit: {
        unitNumber: string;
        property: {
            name: string;
            landlord: {
                name: string | null;
                email: string;
            };
        };
    };
}

export default function AdminLeasesPage() {
    const [leases, setLeases] = useState<Lease[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const fetchLeases = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10',
            });
            if (search) params.append('search', search);
            if (statusFilter) params.append('status', statusFilter);

            const response = await fetch(`/api/admin/leases?${params}`);
            const result = await response.json();
            if (result.success) {
                setLeases(result.data.leases);
                setTotalPages(result.data.totalPages);
                setTotalCount(result.data.total);
            } else {
                setError(result.error);
            }
        } catch {
            setError('Failed to load leases');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeases();
    }, [page, statusFilter]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchLeases();
    };

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            ACTIVE: 'bg-green-500/20 text-green-400',
            PENDING: 'bg-yellow-500/20 text-yellow-400',
            ENDED: 'bg-gray-500/20 text-gray-400',
            TERMINATED: 'bg-red-500/20 text-red-400',
        };
        return colors[status] || 'bg-gray-500/20 text-gray-400';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="w-7 h-7" />
                        All Leases
                    </h1>
                    <p className="text-gray-400">View all leases across the platform ({totalCount} total)</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <form onSubmit={handleSearch} className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by tenant or property..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="">All Status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="PENDING">Pending</option>
                        <option value="ENDED">Ended</option>
                        <option value="TERMINATED">Terminated</option>
                    </select>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
                    >
                        Search
                    </button>
                </form>
            </div>

            {/* Leases Table */}
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
                ) : leases.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <FileText className="w-12 h-12 text-gray-500 mb-2" />
                        <p className="text-gray-400">No leases found</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-700/50">
                            <tr>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Tenant</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Property / Unit</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Landlord</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Rent</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Period</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {leases.map((lease) => (
                                <tr key={lease.id} className="hover:bg-gray-700/30">
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                                                <Users className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <div className="font-medium">{lease.tenant.fullName}</div>
                                                <div className="text-sm text-gray-400">{lease.tenant.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <Home className="w-4 h-4 text-gray-400" />
                                            <div>
                                                <div className="text-sm">{lease.unit.property.name}</div>
                                                <div className="text-xs text-gray-400">Unit {lease.unit.unitNumber}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-300">
                                        {lease.unit.property.landlord.name || lease.unit.property.landlord.email}
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-1 font-bold text-green-400">
                                            <DollarSign className="w-4 h-4" />
                                            R{lease.monthlyRent.toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-1 text-sm text-gray-400">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(lease.startDate).toLocaleDateString()} - {new Date(lease.endDate).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(lease.status)}`}>
                                            {lease.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Pagination */}
                {!loading && leases.length > 0 && (
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
