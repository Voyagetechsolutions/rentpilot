import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
    count?: number;
}

export function Skeleton({
    className = '',
    variant = 'text',
    width,
    height,
    count = 1
}: SkeletonProps) {
    const baseClasses = 'animate-pulse bg-gray-200 rounded';

    const variantClasses = {
        text: 'h-4 rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-lg',
    };

    const style = {
        width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
        height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
    };

    if (count > 1) {
        return (
            <div className="space-y-2">
                {Array.from({ length: count }).map((_, i) => (
                    <div
                        key={i}
                        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
                        style={style}
                    />
                ))}
            </div>
        );
    }

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
        />
    );
}

// Pre-built skeleton components for common use cases
export function CardSkeleton() {
    return (
        <div className="card p-6">
            <Skeleton variant="text" width="40%" className="mb-2" />
            <Skeleton variant="text" width="60%" height={32} />
        </div>
    );
}

export function KpiCardSkeleton() {
    return (
        <div className="card p-6">
            <div className="flex items-center gap-4">
                <Skeleton variant="circular" width={48} height={48} />
                <div className="flex-1">
                    <Skeleton variant="text" width="50%" className="mb-2" />
                    <Skeleton variant="text" width="70%" height={28} />
                </div>
            </div>
        </div>
    );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
    return (
        <tr>
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <Skeleton variant="text" />
                </td>
            ))}
        </tr>
    );
}

export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
    return (
        <div className="overflow-x-auto">
            <table className="table w-full">
                <thead>
                    <tr>
                        {Array.from({ length: columns }).map((_, i) => (
                            <th key={i} className="px-4 py-3">
                                <Skeleton variant="text" width="80%" />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: rows }).map((_, i) => (
                        <TableRowSkeleton key={i} columns={columns} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function PageHeaderSkeleton() {
    return (
        <div className="page-header">
            <div className="flex items-center gap-4">
                <Skeleton variant="rectangular" width={200} height={40} />
            </div>
            <div className="page-actions">
                <Skeleton variant="rectangular" width={100} height={40} />
                <Skeleton variant="rectangular" width={120} height={40} />
            </div>
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <KpiCardSkeleton key={i} />
                ))}
            </div>

            {/* Quick Actions */}
            <div className="card p-6">
                <Skeleton variant="text" width="30%" className="mb-4" />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} variant="rectangular" height={80} />
                    ))}
                </div>
            </div>

            {/* Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card p-6">
                    <Skeleton variant="text" width="40%" className="mb-4" />
                    <TableSkeleton rows={3} columns={4} />
                </div>
                <div className="card p-6">
                    <Skeleton variant="text" width="40%" className="mb-4" />
                    <TableSkeleton rows={3} columns={4} />
                </div>
            </div>
        </div>
    );
}
