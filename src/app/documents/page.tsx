'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import {
    Plus,
    Download,
    FolderOpen,
    Upload,
    FileText,
    Loader2,
    Trash2,
    ExternalLink,
} from 'lucide-react';

const typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'LEASE_AGREEMENT', label: 'Lease Agreement' },
    { value: 'ID_PROOF', label: 'ID Proof' },
    { value: 'RECEIPT', label: 'Receipt' },
    { value: 'NOTICE', label: 'Notice' },
    { value: 'OTHER', label: 'Other' },
];

const documentTypeOptions = [
    { value: 'LEASE_AGREEMENT', label: 'Lease Agreement' },
    { value: 'ID_PROOF', label: 'ID Proof' },
    { value: 'RECEIPT', label: 'Receipt' },
    { value: 'NOTICE', label: 'Notice' },
    { value: 'OTHER', label: 'Other' },
];

interface Document {
    id: string;
    filename: string;
    fileUrl: string;
    docType: string;
    property?: { name: string } | null;
    unit?: { unitNumber: string } | null;
    uploadedBy?: { name: string } | null;
    createdAt: string;
}

export default function DocumentsPage() {
    const searchParams = useSearchParams();
    const [typeFilter, setTypeFilter] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'OTHER',
    });

    // Auto-open modal if action=upload in URL
    useEffect(() => {
        if (searchParams.get('action') === 'upload') {
            setShowUploadModal(true);
        }
    }, [searchParams]);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const query = typeFilter ? `?type=${typeFilter}` : '';
            const response = await fetch(`/api/documents${query}`);
            const result = await response.json();
            if (result.success) {
                setDocuments(result.data);
            }
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, [typeFilter]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            if (!formData.name) {
                setFormData({ ...formData, name: file.name.replace(/\.[^/.]+$/, '') });
            }
        }
    };

    const handleSubmit = async () => {
        if (!selectedFile || !formData.name) return;

        setUploading(true);
        try {
            const uploadData = new FormData();
            uploadData.append('file', selectedFile);
            uploadData.append('filename', formData.name);
            uploadData.append('docType', formData.type);

            const response = await fetch('/api/documents', {
                method: 'POST',
                body: uploadData,
            });

            const result = await response.json();
            if (result.success) {
                setShowUploadModal(false);
                setFormData({ name: '', type: 'OTHER' });
                setSelectedFile(null);
                fetchDocuments();
            } else {
                alert(result.error || 'Failed to upload document');
            }
        } catch (error) {
            console.error('Error uploading document:', error);
            alert('Failed to upload document');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this document?')) return;

        try {
            const response = await fetch(`/api/documents?id=${id}`, {
                method: 'DELETE',
            });
            const result = await response.json();
            if (result.success) {
                fetchDocuments();
            }
        } catch (error) {
            console.error('Error deleting document:', error);
        }
    };

    const columns = [
        {
            key: 'filename',
            header: 'Document',
            render: (row: Document) => (
                <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-text-muted" />
                    <span className="font-medium">{row.filename}</span>
                </div>
            )
        },
        {
            key: 'docType',
            header: 'Type',
            render: (row: Document) => (
                <Badge variant="info">
                    {row.docType.replace('_', ' ')}
                </Badge>
            )
        },
        {
            key: 'property',
            header: 'Property/Unit',
            render: (row: Document) => {
                if (row.property) return row.property.name;
                if (row.unit) return `Unit ${row.unit.unitNumber}`;
                return '-';
            }
        },
        {
            key: 'createdAt',
            header: 'Uploaded',
            render: (row: Document) => new Date(row.createdAt).toLocaleDateString()
        },
        {
            key: 'actions',
            header: '',
            render: (row: Document) => (
                <div className="flex items-center gap-2">
                    <a
                        href={row.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-icon btn-tertiary"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                        onClick={() => handleDelete(row.id)}
                        className="btn btn-icon btn-tertiary text-danger"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )
        },
    ];

    return (
        <AppShell
            title="Documents"
            breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Documents' }]}
        >
            {/* Page Header */}
            <div className="page-header">
                <div className="flex items-center gap-4">
                    <Select
                        options={typeOptions}
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                    />
                </div>
                <div className="page-actions">
                    <Button variant="secondary">
                        <Download className="w-4 h-4" />
                        Export Index
                    </Button>
                    <Button onClick={() => setShowUploadModal(true)}>
                        <Plus className="w-4 h-4" />
                        Upload Document
                    </Button>
                </div>
            </div>

            {/* Documents List */}
            <Card>
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : documents.length > 0 ? (
                    <Table columns={columns} data={documents} />
                ) : (
                    <EmptyState
                        icon={<FolderOpen className="w-16 h-16" />}
                        title="No documents yet"
                        description="Upload lease agreements, ID proofs, and other documents to keep them organized"
                        actionLabel="Upload Document"
                        onAction={() => setShowUploadModal(true)}
                    />
                )}
            </Card>

            {/* Upload Document Modal */}
            <Modal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                title="Upload Document"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowUploadModal(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={uploading || !selectedFile}>
                            {uploading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                            ) : (
                                <><Upload className="w-4 h-4" /> Upload</>
                            )}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <Input
                        label="Document Name"
                        placeholder="e.g. Lease Agreement - Unit A1"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <Select
                        label="Document Type"
                        options={documentTypeOptions}
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    />
                    <div>
                        <label className="form-label">File</label>
                        <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${selectedFile ? 'border-primary bg-primary-light' : 'border-gray-300 hover:border-primary'
                                }`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {selectedFile ? (
                                <div>
                                    <FileText className="w-12 h-12 mx-auto text-primary mb-4" />
                                    <p className="font-medium text-primary">{selectedFile.name}</p>
                                    <p className="text-sm text-text-muted mt-1">
                                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                                    <p className="text-gray-600 mb-2">Drag and drop a file here, or click to browse</p>
                                    <p className="text-sm text-gray-400">Supports PDF, DOC, DOCX, JPG, PNG (max 10MB)</p>
                                </>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                onChange={handleFileSelect}
                            />
                        </div>
                    </div>
                </div>
            </Modal>
        </AppShell>
    );
}
