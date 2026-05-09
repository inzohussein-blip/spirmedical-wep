import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', size = 'md', fullWidth, children, ...props },
    ref
  ) => {
    const variants = {
      primary:
        'bg-emerald text-paper-3 hover:bg-emerald-deep disabled:bg-ink-4',
      secondary:
        'bg-paper-2 text-ink hover:bg-paper border border-ink/10 disabled:opacity-50',
      ghost:
        'bg-transparent text-ink hover:bg-paper-2 disabled:opacity-50',
      danger:
        'bg-rose text-paper-3 hover:opacity-90 disabled:opacity-50',
    };

    const sizes = {
      sm: 'px-3 py-2 text-sm rounded-lg',
      md: 'px-5 py-3 text-base rounded-xl',
      lg: 'px-7 py-4 text-lg rounded-xl',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'font-bold transition-all duration-150 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
