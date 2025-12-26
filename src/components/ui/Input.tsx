import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-3 py-2 rounded border transition-colors focus:outline-none ${className}`}
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            borderColor: error ? 'var(--color-accent-red)' : 'var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm" style={{ color: 'var(--color-accent-red)' }}>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
