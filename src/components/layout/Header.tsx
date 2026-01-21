'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import {
    Search,
    Bell,
    Plus,
    User,
    Building2,
    DoorOpen,
    Users,
    FileText,
    CreditCard,
    Wrench,
    Upload,
    LogOut,
    Settings,
    ChevronRight,
} from 'lucide-react';
import { Dropdown, DropdownItem, DropdownDivider } from '../ui/Dropdown';

interface HeaderProps {
    title: string;
    breadcrumbs?: { label: string; href?: string }[];
}

export function Header({ title, breadcrumbs }: HeaderProps) {
    const { data: session } = useSession();
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    React.useEffect(() => {
        if (session?.user) {
            fetchNotifications();
        }
    }, [session]);

    const fetchNotifications = async () => {
        try {
            const response = await fetch('/api/notifications?limit=5');
            const result = await response.json();
            if (result.success) {
                setNotifications(result.data.notifications);
                setUnreadCount(result.data.unreadCount);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    const handleSignOut = () => {
        signOut({ callbackUrl: '/login' });
    };

    const userName = session?.user?.name || 'User';
    const userEmail = session?.user?.email || '';
    const userInitial = userName.charAt(0).toUpperCase();

    return (
        <header className="header">
            {/* Left: Title & Breadcrumbs */}
            <div className="flex items-center gap-4" style={{ minWidth: '200px' }}>
                <div>
                    {breadcrumbs && breadcrumbs.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-text-muted mb-1">
                            {breadcrumbs.map((crumb, index) => (
                                <React.Fragment key={crumb.label}>
                                    {index > 0 && <ChevronRight className="w-3 h-3" />}
                                    {crumb.href ? (
                                        <Link href={crumb.href} className="hover:text-text-primary">
                                            {crumb.label}
                                        </Link>
                                    ) : (
                                        <span>{crumb.label}</span>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    )}
                    <h1 className="text-xl font-bold">{title}</h1>
                </div>
            </div>

            {/* Middle: Search */}
            <div className="search-container mx-8">
                <Search className="search-icon" />
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search tenants, units, leases, payments, tickets…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowSearchResults(true)}
                    onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                />

                {/* Search Results Dropdown */}
                {showSearchResults && searchQuery && (
                    <div className="dropdown-menu left-0 right-0 mt-2 p-2">
                        <div className="text-xs text-text-muted px-3 py-2 font-medium">
                            TENANTS
                        </div>
                        <DropdownItem icon={<Users className="w-4 h-4" />}>
                            John Smith - Unit A1
                        </DropdownItem>
                        <div className="text-xs text-text-muted px-3 py-2 font-medium mt-2">
                            UNITS
                        </div>
                        <DropdownItem icon={<DoorOpen className="w-4 h-4" />}>
                            Unit A1 - Sunset Flats
                        </DropdownItem>
                    </div>
                )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
                {/* Notifications */}
                <Dropdown
                    trigger={
                        <button className="btn btn-icon btn-tertiary relative">
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger text-white text-xs rounded-full flex items-center justify-center">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    }
                >
                    <div className="p-3 border-b border-border">
                        <div className="font-medium">Notifications</div>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-sm text-text-muted">
                                No notifications
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <DropdownItem key={notification.id}>
                                    <div className={notification.isRead ? 'opacity-60' : ''}>
                                        <div className="font-medium text-sm">{notification.title}</div>
                                        <div className="text-xs text-text-muted">{notification.message}</div>
                                        <div className="text-[10px] text-text-muted mt-1">
                                            {new Date(notification.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </DropdownItem>
                            ))
                        )}
                    </div>
                    <div className="p-2 border-t border-border">
                        <Link href="/notifications" className="text-sm text-primary text-center block">
                            View all notifications
                        </Link>
                    </div>
                </Dropdown>

                {/* + New Dropdown */}
                <Dropdown
                    trigger={
                        <button className="btn btn-primary">
                            <Plus className="w-4 h-4" />
                            New
                        </button>
                    }
                >
                    <DropdownItem icon={<Building2 className="w-4 h-4" />}>
                        <Link href="/properties?action=new" className="block w-full">New Property</Link>
                    </DropdownItem>
                    <DropdownItem icon={<DoorOpen className="w-4 h-4" />}>
                        <Link href="/units?action=new" className="block w-full">New Unit</Link>
                    </DropdownItem>
                    <DropdownItem icon={<Users className="w-4 h-4" />}>
                        <Link href="/tenants?action=new" className="block w-full">Add Tenant</Link>
                    </DropdownItem>
                    <DropdownItem icon={<FileText className="w-4 h-4" />}>
                        <Link href="/leases?action=new" className="block w-full">Create Lease</Link>
                    </DropdownItem>
                    <DropdownDivider />
                    <DropdownItem icon={<CreditCard className="w-4 h-4" />}>
                        <Link href="/payments?action=new" className="block w-full">Log Payment</Link>
                    </DropdownItem>
                    <DropdownItem icon={<Wrench className="w-4 h-4" />}>
                        <Link href="/maintenance?action=new" className="block w-full">Maintenance Ticket</Link>
                    </DropdownItem>
                    <DropdownItem icon={<Upload className="w-4 h-4" />}>
                        <Link href="/documents?action=upload" className="block w-full">Upload Document</Link>
                    </DropdownItem>
                </Dropdown>

                {/* Profile Dropdown */}
                <Dropdown
                    trigger={
                        <button className="btn btn-icon btn-tertiary">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                                <span className="text-white font-medium text-sm">{userInitial}</span>
                            </div>
                        </button>
                    }
                >
                    <div className="p-3 border-b border-border">
                        <div className="font-medium">{userName}</div>
                        <div className="text-sm text-text-muted">{userEmail}</div>
                    </div>
                    <DropdownItem icon={<User className="w-4 h-4" />}>
                        <Link href="/settings" className="block w-full">Profile</Link>
                    </DropdownItem>
                    <DropdownItem icon={<Settings className="w-4 h-4" />}>
                        <Link href="/settings" className="block w-full">Settings</Link>
                    </DropdownItem>
                    <DropdownDivider />
                    <DropdownItem icon={<LogOut className="w-4 h-4" />} danger onClick={handleSignOut}>
                        Sign out
                    </DropdownItem>
                </Dropdown>
            </div>
        </header>
    );
}
