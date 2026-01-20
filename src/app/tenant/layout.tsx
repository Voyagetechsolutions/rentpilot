'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function TenantLayout({
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
        if (role === 'LANDLORD') {
            router.push('/dashboard');
            return;
        }

        if (role === 'ADMIN') {
            router.push('/admin');
            return;
        }

        // TENANT role - authorized
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
