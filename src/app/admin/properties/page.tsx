'use client';

import React, { useEffect, useState } from 'react';
import {
    Building2,
    Search,
    Loader2,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    MapPin,
    Home,
    Users,
    Eye,
} from 'lucide-react';

interface Property {
    id: string;
    name: string;
    address: string;
    city: string;
    type: string;
    createdAt: string;
    landlord: {
        name: string | null;
        email: string;
    };
    _count: {
        units: number;
    };
}

export default function AdminPropertiesPage() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const fetchProperties = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10',
            });
            if (search) params.append('search', search);

            const response = await fetch(`/api/admin/properties?${params}`);
            const result = await response.json();
            if (result.success) {
                setProperties(result.data.properties);
                setTotalPages(result.data.totalPages);
                setTotalCount(result.data.total);
            } else {
                setError(result.error);
            }
        } catch {
            setError('Failed to load properties');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProperties();
    }, [page]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchProperties();
    };

    const getTypeBadge = (type: string) => {
        const colors: Record<string, string> = {
            RESIDENTIAL: 'bg-blue-500/20 text-blue-400',
            COMMERCIAL: 'bg-purple-500/20 text-purple-400',
            MIXED: 'bg-orange-500/20 text-orange-400',
        };
        return colors[type] || 'bg-gray-500/20 text-gray-400';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Building2 className="w-7 h-7" />
                        All Properties
                    </h1>
                    <p className="text-gray-400">View all properties across the platform ({totalCount} total)</p>
                </div>
            </div>

            {/* Search */}
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <form onSubmit={handleSearch} className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by property name, address, or landlord..."
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

            {/* Properties Table */}
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
                ) : properties.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Building2 className="w-12 h-12 text-gray-500 mb-2" />
                        <p className="text-gray-400">No properties found</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-700/50">
                            <tr>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Property</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Landlord</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Type</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Units</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Created</th>
                                <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {properties.map((property) => (
                                <tr key={property.id} className="hover:bg-gray-700/30">
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                                                <Home className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <div className="font-medium">{property.name}</div>
                                                <div className="text-sm text-gray-400 flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {property.address}, {property.city}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-gray-400" />
                                            <div>
                                                <div className="text-sm">{property.landlord.name || 'No name'}</div>
                                                <div className="text-xs text-gray-400">{property.landlord.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeBadge(property.type)}`}>
                                            {property.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="flex items-center gap-1 text-gray-300">
                                            <Home className="w-4 h-4" />
                                            {property._count.units}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-gray-400">
                                        {new Date(property.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center justify-end">
                                            <button
                                                className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Pagination */}
                {!loading && properties.length > 0 && (
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
