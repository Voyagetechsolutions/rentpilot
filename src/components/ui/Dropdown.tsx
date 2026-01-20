'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownProps {
    trigger: React.ReactNode;
    children: React.ReactNode;
    align?: 'left' | 'right';
}

export function Dropdown({ trigger, children, align = 'right' }: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="dropdown" ref={dropdownRef}>
            <div onClick={() => setIsOpen(!isOpen)}>
                {trigger}
            </div>
            {isOpen && (
                <div
                    className="dropdown-menu"
                    style={{ [align === 'left' ? 'left' : 'right']: 0 }}
                >
                    <div onClick={() => setIsOpen(false)}>
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
}

interface DropdownItemProps {
    icon?: React.ReactNode;
    children: React.ReactNode;
    onClick?: () => void;
    danger?: boolean;
}

export function DropdownItem({ icon, children, onClick, danger }: DropdownItemProps) {
    return (
        <div
            className={`dropdown-item ${danger ? 'text-danger' : ''}`}
            onClick={onClick}
        >
            {icon && <span className="w-4 h-4">{icon}</span>}
            {children}
        </div>
    );
}

export function DropdownDivider() {
    return <div className="dropdown-divider" />;
}

interface DropdownButtonProps {
    label: string;
    children: React.ReactNode;
    variant?: 'primary' | 'secondary';
}

export function DropdownButton({ label, children, variant = 'primary' }: DropdownButtonProps) {
    return (
        <Dropdown
            trigger={
                <button className={`btn btn-${variant}`}>
                    {label}
                    <ChevronDown className="w-4 h-4" />
                </button>
            }
        >
            {children}
        </Dropdown>
    );
}
