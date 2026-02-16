'use client';

import React, { useState } from 'react';
import {
    X,
    Check,
    Zap,
    Building2,
    TrendingUp,
    Crown,
    MessageSquare,
    CreditCard,
    Wrench,
    Users,
    Code,
    Mail,
    Phone,
    MapPin,
} from 'lucide-react';

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const plans = [
    {
        name: 'Starter',
        price: 'R599',
        period: '/month',
        target: '1–10 units',
        color: 'from-green-500 to-green-600',
        borderColor: 'border-green-500',
        bgColor: 'bg-green-500/10',
        icon: Building2,
        features: [
            'Property & tenant management',
            'Rent tracking',
            'Basic reports',
            'Maintenance requests',
            'Tenant portal',
        ],
        limits: ['Max 10 units', 'No automation', 'No advanced finance'],
    },
    {
        name: 'Growth',
        price: 'R1,199',
        period: '/month',
        target: '10–50 units',
        color: 'from-yellow-500 to-yellow-600',
        borderColor: 'border-yellow-500',
        bgColor: 'bg-yellow-500/10',
        icon: TrendingUp,
        popular: true,
        features: [
            'Everything in Starter',
            'Payment tracking + reconciliation',
            'Automated rent reminders',
            'Expense tracking',
            'Reports & analytics',
            'Multi-property dashboard',
        ],
        limits: ['Max 50 units'],
    },
    {
        name: 'Pro',
        price: 'R2,999',
        period: '/month',
        target: '50–200 units',
        color: 'from-red-500 to-red-600',
        borderColor: 'border-red-500',
        bgColor: 'bg-red-500/10',
        icon: Zap,
        features: [
            'Everything in Growth',
            'Full finance dashboard',
            'Role-based access (admin, finance, staff)',
            'Advanced reporting',
            'API access',
            'Priority support',
        ],
        limits: ['Max 200 units'],
    },
    {
        name: 'Enterprise',
        price: 'R7,999+',
        period: '/month',
        target: 'Large property companies',
        color: 'from-gray-700 to-gray-900',
        borderColor: 'border-gray-500',
        bgColor: 'bg-gray-500/10',
        icon: Crown,
        features: [
            'Unlimited units',
            'Custom integrations',
            'Dedicated support',
            'Custom dashboards',
            'SLA + uptime guarantees',
        ],
        limits: [],
        custom: true,
    },
];

const addons = [
    { name: 'SMS notifications', price: 'R0.20 per SMS', icon: MessageSquare },
    { name: 'Payment processing', price: '1–3% per transaction', icon: CreditCard },
    { name: 'Setup/onboarding', price: 'R2,000 – R10,000', icon: Wrench },
    { name: 'Custom features', price: 'R500/hour', icon: Code },
];

export function PricingModal({ isOpen, onClose }: PricingModalProps) {
    const [activeTab, setActiveTab] = useState<'pricing' | 'about'>('pricing');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                            <span className="text-white font-bold">N</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Nook Plans</h2>
                            <p className="text-sm text-gray-500">Choose the right plan for your business</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setActiveTab('pricing')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    activeTab === 'pricing'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Pricing
                            </button>
                            <button
                                onClick={() => setActiveTab('about')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    activeTab === 'about'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                About Nook
                            </button>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {activeTab === 'pricing' ? (
                        <>
                            {/* Plans Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                {plans.map((plan) => {
                                    const Icon = plan.icon;
                                    return (
                                        <div
                                            key={plan.name}
                                            className={`relative rounded-xl border-2 ${plan.borderColor} p-5 ${plan.bgColor}`}
                                        >
                                            {plan.popular && (
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full">
                                                    POPULAR
                                                </div>
                                            )}
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                                                <Icon className="w-6 h-6 text-white" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                                            <p className="text-sm text-gray-500 mb-3">{plan.target}</p>
                                            <div className="mb-4">
                                                <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                                                <span className="text-gray-500">{plan.period}</span>
                                            </div>
                                            <ul className="space-y-2 mb-4">
                                                {plan.features.map((feature) => (
                                                    <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                                                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                                        <span>{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            {plan.limits.length > 0 && (
                                                <div className="pt-3 border-t border-gray-200">
                                                    <p className="text-xs text-gray-500 mb-1">Limits:</p>
                                                    {plan.limits.map((limit) => (
                                                        <p key={limit} className="text-xs text-gray-400">{limit}</p>
                                                    ))}
                                                </div>
                                            )}
                                            <button
                                                className={`w-full mt-4 py-2 rounded-lg font-medium transition-colors ${
                                                    plan.popular
                                                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700'
                                                        : plan.custom
                                                        ? 'bg-gray-900 text-white hover:bg-gray-800'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                            >
                                                {plan.custom ? 'Contact Sales' : 'Get Started'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Add-ons */}
                            <div className="bg-gray-50 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-yellow-500" />
                                    Add-ons
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {addons.map((addon) => {
                                        const Icon = addon.icon;
                                        return (
                                            <div key={addon.name} className="bg-white rounded-lg p-4 border border-gray-200">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Icon className="w-5 h-5 text-primary" />
                                                    <span className="font-medium text-gray-900">{addon.name}</span>
                                                </div>
                                                <p className="text-sm text-primary font-semibold">{addon.price}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    ) : (
                        /* About Tab */
                        <div className="max-w-3xl mx-auto">
                            <div className="text-center mb-8">
                                <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
                                    <span className="text-white font-bold text-3xl">N</span>
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">Nook</h2>
                                <p className="text-lg text-gray-600">
                                    Modern Property Management for South African Landlords
                                </p>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-6 mb-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">About Us</h3>
                                <p className="text-gray-600 mb-4">
                                    Nook is a comprehensive property management platform designed specifically for the South African rental market.
                                    We help landlords and property managers streamline their operations, from tenant management to rent collection,
                                    maintenance tracking, and financial reporting.
                                </p>
                                <p className="text-gray-600">
                                    Our mission is to make property management simple, efficient, and profitable for everyone from
                                    individual landlords to large property companies.
                                </p>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-6 mb-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-primary" />
                                    Development Team
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center mb-3">
                                            <span className="text-white font-bold">BB</span>
                                        </div>
                                        <h4 className="font-semibold text-gray-900">Bathini Bona</h4>
                                        <p className="text-sm text-gray-500">Lead Developer & Founder</p>
                                    </div>
                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-3">
                                            <span className="text-white font-bold">NT</span>
                                        </div>
                                        <h4 className="font-semibold text-gray-900">Nook Team</h4>
                                        <p className="text-sm text-gray-500">Development & Support</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Us</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <Mail className="w-5 h-5 text-primary" />
                                        <span>support@nookpms.com</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <Phone className="w-5 h-5 text-primary" />
                                        <span>+27 (0) 12 345 6789</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <MapPin className="w-5 h-5 text-primary" />
                                        <span>Johannesburg, South Africa</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
