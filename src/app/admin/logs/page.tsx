'use client';

import React, { useEffect, useState } from 'react';
import {
    Activity,
    Search,
    Loader2,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Users,
    CreditCard,
    Building2,
    FileText,
    LogIn,
    UserPlus,
    Trash2,
    Edit,
} from 'lucide-react';

interface ActivityLog {
    id: string;
    userId: string | null;
    action: string;
    entityType: string | null;
    entityId: string | null;
    details: string | null;
    ipAddress: string | null;
    createdAt: string;
}

export default function AdminLogsPage() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
            });
            if (search) params.append('search', search);

            const response = await fetch(`/api/admin/logs?${params}`);
            const result = await response.json();
            if (result.success) {
                setLogs(result.data.logs);
                setTotalPages(result.data.totalPages);
            } else {
                setError(result.error);
            }
        } catch {
            setError('Failed to load logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchLogs();
    };

    const getActionIcon = (action: string) => {
        if (action.includes('USER') && action.includes('DELETE')) return <Trash2 className="w-4 h-4 text-red-400" />;
        if (action.includes('USER') && action.includes('ROLE')) return <Edit className="w-4 h-4 text-blue-400" />;
        if (action.includes('SIGNUP')) return <UserPlus className="w-4 h-4 text-green-400" />;
        if (action.includes('LOGIN')) return <LogIn className="w-4 h-4 text-blue-400" />;
        if (action.includes('PAYMENT')) return <CreditCard className="w-4 h-4 text-purple-400" />;
        if (action.includes('PROPERTY')) return <Building2 className="w-4 h-4 text-orange-400" />;
        if (action.includes('LEASE')) return <FileText className="w-4 h-4 text-cyan-400" />;
        return <Activity className="w-4 h-4 text-gray-400" />;
    };

    const getActionColor = (action: string) => {
        if (action.includes('DELETE')) return 'bg-red-500/20 text-red-400';
        if (action.includes('SIGNUP') || action.includes('CREATED')) return 'bg-green-500/20 text-green-400';
        if (action.includes('LOGIN')) return 'bg-blue-500/20 text-blue-400';
        if (action.includes('PAYMENT')) return 'bg-purple-500/20 text-purple-400';
        if (action.includes('ROLE')) return 'bg-orange-500/20 text-orange-400';
        return 'bg-gray-500/20 text-gray-400';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Activity className="w-7 h-7" />
                    Activity Logs
                </h1>
                <p className="text-gray-400">Track platform activities and events</p>
            </div>

            {/* Search */}
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <form onSubmit={handleSearch} className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by action..."
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

            {/* Logs List */}
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
                ) : logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Activity className="w-12 h-12 text-gray-500 mb-2" />
                        <p className="text-gray-400">No activity logs found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-700">
                        {logs.map((log) => {
                            let parsedDetails = null;
                            try {
                                parsedDetails = log.details ? JSON.parse(log.details) : null;
                            } catch {
                                parsedDetails = log.details;
                            }

                            return (
                                <div key={log.id} className="p-4 hover:bg-gray-700/30 flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-gray-700 flex items-center justify-center flex-shrink-0">
                                        {getActionIcon(log.action)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getActionColor(log.action)}`}>
                                                {log.action.replace(/_/g, ' ')}
                                            </span>
                                            {log.entityType && (
                                                <span className="text-xs text-gray-500">
                                                    {log.entityType}
                                                </span>
                                            )}
                                        </div>
                                        {parsedDetails && (
                                            <div className="text-sm text-gray-400 truncate">
                                                {typeof parsedDetails === 'object'
                                                    ? Object.entries(parsedDetails).map(([k, v]) => `${k}: ${v}`).join(', ')
                                                    : parsedDetails}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-500 flex-shrink-0">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {!loading && logs.length > 0 && (
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
