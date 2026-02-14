'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/ui/Dropdown';
import { useTenants, useUnits, useMutation } from '@/lib/hooks';
import {
    Plus,
    Download,
    Users,
    Search,
    MoreVertical,
    Eye,
    Edit,
    Trash2,
    Loader2,
    Mail,
    Phone,
    Send,
    Copy,
    CheckCircle2,
    AlertTriangle,
} from 'lucide-react';

interface InviteFormData {
    email: string;
    fullName: string;
    phone: string;
    unitId: string;
}

interface InvitationResult {
    invitationLink: string;
    email: string;
    fullName: string;
}

export default function TenantsPage() {
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const { data: tenants, loading, error, refetch } = useTenants(searchQuery);
    const { data: units } = useUnits(undefined, 'vacant');
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteFormData, setInviteFormData] = useState<InviteFormData>({
        email: '',
        fullName: '',
        phone: '',
        unitId: '',
    });
    const [invitationResult, setInvitationResult] = useState<InvitationResult | null>(null);
    const [copied, setCopied] = useState(false);

    // Remove tenant state
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [tenantToRemove, setTenantToRemove] = useState<{ id: string; fullName: string } | null>(null);
    const [removing, setRemoving] = useState(false);

    // Auto-open modal if action=new in URL
    useEffect(() => {
        if (searchParams.get('action') === 'new') {
            setShowInviteModal(true);
        }
    }, [searchParams]);

    const { mutate: sendInvitation, loading: inviting } = useMutation<InviteFormData>({
        url: '/api/invitations',
        onSuccess: (data) => {
            setInvitationResult(data as InvitationResult);
        },
    });

    const handleInvite = async () => {
        if (!inviteFormData.email || !inviteFormData.fullName || !inviteFormData.unitId) return;
        await sendInvitation(inviteFormData);
    };

    const handleCopyLink = () => {
        if (invitationResult?.invitationLink) {
            navigator.clipboard.writeText(invitationResult.invitationLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const resetInviteModal = () => {
        setShowInviteModal(false);
        setInviteFormData({ email: '', fullName: '', phone: '', unitId: '' });
        setInvitationResult(null);
        setCopied(false);
        refetch();
    };

    const handleRemoveClick = (tenant: { id: string; fullName: string }) => {
        setTenantToRemove(tenant);
        setShowRemoveModal(true);
    };

    const handleRemoveConfirm = async () => {
        if (!tenantToRemove) return;
        setRemoving(true);
        try {
            const response = await fetch(`/api/tenants?id=${tenantToRemove.id}`, {
                method: 'DELETE',
            });
            const result = await response.json();
            if (result.success) {
                setShowRemoveModal(false);
                setTenantToRemove(null);
                refetch();
            } else {
                alert(result.error || 'Failed to remove tenant');
            }
        } catch {
            alert('Failed to remove tenant. Please try again.');
        } finally {
            setRemoving(false);
        }
    };

    const columns = [
        {
            key: 'fullName',
            header: 'Tenant',
            render: (row: NonNullable<typeof tenants>[0]) => (
                <div>
                    <div className="font-medium">{row.fullName}</div>
                    <div className="text-sm text-text-muted">{row.user?.email}</div>
                </div>
            )
        },
        {
            key: 'phone',
            header: 'Contact',
            render: (row: NonNullable<typeof tenants>[0]) => (
                <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-text-muted" />
                    {row.phone}
                </div>
            )
        },
        {
            key: 'idNumber',
            header: 'ID Number',
            render: (row: NonNullable<typeof tenants>[0]) => row.idNumber || '-'
        },
        {
            key: 'leases',
            header: 'Status',
            render: (row: NonNullable<typeof tenants>[0] & { pendingUnit?: { unitNumber: string; property: { name: string } } }) => {
                const activeLeases = row.leases?.filter(l => l.status === 'ACTIVE') || [];
                if (activeLeases.length > 0) {
                    return <Badge variant="success">{activeLeases.length} active</Badge>;
                }
                if (row.pendingUnit) {
                    return (
                        <div>
                            <Badge variant="warning">Awaiting Lease</Badge>
                            <div className="text-xs text-text-muted mt-1">
                                {row.pendingUnit.unitNumber} - {row.pendingUnit.property.name}
                            </div>
                        </div>
                    );
                }
                return <Badge variant="info">No active lease</Badge>;
            }
        },
        {
            key: 'actions',
            header: '',
            render: (row: NonNullable<typeof tenants>[0] & { pendingUnit?: { id: string; unitNumber: string; property: { name: string } } }) => {
                const hasActiveLease = row.leases?.some(l => l.status === 'ACTIVE');
                return (
                    <div className="flex items-center gap-2">
                        {row.pendingUnit && !hasActiveLease && (
                            <Link href={`/leases?action=new&tenantId=${row.id}&unitId=${row.pendingUnit.id}`}>
                                <Button size="sm">Create Lease</Button>
                            </Link>
                        )}
                        <Dropdown
                            trigger={
                                <button className="btn btn-icon btn-tertiary">
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                            }
                        >
                            <DropdownItem icon={<Eye className="w-4 h-4" />}>View Details</DropdownItem>
                            <DropdownItem icon={<Mail className="w-4 h-4" />}>Send Email</DropdownItem>
                            <DropdownItem icon={<Edit className="w-4 h-4" />}>Edit</DropdownItem>
                            <DropdownDivider />
                            <DropdownItem
                                icon={<Trash2 className="w-4 h-4" />}
                                danger
                                onClick={() => handleRemoveClick({ id: row.id, fullName: row.fullName })}
                            >
                                Remove Tenant
                            </DropdownItem>
                        </Dropdown>
                    </div>
                );
            }
        },
    ];

    const vacantUnitsOptions = units?.map(u => ({
        value: u.id,
        label: `${u.unitNumber} - ${u.property?.name || 'Unknown'} (R${u.rentAmount.toLocaleString()}/mo)`
    })) || [];

    return (
        <AppShell
            title="Tenants"
            breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Tenants' }]}
        >
            {/* Page Header */}
            <div className="page-header">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Search tenants..."
                            className="form-input pl-10 w-64"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="page-actions">
                    <Button variant="secondary">
                        <Download className="w-4 h-4" />
                        Export
                    </Button>
                    <Button onClick={() => setShowInviteModal(true)}>
                        <Send className="w-4 h-4" />
                        Invite Tenant
                    </Button>
                </div>
            </div>

            {/* Tenants List */}
            <Card>
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : error ? (
                    <div className="text-center py-12">
                        <p className="text-danger mb-4">Error: {error}</p>
                        <Button onClick={refetch}>Retry</Button>
                    </div>
                ) : tenants && tenants.length > 0 ? (
                    <Table columns={columns} data={tenants} />
                ) : (
                    <EmptyState
                        icon={<Users className="w-16 h-16" />}
                        title="No tenants yet"
                        description="Invite tenants to join and assign them to your units"
                        actionLabel="Invite Tenant"
                        onAction={() => setShowInviteModal(true)}
                    />
                )}
            </Card>

            {/* Invite Tenant Modal */}
            <Modal
                isOpen={showInviteModal}
                onClose={resetInviteModal}
                title={invitationResult ? "Invitation Sent!" : "Invite Tenant"}
                footer={
                    invitationResult ? (
                        <Button onClick={resetInviteModal}>Done</Button>
                    ) : (
                        <>
                            <Button variant="secondary" onClick={resetInviteModal}>
                                Cancel
                            </Button>
                            <Button onClick={handleInvite} disabled={inviting || !inviteFormData.unitId}>
                                {inviting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Send Invitation
                                    </>
                                )}
                            </Button>
                        </>
                    )
                }
            >
                {invitationResult ? (
                    <div className="text-center space-y-4">
                        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                        <div>
                            <p className="font-medium">Invitation sent to {invitationResult.fullName}</p>
                            <p className="text-sm text-text-muted">{invitationResult.email}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-text-secondary mb-2">Share this link with the tenant:</p>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={invitationResult.invitationLink}
                                    readOnly
                                    className="form-input flex-1 text-sm"
                                />
                                <Button variant="secondary" size="sm" onClick={handleCopyLink}>
                                    {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>
                        <p className="text-xs text-text-muted">
                            The invitation link expires in 7 days
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-blue-700">
                                <strong>How it works:</strong> Send an invitation to your tenant. They&apos;ll receive a link to create their account and will be connected to the selected unit.
                            </p>
                        </div>
                        <Input
                            label="Tenant's Full Name"
                            placeholder="John Smith"
                            value={inviteFormData.fullName}
                            onChange={(e) => setInviteFormData({ ...inviteFormData, fullName: e.target.value })}
                            required
                        />
                        <Input
                            label="Tenant's Email"
                            type="email"
                            placeholder="john@example.com"
                            value={inviteFormData.email}
                            onChange={(e) => setInviteFormData({ ...inviteFormData, email: e.target.value })}
                            required
                        />
                        <Input
                            label="Phone (Optional)"
                            type="tel"
                            placeholder="+27 82 123 4567"
                            value={inviteFormData.phone}
                            onChange={(e) => setInviteFormData({ ...inviteFormData, phone: e.target.value })}
                        />
                        <Select
                            label="Assign to Unit"
                            options={vacantUnitsOptions}
                            value={inviteFormData.unitId}
                            onChange={(e) => setInviteFormData({ ...inviteFormData, unitId: e.target.value })}
                            placeholder="Select a vacant unit"
                            required
                        />
                        {vacantUnitsOptions.length === 0 && (
                            <p className="text-sm text-orange-600">
                                No vacant units available. Add a unit first or mark an existing unit as vacant.
                            </p>
                        )}
                    </div>
                )}
            </Modal>

            {/* Remove Tenant Confirmation Modal */}
            <Modal
                isOpen={showRemoveModal}
                onClose={() => { setShowRemoveModal(false); setTenantToRemove(null); }}
                title="Remove Tenant"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => { setShowRemoveModal(false); setTenantToRemove(null); }}>
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleRemoveConfirm}
                            disabled={removing}
                        >
                            {removing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Removing...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4" />
                                    Remove Tenant
                                </>
                            )}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
                        <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-red-800">This action cannot be undone</p>
                            <p className="text-sm text-red-600 mt-1">
                                Removing <strong>{tenantToRemove?.fullName}</strong> will:
                            </p>
                            <ul className="text-sm text-red-600 mt-2 list-disc list-inside space-y-1">
                                <li>Terminate any active lease agreements</li>
                                <li>Set the associated unit(s) back to vacant</li>
                                <li>Delete the tenant&apos;s account and all related records</li>
                            </ul>
                        </div>
                    </div>
                    <p className="text-sm text-text-secondary">
                        Are you sure you want to remove this tenant?
                    </p>
                </div>
            </Modal>
        </AppShell>
    );
}
