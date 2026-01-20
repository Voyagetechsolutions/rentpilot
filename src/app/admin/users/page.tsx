'use client';

import React, { useEffect, useState } from 'react';
import {
    Users,
    Search,
    MoreVertical,
    Edit2,
    Trash2,
    Shield,
    Loader2,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

interface User {
    id: string;
    email: string;
    name: string | null;
    role: string;
    phone: string | null;
    createdAt: string;
    _count: {
        properties: number;
    };
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10',
            });
            if (search) params.append('search', search);
            if (roleFilter) params.append('role', roleFilter);

            const response = await fetch(`/api/admin/users?${params}`);
            const result = await response.json();
            if (result.success) {
                setUsers(result.data.users);
                setTotalPages(result.data.totalPages);
            } else {
                setError(result.error);
            }
        } catch {
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page, roleFilter]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchUsers();
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole }),
            });
            const result = await response.json();
            if (result.success) {
                setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
                setEditingUser(null);
            } else {
                alert(result.error);
            }
        } catch {
            alert('Failed to update user');
        }
    };

    const handleDeleteUser = async (userId: string) => {
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
            });
            const result = await response.json();
            if (result.success) {
                setUsers(users.filter(u => u.id !== userId));
                setShowDeleteConfirm(null);
            } else {
                alert(result.error);
            }
        } catch {
            alert('Failed to delete user');
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'LANDLORD': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'TENANT': return 'bg-green-500/20 text-green-400 border-green-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Users className="w-7 h-7" />
                        User Management
                    </h1>
                    <p className="text-gray-400">Manage platform users and their roles</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <form onSubmit={handleSearch} className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by email or name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                        className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="">All Roles</option>
                        <option value="ADMIN">Admin</option>
                        <option value="LANDLORD">Landlord</option>
                        <option value="TENANT">Tenant</option>
                    </select>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
                    >
                        Search
                    </button>
                </form>
            </div>

            {/* Users Table */}
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
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-700/50">
                            <tr>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">User</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Role</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Properties</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Joined</th>
                                <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-700/30">
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                                                <span className="font-medium">
                                                    {user.name?.[0] || user.email[0].toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="font-medium">{user.name || 'No name'}</div>
                                                <div className="text-sm text-gray-400">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadgeColor(user.role)}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-gray-300">
                                        {user._count.properties}
                                    </td>
                                    <td className="px-4 py-4 text-gray-400">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setEditingUser(user)}
                                                className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setShowDeleteConfirm(user.id)}
                                                className="p-2 hover:bg-red-600/20 text-red-400 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Pagination */}
                {!loading && users.length > 0 && (
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

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Edit User Role
                        </h3>
                        <div className="mb-4">
                            <div className="text-gray-400 text-sm mb-1">Email</div>
                            <div className="font-medium">{editingUser.email}</div>
                        </div>
                        <div className="mb-6">
                            <label className="text-gray-400 text-sm mb-2 block">Role</label>
                            <select
                                value={editingUser.role}
                                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            >
                                <option value="ADMIN">Admin</option>
                                <option value="LANDLORD">Landlord</option>
                                <option value="TENANT">Tenant</option>
                            </select>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleRoleChange(editingUser.id, editingUser.role)}
                                className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
                            >
                                Save Changes
                            </button>
                            <button
                                onClick={() => setEditingUser(null)}
                                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
                        <h3 className="text-xl font-bold mb-4 text-red-400">Delete User</h3>
                        <p className="text-gray-300 mb-6">
                            Are you sure you want to delete this user? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleDeleteUser(showDeleteConfirm)}
                                className="flex-1 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
                            >
                                Delete
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
