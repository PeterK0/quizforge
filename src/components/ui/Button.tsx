import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'font-medium rounded transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary: 'bg-accent-blue hover:bg-blue-600 text-white',
    secondary: 'bg-bg-secondary hover:bg-bg-tertiary text-text-primary border border-border',
    danger: 'bg-accent-red hover:bg-red-600 text-white',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  const buttonStyles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  return (
    <button className={buttonStyles} style={
      variant === 'primary' ? { backgroundColor: 'var(--color-accent-blue)' } :
      variant === 'danger' ? { backgroundColor: 'var(--color-accent-red)' } :
      {
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
        color: 'var(--color-text-primary)'
      }
    } {...props}>
      {children}
    </button>
  );
}
