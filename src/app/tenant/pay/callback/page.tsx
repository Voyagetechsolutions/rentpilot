'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { TenantLayout } from '@/components/layout/TenantLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import {
    Loader2,
    CheckCircle2,
    XCircle,
} from 'lucide-react';

export default function PaymentCallbackPage() {
    const searchParams = useSearchParams();
    const reference = searchParams.get('reference');
    const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
    const [paymentInfo, setPaymentInfo] = useState<{
        amount: number;
        reference: string;
    } | null>(null);

    useEffect(() => {
        const verifyPayment = async () => {
            if (!reference) {
                setStatus('failed');
                return;
            }

            try {
                const response = await fetch(`/api/payments/webhook?reference=${reference}`);
                const result = await response.json();

                if (result.success && result.data.status === 'success') {
                    setStatus('success');
                    setPaymentInfo({
                        amount: result.data.amount,
                        reference: result.data.reference,
                    });
                } else {
                    setStatus('failed');
                }
            } catch {
                setStatus('failed');
            }
        };

        verifyPayment();
    }, [reference]);

    return (
        <TenantLayout title="Payment Status">
            <div className="max-w-md mx-auto">
                <Card className="text-center p-8">
                    {status === 'loading' && (
                        <>
                            <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
                            <h2 className="text-xl font-semibold mb-2">Verifying Payment</h2>
                            <p className="text-text-secondary">Please wait while we confirm your payment...</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
                            <h2 className="text-xl font-semibold mb-2">Payment Successful!</h2>
                            <p className="text-text-secondary mb-4">
                                Your payment of R{paymentInfo?.amount?.toLocaleString()} has been received.
                            </p>
                            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                <div className="text-sm text-text-muted">Reference</div>
                                <div className="font-mono text-sm">{paymentInfo?.reference}</div>
                            </div>
                            <Link href="/tenant">
                                <Button>Back to Dashboard</Button>
                            </Link>
                        </>
                    )}

                    {status === 'failed' && (
                        <>
                            <XCircle className="w-16 h-16 text-danger mx-auto mb-4" />
                            <h2 className="text-xl font-semibold mb-2">Payment Failed</h2>
                            <p className="text-text-secondary mb-6">
                                We couldn&apos;t verify your payment. If funds were deducted, they will be refunded within 24-48 hours.
                            </p>
                            <div className="flex gap-4 justify-center">
                                <Link href="/tenant/pay">
                                    <Button>Try Again</Button>
                                </Link>
                                <Link href="/tenant">
                                    <Button variant="secondary">Back to Dashboard</Button>
                                </Link>
                            </div>
                        </>
                    )}
                </Card>
            </div>
        </TenantLayout>
    );
}
