'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
    LayoutDashboard,
    Users,
    CreditCard,
    Building2,
    FileText,
    Activity,
    Settings,
    LogOut,
    Shield,
    ChevronRight,
    Crown,
} from 'lucide-react';

interface AdminLayoutProps {
    children: ReactNode;
}

const adminNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
    { icon: Users, label: 'Users', href: '/admin/users' },
    { icon: Building2, label: 'Properties', href: '/admin/properties' },
    { icon: CreditCard, label: 'Payments', href: '/admin/payments' },
    { icon: Crown, label: 'Subscriptions', href: '/admin/subscriptions' },
    { icon: FileText, label: 'Leases', href: '/admin/leases' },
    { icon: Activity, label: 'Activity Logs', href: '/admin/logs' },
    { icon: Settings, label: 'Settings', href: '/admin/settings' },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
    const pathname = usePathname();
    const { data: session } = useSession();

    return (
        <div className="min-h-screen bg-gray-900 text-white flex">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
                {/* Logo */}
                <div className="p-4 border-b border-gray-700">
                    <Link href="/admin" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <div className="font-bold text-lg">Nook</div>
                            <div className="text-xs text-gray-400">Admin Panel</div>
                        </div>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4">
                    <ul className="space-y-1">
                        {adminNavItems.map((item) => {
                            const isActive = pathname === item.href ||
                                (item.href !== '/admin' && pathname.startsWith(item.href));
                            const Icon = item.icon;
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive
                                            ? 'bg-purple-600 text-white'
                                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span>{item.label}</span>
                                        {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* User Info */}
                <div className="p-4 border-t border-gray-700">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                            <span className="font-bold">
                                {session?.user?.name?.[0] || 'A'}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                                {session?.user?.name || 'Admin'}
                            </div>
                            <div className="text-xs text-gray-400 truncate">
                                {session?.user?.email}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors w-full px-3 py-2 rounded-lg hover:bg-gray-700"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
