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
    FileText,
    Download,
} from 'lucide-react';

interface ReceiptData {
    receiptNumber: string;
    amount: number;
    method: string;
    reference: string;
    date: string;
    tenant: { name: string };
    property: { name: string; unit: string; address: string };
    allocations: { month: string; amount: number }[];
}

export default function PaymentCallbackPage() {
    const searchParams = useSearchParams();
    const reference = searchParams.get('reference');
    const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
    const [paymentInfo, setPaymentInfo] = useState<{
        amount: number;
        reference: string;
    } | null>(null);
    const [receipt, setReceipt] = useState<ReceiptData | null>(null);

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

                    // Try to fetch receipt
                    try {
                        const paymentRes = await fetch(`/api/tenant/payments`);
                        const paymentResult = await paymentRes.json();
                        if (paymentResult.success) {
                            const matchedPayment = paymentResult.data.payments.find(
                                (p: { reference: string }) => p.reference?.includes(reference)
                            );
                            if (matchedPayment) {
                                const receiptRes = await fetch(`/api/payments/${matchedPayment.id}/receipt`);
                                const receiptResult = await receiptRes.json();
                                if (receiptResult.success) {
                                    setReceipt(receiptResult.data);
                                }
                            }
                        }
                    } catch {
                        // Receipt fetch is optional
                    }
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

                            <div className="bg-gray-50 p-4 rounded-lg mb-6 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-muted">Reference</span>
                                    <span className="font-mono text-sm">{paymentInfo?.reference}</span>
                                </div>
                                {receipt && (
                                    <>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-text-muted">Receipt #</span>
                                            <span className="font-mono text-sm">{receipt.receiptNumber}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-text-muted">Property</span>
                                            <span>{receipt.property.name} — Unit {receipt.property.unit}</span>
                                        </div>
                                        {receipt.allocations.length > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-text-muted">Covers</span>
                                                <span>{receipt.allocations.map(a => a.month).join(', ')}</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="flex flex-col gap-3">
                                {receipt && (
                                    <Button variant="secondary" className="w-full" onClick={() => {
                                        const receiptText = `
PAYMENT RECEIPT
${receipt.receiptNumber}
==========================
Amount: R${receipt.amount.toLocaleString()}
Method: ${receipt.method}
Date: ${new Date(receipt.date).toLocaleDateString('en-ZA')}
Reference: ${receipt.reference}
Property: ${receipt.property.name}
Unit: ${receipt.property.unit}
Months: ${receipt.allocations.map(a => a.month).join(', ')}
==========================
                                        `.trim();
                                        const blob = new Blob([receiptText], { type: 'text/plain' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `${receipt.receiptNumber}.txt`;
                                        a.click();
                                    }}>
                                        <Download className="w-4 h-4" />
                                        Download Receipt
                                    </Button>
                                )}
                                <Link href="/tenant/payments" className="w-full">
                                    <Button variant="secondary" className="w-full">
                                        <FileText className="w-4 h-4" />
                                        View Payment History
                                    </Button>
                                </Link>
                                <Link href="/tenant" className="w-full">
                                    <Button className="w-full">Back to Dashboard</Button>
                                </Link>
                            </div>
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
