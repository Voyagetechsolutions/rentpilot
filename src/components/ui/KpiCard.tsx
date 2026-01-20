import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
    label: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    onClick?: () => void;
    icon?: React.ReactNode;
}

export function KpiCard({ label, value, change, changeLabel, onClick, icon }: KpiCardProps) {
    const isPositive = change !== undefined && change >= 0;

    return (
        <div className="kpi-card" onClick={onClick}>
            <div className="flex items-center justify-between">
                <span className="kpi-label">{label}</span>
                {icon && <span className="text-neutral">{icon}</span>}
            </div>
            <div className="kpi-value">{value}</div>
            {change !== undefined && (
                <div className={`kpi-change ${isPositive ? 'kpi-change-up' : 'kpi-change-down'}`}>
                    {isPositive ? (
                        <TrendingUp className="w-3 h-3" />
                    ) : (
                        <TrendingDown className="w-3 h-3" />
                    )}
                    <span>{Math.abs(change)}% {changeLabel || 'vs last month'}</span>
                </div>
            )}
        </div>
    );
}
