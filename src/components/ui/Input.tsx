import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export function Input({
    label,
    error,
    helperText,
    className = '',
    id,
    ...props
}: InputProps) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="form-group">
            {label && (
                <label htmlFor={inputId} className="form-label">
                    {label}
                </label>
            )}
            <input
                id={inputId}
                className={`form-input ${error ? 'form-input-error' : ''} ${className}`}
                {...props}
            />
            {error && <p className="form-error">{error}</p>}
            {helperText && !error && (
                <p className="text-sm text-text-muted mt-1">{helperText}</p>
            )}
        </div>
    );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export function Textarea({
    label,
    error,
    className = '',
    id,
    ...props
}: TextareaProps) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="form-group">
            {label && (
                <label htmlFor={inputId} className="form-label">
                    {label}
                </label>
            )}
            <textarea
                id={inputId}
                className={`form-input ${error ? 'form-input-error' : ''} ${className}`}
                rows={4}
                {...props}
            />
            {error && <p className="form-error">{error}</p>}
        </div>
    );
}
