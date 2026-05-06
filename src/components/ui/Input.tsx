import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || `input-${label?.replace(/\s+/g, '-')}`;

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label htmlFor={inputId} className="text-sm font-bold text-ink">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-xl border bg-white px-4 py-3 text-base outline-none transition-all',
            'placeholder:text-ink-4',
            'focus:border-emerald focus:ring-2 focus:ring-emerald/20',
            error
              ? 'border-rose focus:border-rose focus:ring-rose/20'
              : 'border-ink/10',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {hint && !error && (
          <span className="text-xs text-ink-3">{hint}</span>
        )}
        {error && (
          <span id={`${inputId}-error`} className="text-xs text-rose font-bold">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
