'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
    LayoutDashboard,
    FileText,
    CreditCard,
    Wrench,
    User,
    Bell,
    LogOut,
    Menu,
    X,
    ChevronDown,
    Home,
} from 'lucide-react';
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/ui/Dropdown';

const tenantNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/tenant' },
    { icon: FileText, label: 'My Lease', href: '/tenant/lease' },
    { icon: CreditCard, label: 'Payments', href: '/tenant/payments' },
    { icon: Wrench, label: 'Maintenance', href: '/tenant/maintenance' },
];

interface TenantLayoutProps {
    children: React.ReactNode;
    title?: string;
}

export function TenantLayout({ children, title }: TenantLayoutProps) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-background">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50
                w-64 bg-white border-r border-border
                transform transition-transform duration-200 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="h-16 flex items-center justify-between px-4 border-b border-border">
                        <Link href="/tenant" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                                <Home className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-lg">Nook</span>
                        </Link>
                        <button
                            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-1">
                        {tenantNavItems.map((item) => {
                            const isActive = pathname === item.href ||
                                (item.href !== '/tenant' && pathname.startsWith(item.href));
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                        ? 'bg-primary text-white'
                                        : 'text-text-secondary hover:bg-gray-100'
                                        }`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Info */}
                    <div className="p-4 border-t border-border">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center">
                                <User className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">
                                    {session?.user?.name || 'Tenant'}
                                </div>
                                <div className="text-xs text-text-muted truncate">
                                    {session?.user?.email}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-16 bg-white border-b border-border flex items-center justify-between px-4 lg:px-6">
                    <div className="flex items-center gap-4">
                        <button
                            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        {title && (
                            <h1 className="text-xl font-semibold">{title}</h1>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Notifications */}
                        <button className="p-2 hover:bg-gray-100 rounded-lg relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
                        </button>

                        {/* User Dropdown */}
                        <Dropdown
                            trigger={
                                <button className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg">
                                    <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center">
                                        <User className="w-4 h-4 text-primary" />
                                    </div>
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                            }
                        >
                            <DropdownItem icon={<User className="w-4 h-4" />}>
                                <Link href="/tenant/profile">Profile</Link>
                            </DropdownItem>
                            <DropdownDivider />
                            <DropdownItem
                                icon={<LogOut className="w-4 h-4" />}
                                danger
                                onClick={() => signOut({ callbackUrl: '/login' })}
                            >
                                Sign Out
                            </DropdownItem>
                        </Dropdown>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-auto p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
