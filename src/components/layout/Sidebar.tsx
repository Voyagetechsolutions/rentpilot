'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Building2,
    DoorOpen,
    Users,
    FileText,
    CreditCard,
    Wrench,
    FolderOpen,
    ClipboardCheck,
    Wallet,
    Zap,
    BarChart3,
    Settings,
    ArrowUpCircle,
} from 'lucide-react';
import { PricingModal } from '@/components/ui/PricingModal';

const mainNavItems = [
    { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
    { icon: Building2, label: 'Properties', href: '/properties' },
    { icon: DoorOpen, label: 'Units', href: '/units' },
    { icon: Users, label: 'Tenants', href: '/tenants' },
    { icon: FileText, label: 'Leases', href: '/leases' },

    { icon: CreditCard, label: 'Payments', href: '/payments' },
    { icon: Wallet, label: 'Deposits', href: '/deposits' },
    { icon: Wrench, label: 'Maintenance', href: '/maintenance' },
    { icon: ClipboardCheck, label: 'Inspections', href: '/inspections' },
    { icon: Zap, label: 'Utilities', href: '/utilities' },
    { icon: FolderOpen, label: 'Documents', href: '/documents' },
    { icon: BarChart3, label: 'Reports', href: '/reports' },
    { icon: Settings, label: 'Settings', href: '/settings' },
];

export function Sidebar() {
    const pathname = usePathname();
    const [showPricing, setShowPricing] = useState(false);

    return (
        <>
            <aside className="sidebar">
                {/* Logo */}
                <div className="sidebar-header">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <span className="text-white font-bold text-sm">N</span>
                        </div>
                        <span className="text-lg font-bold">Nook</span>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    <ul className="space-y-1">
                        {mainNavItems.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                            const Icon = item.icon;
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={`nav-item ${isActive ? 'active' : ''}`}
                                    >
                                        <Icon className="nav-icon" />
                                        <span>{item.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Footer */}
                <div className="sidebar-footer">
                    <button
                        onClick={() => setShowPricing(true)}
                        className="btn btn-primary w-full justify-center"
                    >
                        <ArrowUpCircle className="w-4 h-4" />
                        Upgrade Plan
                    </button>
                </div>
            </aside>

            {/* Pricing Modal */}
            <PricingModal isOpen={showPricing} onClose={() => setShowPricing(false)} />
        </>
    );
}
