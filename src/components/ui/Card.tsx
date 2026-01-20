import React from 'react';

interface CardProps {
    title?: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

export function Card({ title, actions, children, className = '', onClick }: CardProps) {
    return (
        <div
            className={`card ${onClick ? 'cursor-pointer' : ''} ${className}`}
            onClick={onClick}
        >
            {(title || actions) && (
                <div className="card-header">
                    {title && <h3 className="card-title">{title}</h3>}
                    {actions && <div className="flex gap-2">{actions}</div>}
                </div>
            )}
            {children}
        </div>
    );
}
