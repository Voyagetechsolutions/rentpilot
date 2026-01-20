'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        if (status === 'loading') return;

        if (!session) {
            router.push('/login');
            return;
        }

        const role = (session.user as { role?: string })?.role;

        // Redirect based on role
        if (role === 'TENANT') {
            router.push('/tenant');
            return;
        }

        if (role === 'ADMIN') {
            // Admins can access landlord dashboard
            setAuthorized(true);
            return;
        }

        // LANDLORD role - authorized
        setAuthorized(true);
    }, [session, status, router]);

    if (status === 'loading' || !authorized) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return <>{children}</>;
}
