import React from 'react';

interface Option {
    value: string;
    label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: Option[];
    error?: string;
    placeholder?: string;
}

export function Select({
    label,
    options,
    error,
    placeholder,
    className = '',
    id,
    ...props
}: SelectProps) {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="form-group">
            {label && (
                <label htmlFor={selectId} className="form-label">
                    {label}
                </label>
            )}
            <select
                id={selectId}
                className={`form-input form-select ${error ? 'form-input-error' : ''} ${className}`}
                {...props}
            >
                {placeholder && (
                    <option value="" disabled>
                        {placeholder}
                    </option>
                )}
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && <p className="form-error">{error}</p>}
        </div>
    );
}
