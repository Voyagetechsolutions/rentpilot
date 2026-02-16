'use client';

import React, { useEffect, useState } from 'react';
import {
    CreditCard,
    Search,
    Loader2,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Users,
    Building2,
    TrendingUp,
    Crown,
    Zap,
    Check,
    X,
    ArrowUp,
    ArrowDown,
    AlertTriangle,
    DollarSign,
    Eye,
    Edit,
    History,
} from 'lucide-react';

interface Subscription {
    id: string | null;
    plan: string;
    status: string;
    monthlyPrice: number;
    startDate: string;
    maxUnits: number;
    maxProperties: number;
    hasAutomation?: boolean;
    hasAdvancedFinance?: boolean;
    hasApiAccess?: boolean;
    hasPrioritySupport?: boolean;
}

interface LandlordData {
    id: string;
    name: string;
    email: string;
    createdAt: string;
    subscription: Subscription;
    usage: {
        properties: number;
        units: number;
        maxProperties: number;
        maxUnits: number;
        propertiesPercent: number;
        unitsPercent: number;
    };
    features: {
        hasAutomation: boolean;
        hasAdvancedFinance: boolean;
        hasApiAccess: boolean;
        hasPrioritySupport: boolean;
    };
    isOverLimit: boolean;
}

interface Summary {
    total: number;
    byPlan: {
        STARTER: number;
        GROWTH: number;
        PRO: number;
        ENTERPRISE: number;
    };
    overLimit: number;
    monthlyRevenue: number;
}

interface SubscriptionDetail {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    createdAt: string;
    subscription: Subscription & {
        history: Array<{
            id: string;
            action: string;
            previousPlan: string | null;
            newPlan: string;
            previousPrice: number | null;
            newPrice: number;
            changedByName: string | null;
            reason: string | null;
            createdAt: string;
        }>;
    };
    usage: {
        properties: number;
        units: number;
        occupiedUnits: number;
        maxProperties: number;
        maxUnits: number;
        monthlyRent: number;
    };
    propertyDetails: Array<{
        id: string;
        name: string;
        address: string;
        units: number;
        occupiedUnits: number;
    }>;
}

const PLAN_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    STARTER: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500' },
    GROWTH: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500' },
    PRO: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500' },
    ENTERPRISE: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500' },
};

const PLAN_ICONS: Record<string, React.ElementType> = {
    STARTER: Building2,
    GROWTH: TrendingUp,
    PRO: Zap,
    ENTERPRISE: Crown,
};

const PLAN_PRICES: Record<string, number> = {
    STARTER: 599,
    GROWTH: 1199,
    PRO: 2999,
    ENTERPRISE: 7999,
};

export default function AdminSubscriptionsPage() {
    const [landlords, setLandlords] = useState<LandlordData[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [planFilter, setPlanFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal states
    const [selectedLandlord, setSelectedLandlord] = useState<SubscriptionDetail | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [upgradeLandlord, setUpgradeLandlord] = useState<LandlordData | null>(null);
    const [selectedPlan, setSelectedPlan] = useState('');
    const [upgradeReason, setUpgradeReason] = useState('');
    const [upgradeNotes, setUpgradeNotes] = useState('');
    const [processing, setProcessing] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const fetchLandlords = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '15',
            });
            if (search) params.append('search', search);
            if (planFilter) params.append('plan', planFilter);

            const response = await fetch(`/api/admin/subscriptions?${params}`);
            const result = await response.json();
            if (result.success) {
                setLandlords(result.data.landlords);
                setSummary(result.data.summary);
                setTotalPages(result.data.pagination.totalPages);
            } else {
                setError(result.error);
            }
        } catch {
            setError('Failed to load subscriptions');
        } finally {
            setLoading(false);
        }
    };

    const fetchLandlordDetail = async (id: string) => {
        try {
            setLoadingDetail(true);
            const response = await fetch(`/api/admin/subscriptions/${id}`);
            const result = await response.json();
            if (result.success) {
                setSelectedLandlord(result.data);
                setShowDetailModal(true);
            }
        } catch {
            setError('Failed to load landlord details');
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleUpgrade = async () => {
        if (!upgradeLandlord || !selectedPlan) return;

        try {
            setProcessing(true);
            const response = await fetch(`/api/admin/subscriptions/${upgradeLandlord.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan: selectedPlan,
                    reason: upgradeReason,
                    notes: upgradeNotes,
                }),
            });

            const result = await response.json();
            if (result.success) {
                setShowUpgradeModal(false);
                setUpgradeLandlord(null);
                setSelectedPlan('');
                setUpgradeReason('');
                setUpgradeNotes('');
                fetchLandlords();
            } else {
                setError(result.error);
            }
        } catch {
            setError('Failed to update subscription');
        } finally {
            setProcessing(false);
        }
    };

    useEffect(() => {
        fetchLandlords();
    }, [page, planFilter]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchLandlords();
    };

    const openUpgradeModal = (landlord: LandlordData) => {
        setUpgradeLandlord(landlord);
        setSelectedPlan(landlord.subscription.plan);
        setShowUpgradeModal(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <CreditCard className="w-7 h-7" />
                        Subscription Management
                    </h1>
                    <p className="text-gray-400">Manage landlord plans and billing</p>
                </div>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                        <div className="text-sm text-gray-400">Total Landlords</div>
                        <div className="text-2xl font-bold">{summary.total}</div>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                        <div className="text-sm text-gray-400">Monthly Revenue</div>
                        <div className="text-2xl font-bold text-green-400">
                            R{summary.monthlyRevenue.toLocaleString()}
                        </div>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                        <div className="text-sm text-gray-400">Over Limit</div>
                        <div className={`text-2xl font-bold ${summary.overLimit > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                            {summary.overLimit}
                        </div>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                        <div className="text-sm text-gray-400">Plan Distribution</div>
                        <div className="flex gap-2 mt-1">
                            {Object.entries(summary.byPlan).map(([plan, count]) => (
                                <span
                                    key={plan}
                                    className={`px-2 py-0.5 text-xs rounded-full ${PLAN_COLORS[plan].bg} ${PLAN_COLORS[plan].text}`}
                                >
                                    {count}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                        <div className="text-sm text-gray-400">Avg Revenue/User</div>
                        <div className="text-2xl font-bold">
                            R{summary.total > 0 ? Math.round(summary.monthlyRevenue / summary.total).toLocaleString() : 0}
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <form onSubmit={handleSearch} className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search landlords by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <select
                        value={planFilter}
                        onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
                        className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="">All Plans</option>
                        <option value="STARTER">Starter</option>
                        <option value="GROWTH">Growth</option>
                        <option value="PRO">Pro</option>
                        <option value="ENTERPRISE">Enterprise</option>
                    </select>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
                    >
                        Search
                    </button>
                </form>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400">{error}</span>
                    <button onClick={() => setError('')} className="ml-auto">
                        <X className="w-4 h-4 text-red-400" />
                    </button>
                </div>
            )}

            {/* Landlords Table */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                    </div>
                ) : landlords.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Users className="w-12 h-12 text-gray-500 mb-2" />
                        <p className="text-gray-400">No landlords found</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-700/50">
                            <tr>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Landlord</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Plan</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Usage</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Price</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Features</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {landlords.map((landlord) => {
                                const PlanIcon = PLAN_ICONS[landlord.subscription.plan] || Building2;
                                const colors = PLAN_COLORS[landlord.subscription.plan] || PLAN_COLORS.STARTER;
                                return (
                                    <tr key={landlord.id} className="hover:bg-gray-700/30">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                                                    <span className="text-white font-bold">
                                                        {landlord.name?.charAt(0) || 'L'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="font-medium">{landlord.name}</div>
                                                    <div className="text-sm text-gray-400">{landlord.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${colors.bg} ${colors.text}`}>
                                                <PlanIcon className="w-4 h-4" />
                                                {landlord.subscription.plan}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Building2 className="w-4 h-4 text-gray-400" />
                                                    <span className={landlord.usage.properties > landlord.usage.maxProperties ? 'text-red-400' : ''}>
                                                        {landlord.usage.properties}/{landlord.usage.maxProperties} properties
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Users className="w-4 h-4 text-gray-400" />
                                                    <span className={landlord.usage.units > landlord.usage.maxUnits ? 'text-red-400' : ''}>
                                                        {landlord.usage.units}/{landlord.usage.maxUnits} units
                                                    </span>
                                                </div>
                                                {landlord.isOverLimit && (
                                                    <span className="inline-flex items-center gap-1 text-xs text-red-400">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        Over limit
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-1 text-lg font-bold text-green-400">
                                                <DollarSign className="w-4 h-4" />
                                                R{(landlord.subscription.monthlyPrice || 0).toLocaleString()}
                                            </div>
                                            <div className="text-xs text-gray-400">/month</div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex gap-1">
                                                {landlord.features.hasAutomation && (
                                                    <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded">Auto</span>
                                                )}
                                                {landlord.features.hasAdvancedFinance && (
                                                    <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded">Finance</span>
                                                )}
                                                {landlord.features.hasApiAccess && (
                                                    <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded">API</span>
                                                )}
                                                {!landlord.features.hasAutomation && !landlord.features.hasAdvancedFinance && (
                                                    <span className="text-xs text-gray-500">Basic</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => fetchLandlordDetail(landlord.id)}
                                                    disabled={loadingDetail}
                                                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => openUpgradeModal(landlord)}
                                                    className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                                                    title="Change Plan"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}

                {/* Pagination */}
                {!loading && landlords.length > 0 && (
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

            {/* Detail Modal */}
            {showDetailModal && selectedLandlord && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
                        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold">Subscription Details</h2>
                            <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-700 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Landlord Info */}
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center">
                                    <span className="text-white font-bold text-2xl">
                                        {selectedLandlord.name?.charAt(0) || 'L'}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">{selectedLandlord.name}</h3>
                                    <p className="text-gray-400">{selectedLandlord.email}</p>
                                    {selectedLandlord.phone && <p className="text-gray-400">{selectedLandlord.phone}</p>}
                                </div>
                            </div>

                            {/* Plan & Usage */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-700/50 rounded-lg p-4">
                                    <div className="text-sm text-gray-400 mb-2">Current Plan</div>
                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${PLAN_COLORS[selectedLandlord.subscription.plan]?.bg} ${PLAN_COLORS[selectedLandlord.subscription.plan]?.text}`}>
                                        {React.createElement(PLAN_ICONS[selectedLandlord.subscription.plan] || Building2, { className: 'w-5 h-5' })}
                                        <span className="font-medium">{selectedLandlord.subscription.plan}</span>
                                    </div>
                                    <div className="text-2xl font-bold mt-2">
                                        R{(selectedLandlord.subscription.monthlyPrice || 0).toLocaleString()}/mo
                                    </div>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg p-4">
                                    <div className="text-sm text-gray-400 mb-2">Usage</div>
                                    <div className="space-y-2">
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>Properties</span>
                                                <span>{selectedLandlord.usage.properties}/{selectedLandlord.usage.maxProperties}</span>
                                            </div>
                                            <div className="w-full h-2 bg-gray-600 rounded-full">
                                                <div
                                                    className={`h-full rounded-full ${
                                                        selectedLandlord.usage.properties > selectedLandlord.usage.maxProperties ? 'bg-red-500' : 'bg-blue-500'
                                                    }`}
                                                    style={{ width: `${Math.min(100, (selectedLandlord.usage.properties / selectedLandlord.usage.maxProperties) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>Units</span>
                                                <span>{selectedLandlord.usage.units}/{selectedLandlord.usage.maxUnits}</span>
                                            </div>
                                            <div className="w-full h-2 bg-gray-600 rounded-full">
                                                <div
                                                    className={`h-full rounded-full ${
                                                        selectedLandlord.usage.units > selectedLandlord.usage.maxUnits ? 'bg-red-500' : 'bg-green-500'
                                                    }`}
                                                    style={{ width: `${Math.min(100, (selectedLandlord.usage.units / selectedLandlord.usage.maxUnits) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Properties */}
                            {selectedLandlord.propertyDetails.length > 0 && (
                                <div>
                                    <h4 className="font-semibold mb-3">Properties ({selectedLandlord.propertyDetails.length})</h4>
                                    <div className="space-y-2">
                                        {selectedLandlord.propertyDetails.map(prop => (
                                            <div key={prop.id} className="bg-gray-700/50 rounded-lg p-3 flex justify-between items-center">
                                                <div>
                                                    <div className="font-medium">{prop.name}</div>
                                                    <div className="text-sm text-gray-400">{prop.address}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm">{prop.units} units</div>
                                                    <div className="text-xs text-gray-400">{prop.occupiedUnits} occupied</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* History */}
                            {selectedLandlord.subscription.history && selectedLandlord.subscription.history.length > 0 && (
                                <div>
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <History className="w-4 h-4" />
                                        Subscription History
                                    </h4>
                                    <div className="space-y-2">
                                        {selectedLandlord.subscription.history.map(h => (
                                            <div key={h.id} className="bg-gray-700/50 rounded-lg p-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <span className={`inline-flex items-center gap-1 text-sm font-medium ${
                                                            h.action === 'UPGRADED' ? 'text-green-400' :
                                                            h.action === 'DOWNGRADED' ? 'text-yellow-400' :
                                                            h.action === 'CANCELLED' ? 'text-red-400' :
                                                            'text-blue-400'
                                                        }`}>
                                                            {h.action === 'UPGRADED' && <ArrowUp className="w-4 h-4" />}
                                                            {h.action === 'DOWNGRADED' && <ArrowDown className="w-4 h-4" />}
                                                            {h.action}
                                                        </span>
                                                        {h.previousPlan && (
                                                            <span className="text-sm text-gray-400 ml-2">
                                                                {h.previousPlan} → {h.newPlan}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(h.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                {h.reason && (
                                                    <p className="text-sm text-gray-400 mt-1">{h.reason}</p>
                                                )}
                                                {h.changedByName && (
                                                    <p className="text-xs text-gray-500 mt-1">by {h.changedByName}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Upgrade/Downgrade Modal */}
            {showUpgradeModal && upgradeLandlord && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-xl max-w-2xl w-full border border-gray-700">
                        <div className="border-b border-gray-700 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold">Change Subscription Plan</h2>
                            <button onClick={() => setShowUpgradeModal(false)} className="p-2 hover:bg-gray-700 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Landlord Info */}
                            <div className="bg-gray-700/50 rounded-lg p-4">
                                <div className="font-medium">{upgradeLandlord.name}</div>
                                <div className="text-sm text-gray-400">{upgradeLandlord.email}</div>
                                <div className="text-sm text-gray-400 mt-1">
                                    Current: {upgradeLandlord.usage.properties} properties, {upgradeLandlord.usage.units} units
                                </div>
                            </div>

                            {/* Plan Selection */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-3">Select Plan</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {(['STARTER', 'GROWTH', 'PRO', 'ENTERPRISE'] as const).map(plan => {
                                        const PlanIcon = PLAN_ICONS[plan];
                                        const colors = PLAN_COLORS[plan];
                                        const isCurrentPlan = upgradeLandlord.subscription.plan === plan;
                                        const isSelected = selectedPlan === plan;
                                        const wouldExceedLimits = plan !== 'ENTERPRISE' && (
                                            upgradeLandlord.usage.properties > (plan === 'STARTER' ? 5 : plan === 'GROWTH' ? 20 : 100) ||
                                            upgradeLandlord.usage.units > (plan === 'STARTER' ? 10 : plan === 'GROWTH' ? 50 : 200)
                                        );

                                        return (
                                            <button
                                                key={plan}
                                                onClick={() => setSelectedPlan(plan)}
                                                disabled={wouldExceedLimits && plan !== upgradeLandlord.subscription.plan}
                                                className={`p-4 rounded-lg border-2 text-left transition-all ${
                                                    isSelected ? `${colors.border} ${colors.bg}` : 'border-gray-600 hover:border-gray-500'
                                                } ${wouldExceedLimits && plan !== upgradeLandlord.subscription.plan ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <PlanIcon className={`w-5 h-5 ${colors.text}`} />
                                                    <span className="font-medium">{plan}</span>
                                                    {isCurrentPlan && (
                                                        <span className="text-xs bg-gray-600 px-2 py-0.5 rounded">Current</span>
                                                    )}
                                                </div>
                                                <div className="text-xl font-bold">R{PLAN_PRICES[plan].toLocaleString()}</div>
                                                <div className="text-xs text-gray-400">/month</div>
                                                {wouldExceedLimits && plan !== upgradeLandlord.subscription.plan && (
                                                    <div className="text-xs text-red-400 mt-2 flex items-center gap-1">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        Exceeds limits
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Reason */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Reason for Change</label>
                                <input
                                    type="text"
                                    value={upgradeReason}
                                    onChange={(e) => setUpgradeReason(e.target.value)}
                                    placeholder="e.g., Customer requested upgrade, Payment issue, etc."
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Admin Notes (optional)</label>
                                <textarea
                                    value={upgradeNotes}
                                    onChange={(e) => setUpgradeNotes(e.target.value)}
                                    placeholder="Any additional notes about this change..."
                                    rows={3}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white resize-none"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                                <button
                                    onClick={() => setShowUpgradeModal(false)}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpgrade}
                                    disabled={processing || selectedPlan === upgradeLandlord.subscription.plan}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : selectedPlan === upgradeLandlord.subscription.plan ? (
                                        'No Change'
                                    ) : ['STARTER', 'GROWTH', 'PRO', 'ENTERPRISE'].indexOf(selectedPlan) >
                                      ['STARTER', 'GROWTH', 'PRO', 'ENTERPRISE'].indexOf(upgradeLandlord.subscription.plan) ? (
                                        <>
                                            <ArrowUp className="w-4 h-4" />
                                            Upgrade to {selectedPlan}
                                        </>
                                    ) : (
                                        <>
                                            <ArrowDown className="w-4 h-4" />
                                            Downgrade to {selectedPlan}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
