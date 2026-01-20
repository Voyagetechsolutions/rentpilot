import React from 'react';

type BadgeVariant =
    | 'default'
    | 'low' | 'medium' | 'high' | 'urgent'
    | 'vacant' | 'occupied'
    | 'submitted' | 'in-review' | 'in-progress' | 'completed'
    | 'active' | 'ended'
    | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
    default: 'bg-gray-100 text-gray-700',
    // Priority
    low: 'bg-blue-100 text-blue-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
    // Status
    vacant: 'bg-green-100 text-green-700',
    occupied: 'bg-blue-100 text-blue-700',
    // Maintenance Status
    submitted: 'bg-gray-100 text-gray-700',
    'in-review': 'bg-yellow-100 text-yellow-700',
    'in-progress': 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    // Lease Status
    active: 'bg-green-100 text-green-700',
    ended: 'bg-gray-100 text-gray-700',
    // General
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}>
            {children}
        </span>
    );
}

export function getBadgeVariant(status: string): BadgeVariant {
    const normalized = status.toLowerCase().replace('_', '-');
    if (normalized in variantStyles) {
        return normalized as BadgeVariant;
    }
    return 'default';
}
