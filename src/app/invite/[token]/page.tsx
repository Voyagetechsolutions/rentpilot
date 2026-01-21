'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
    Building2,
    Home,
    Loader2,
    CheckCircle2,
    XCircle,
    AlertCircle,
} from 'lucide-react';

interface InvitationData {
    id: string;
    email: string;
    fullName: string;
    status: string;
    expiresAt: string;
    isExpired: boolean;
    isValid: boolean;
    unit: {
        unitNumber: string;
        rentAmount: number;
        property: {
            name: string;
            address: string;
            city: string;
        };
    };
}

export default function InvitationAcceptPage() {
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [invitation, setInvitation] = useState<InvitationData | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        const fetchInvitation = async () => {
            try {
                const response = await fetch(`/api/invitations/accept?token=${token}`);
                const result = await response.json();

                if (result.success) {
                    setInvitation(result.data);
                } else {
                    setError(result.error || 'Invitation not found');
                }
            } catch {
                setError('Failed to load invitation');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchInvitation();
        }
    }, [token]);

    const handleAccept = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const response = await fetch('/api/invitations/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            const result = await response.json();

            if (result.success) {
                setSuccess(true);
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            } else {
                setError(result.error || 'Failed to accept invitation');
            }
        } catch {
            setError('Failed to accept invitation');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="max-w-md w-full text-center p-8">
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Welcome to Nook!</h1>
                    <p className="text-text-secondary mb-6">
                        Your account has been created successfully. You will be redirected to login in a few seconds.
                    </p>
                    <Link href="/login">
                        <Button>Go to Login</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    if (!invitation || invitation.isExpired || !invitation.isValid) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="max-w-md w-full text-center p-8">
                    {invitation?.status === 'ACCEPTED' ? (
                        <>
                            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <h1 className="text-2xl font-bold mb-2">Already Accepted</h1>
                            <p className="text-text-secondary mb-6">
                                This invitation has already been accepted. Please log in with your account.
                            </p>
                            <Link href="/login">
                                <Button>Go to Login</Button>
                            </Link>
                        </>
                    ) : invitation?.isExpired ? (
                        <>
                            <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                            <h1 className="text-2xl font-bold mb-2">Invitation Expired</h1>
                            <p className="text-text-secondary mb-6">
                                This invitation has expired. Please contact your landlord to request a new invitation.
                            </p>
                        </>
                    ) : (
                        <>
                            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                            <h1 className="text-2xl font-bold mb-2">Invalid Invitation</h1>
                            <p className="text-text-secondary mb-6">
                                {error || 'This invitation is no longer valid.'}
                            </p>
                        </>
                    )}
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="max-w-lg w-full p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
                        <Building2 className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">You&apos;re Invited!</h1>
                    <p className="text-text-secondary">
                        You have been invited to join Nook as a tenant
                    </p>
                </div>

                {/* Property Details */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <Home className="w-5 h-5 text-primary mt-1" />
                        <div>
                            <h3 className="font-semibold">{invitation.unit.property.name}</h3>
                            <p className="text-sm text-text-secondary">
                                Unit {invitation.unit.unitNumber}
                            </p>
                            <p className="text-sm text-text-muted">
                                {invitation.unit.property.address}, {invitation.unit.property.city}
                            </p>
                            <p className="text-lg font-bold text-primary mt-2">
                                R{invitation.unit.rentAmount.toLocaleString()}/month
                            </p>
                        </div>
                    </div>
                </div>

                {/* Registration Form */}
                <form onSubmit={handleAccept} className="space-y-4">
                    <div className="text-center">
                        <p className="text-sm text-text-secondary mb-1">Creating account for</p>
                        <p className="font-medium">{invitation.email}</p>
                        <p className="text-sm text-text-muted">{invitation.fullName}</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <Input
                        label="Create Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        required
                    />

                    <Input
                        label="Confirm Password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        required
                    />

                    <Button type="submit" className="w-full" disabled={submitting}>
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Creating Account...
                            </>
                        ) : (
                            'Accept Invitation & Create Account'
                        )}
                    </Button>
                </form>

                <p className="text-xs text-text-muted text-center mt-6">
                    By accepting, you agree to our Terms of Service and Privacy Policy
                </p>
            </Card>
        </div>
    );
}
