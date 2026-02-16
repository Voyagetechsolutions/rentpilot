'use client';

import React, { useState, useEffect } from 'react';
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
    HelpCircle,
    ArrowUpCircle,
} from 'lucide-react';

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
    const [unitCount, setUnitCount] = useState({ total: 0, occupied: 0 });

    useEffect(() => {
        fetch('/api/units')
            .then(res => res.json())
            .then(result => {
                if (result.success && Array.isArray(result.data)) {
                    const total = result.data.length;
                    const occupied = result.data.filter((u: { status: string }) => u.status === 'OCCUPIED').length;
                    setUnitCount({ total, occupied });
                }
            })
            .catch(() => { /* silent fail */ });
    }, []);

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-header">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <span className="text-white font-bold text-sm">R</span>
                    </div>
                    <span className="text-lg font-bold">RentPilot</span>
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
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium mb-1">Units Used</div>
                    <div className="text-2xl font-bold">{unitCount.occupied}<span className="text-sm text-text-muted font-normal">/{unitCount.total}</span></div>
                    <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                        <div className="h-full bg-primary rounded-full" style={{ width: unitCount.total > 0 ? `${(unitCount.occupied / unitCount.total) * 100}%` : '0%' }}></div>
                    </div>
                </div>
                <Link href="/settings/billing" className="btn btn-secondary w-full justify-center mb-3">
                    <ArrowUpCircle className="w-4 h-4" />
                    Upgrade Plan
                </Link>
                <Link href="/help" className="nav-item text-text-muted">
                    <HelpCircle className="nav-icon" />
                    <span>Help & Support</span>
                </Link>
            </div>
        </aside>
    );
}
