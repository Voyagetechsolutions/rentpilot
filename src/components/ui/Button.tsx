import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    tertiary: 'btn-tertiary',
    danger: 'btn-danger',
  };

  const sizeClasses = {
    sm: 'py-1.5 px-3 text-sm',
    md: '',
    lg: 'py-3 px-6 text-base',
  };

  return (
    <button
      className={`btn ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function IconButton({ className = '', children, ...props }: IconButtonProps) {
  return (
    <button className={`btn btn-icon btn-tertiary ${className}`} {...props}>
      {children}
    </button>
  );
}
