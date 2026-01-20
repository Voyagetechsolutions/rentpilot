import { useState, useEffect, useCallback, useRef } from 'react';

interface UseApiOptions<T> {
    url: string;
    initialData?: T;
    autoFetch?: boolean;
}

interface UseApiReturn<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export function useApi<T>({
    url,
    initialData,
    autoFetch = true,
}: UseApiOptions<T>): UseApiReturn<T> {
    const [data, setData] = useState<T | null>(initialData ?? null);
    const [loading, setLoading] = useState(autoFetch);
    const [error, setError] = useState<string | null>(null);
    const isMounted = useRef(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(url);
            const result = await response.json();

            if (!isMounted.current) return;

            if (result.success) {
                setData(result.data);
            } else {
                setError(result.error || 'An error occurred');
            }
        } catch (err) {
            if (!isMounted.current) return;
            setError('Failed to fetch data');
            console.error('API Error:', err);
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, [url]);

    useEffect(() => {
        isMounted.current = true;
        if (autoFetch) {
            fetchData();
        }
        return () => {
            isMounted.current = false;
        };
    }, [autoFetch, fetchData]);

    return { data, loading, error, refetch: fetchData };
}

// Mutation hook for POST/PUT/DELETE
interface UseMutationOptions {
    url: string;
    method?: 'POST' | 'PUT' | 'DELETE';
    onSuccess?: (data: unknown) => void;
    onError?: (error: string) => void;
}

interface UseMutationReturn<T> {
    mutate: (body?: T) => Promise<unknown>;
    loading: boolean;
    error: string | null;
}

export function useMutation<T>({
    url,
    method = 'POST',
    onSuccess,
    onError,
}: UseMutationOptions): UseMutationReturn<T> {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mutate = useCallback(async (body?: T) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: body ? JSON.stringify(body) : undefined,
            });

            const result = await response.json();

            if (result.success) {
                onSuccess?.(result.data);
                return result.data;
            } else {
                const errorMsg = result.error || 'An error occurred';
                setError(errorMsg);
                onError?.(errorMsg);
                throw new Error(errorMsg);
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to complete request';
            setError(errorMsg);
            onError?.(errorMsg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [url, method, onSuccess, onError]);

    return { mutate, loading, error };
}

// Specific hooks for each resource
export function useProperties() {
    return useApi<Property[]>({ url: '/api/properties' });
}

export function useUnits(propertyId?: string, status?: string) {
    const params = new URLSearchParams();
    if (propertyId) params.append('propertyId', propertyId);
    if (status) params.append('status', status);
    const query = params.toString() ? `?${params.toString()}` : '';

    return useApi<Unit[]>({ url: `/api/units${query}` });
}

export function useTenants(search?: string) {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return useApi<Tenant[]>({ url: `/api/tenants${query}` });
}

export function useLeases(status?: string) {
    const query = status ? `?status=${status}` : '';
    return useApi<Lease[]>({ url: `/api/leases${query}` });
}

export function usePayments(method?: string, dateFrom?: string, dateTo?: string) {
    const params = new URLSearchParams();
    if (method) params.append('method', method);
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    const query = params.toString() ? `?${params.toString()}` : '';

    return useApi<Payment[]>({ url: `/api/payments${query}` });
}

export function useMaintenance(status?: string, priority?: string) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (priority) params.append('priority', priority);
    const query = params.toString() ? `?${params.toString()}` : '';

    return useApi<MaintenanceRequest[]>({ url: `/api/maintenance${query}` });
}

export function useDashboard() {
    return useApi<DashboardData>({ url: '/api/dashboard' });
}

// Types
interface Property {
    id: string;
    name: string;
    address: string;
    city: string;
    country: string;
    units: Unit[];
    createdAt: string;
}

interface Unit {
    id: string;
    unitNumber: string;
    propertyId: string;
    bedrooms: number;
    bathrooms: number;
    rentAmount: number;
    status: 'VACANT' | 'OCCUPIED';
    property: Property;
    leases: Lease[];
}

interface Tenant {
    id: string;
    fullName: string;
    phone: string;
    idNumber: string;
    user: { email: string };
    leases: Lease[];
}

interface Lease {
    id: string;
    tenantId: string;
    unitId: string;
    rentAmount: number;
    deposit: number;
    startDate: string;
    endDate: string;
    dueDay: number;
    status: 'ACTIVE' | 'ENDED';
    tenant: Tenant;
    unit: Unit;
}

interface Payment {
    id: string;
    tenantId: string;
    leaseId: string;
    amount: number;
    method: string;
    datePaid: string;
    reference: string;
    tenant: Tenant;
    lease: Lease;
}

interface MaintenanceRequest {
    id: string;
    unitId: string;
    tenantId: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    unit: Unit;
    tenant: Tenant;
    createdAt: string;
}

interface DashboardData {
    kpis: {
        rentDue: number;
        rentCollected: number;
        overdueAmount: number;
        occupancyRate: number;
        openTickets: number;
        vacantUnits: number;
        totalUnits: number;
    };
    overdueLeases: {
        id: string;
        tenant: string;
        unit: string;
        amount: number;
        dueDate: string;
    }[];
    recentMaintenance: {
        id: string;
        title: string;
        unit: string;
        priority: string;
        status: string;
        createdAt: string;
    }[];
}
