'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Building2,
    DoorOpen,
    Users,
    FileText,
    Receipt,
    CreditCard,
    Wrench,
    FolderOpen,
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
    { icon: Receipt, label: 'Rent Ledger', href: '/rent-ledger' },
    { icon: CreditCard, label: 'Payments', href: '/payments' },
    { icon: Wrench, label: 'Maintenance', href: '/maintenance' },
    { icon: FolderOpen, label: 'Documents', href: '/documents' },
    { icon: BarChart3, label: 'Reports', href: '/reports' },
    { icon: Settings, label: 'Settings', href: '/settings' },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-header">
                <Link href="/dashboard" className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">R</span>
                    </div>
                    <div>
                        <div className="font-bold text-lg">RentPilot</div>
                        <div className="text-xs text-text-muted">My Properties</div>
                    </div>
                </Link>
                <div className="mt-2">
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">Free Plan</span>
                </div>
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
                    <div className="text-2xl font-bold">0<span className="text-sm text-text-muted font-normal">/20</span></div>
                    <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                        <div className="h-full bg-primary rounded-full" style={{ width: '0%' }}></div>
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
