import React from 'react';
import { Button } from './Button';
import { FolderOpen } from 'lucide-react';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
}

export function EmptyState({
    icon,
    title,
    description,
    actionLabel,
    onAction,
}: EmptyStateProps) {
    return (
        <div className="empty-state">
            <div className="empty-state-icon">
                {icon || <FolderOpen className="w-16 h-16" />}
            </div>
            <h3 className="empty-state-title">{title}</h3>
            {description && (
                <p className="empty-state-description">{description}</p>
            )}
            {actionLabel && onAction && (
                <Button onClick={onAction}>{actionLabel}</Button>
            )}
        </div>
    );
}
