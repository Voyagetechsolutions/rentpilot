'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppShellProps {
    title: string;
    breadcrumbs?: { label: string; href?: string }[];
    children: React.ReactNode;
}

export function AppShell({ title, breadcrumbs, children }: AppShellProps) {
    return (
        <div className="app-shell">
            <Sidebar />
            <div className="main-wrapper">
                <Header title={title} breadcrumbs={breadcrumbs} />
                <main className="main-content">
                    {children}
                </main>
            </div>
        </div>
    );
}
