// Type definitions for RentPilot

export type Role = 'LANDLORD' | 'TENANT';
export type UnitStatus = 'VACANT' | 'OCCUPIED';
export type LeaseStatus = 'ACTIVE' | 'ENDED';
export type RentStatus = 'PAID' | 'PARTIAL' | 'UNPAID' | 'OVERDUE';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'OTHER';
export type MaintenanceCategory = 'PLUMBING' | 'ELECTRICAL' | 'HVAC' | 'APPLIANCE' | 'STRUCTURAL' | 'OTHER';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type MaintenanceStatus = 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
export type DocumentType = 'LEASE_AGREEMENT' | 'ID_PROOF' | 'INSPECTION' | 'RECEIPT' | 'NOTICE' | 'OTHER';

export interface User {
    id: string;
    email: string;
    role: Role;
    name?: string;
    phone?: string;
    avatar?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Property {
    id: string;
    name: string;
    address: string;
    city: string;
    country: string;
    landlordId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Unit {
    id: string;
    unitNumber: string;
    propertyId: string;
    bedrooms: number;
    bathrooms: number;
    rentAmount: number;
    status: UnitStatus;
    createdAt: Date;
    updatedAt: Date;
}

export interface Tenant {
    id: string;
    userId: string;
    fullName: string;
    phone: string;
    idNumber?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Lease {
    id: string;
    tenantId: string;
    unitId: string;
    rentAmount: number;
    deposit: number;
    startDate: Date;
    endDate: Date;
    dueDay: number;
    status: LeaseStatus;
    createdAt: Date;
    updatedAt: Date;
}

export interface RentCharge {
    id: string;
    leaseId: string;
    month: string;
    amountDue: number;
    amountPaid: number;
    status: RentStatus;
    dueDate: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface Payment {
    id: string;
    tenantId: string;
    leaseId: string;
    amount: number;
    method: PaymentMethod;
    datePaid: Date;
    reference?: string;
    proofUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface MaintenanceRequest {
    id: string;
    unitId: string;
    tenantId: string;
    title: string;
    description: string;
    category: MaintenanceCategory;
    priority: Priority;
    status: MaintenanceStatus;
    attachments: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface Document {
    id: string;
    filename: string;
    fileUrl: string;
    docType: DocumentType;
    propertyId?: string;
    unitId?: string;
    leaseId?: string;
    uploadedById: string;
    createdAt: Date;
}

// API Response types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

// Dashboard KPI types
export interface DashboardKPIs {
    rentDue: number;
    rentCollected: number;
    overdueAmount: number;
    occupancyRate: number;
    openTickets: number;
    vacantUnits: number;
}
