'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ═══════════════════════════════════════════════════════════════
 * Button — مكوّن الزرّ الموحّد لـ Spir Medical
 * ═══════════════════════════════════════════════════════════════
 *
 * يدعم 6 variants × 4 sizes + loading + icons + asChild + fullWidth
 *
 * يقرأ ألوانه من CSS variables (theme tokens) للتكامل مع
 * Dynamic Theme System (المرحلة B):
 *   --btn-primary-bg, --btn-primary-fg, --btn-primary-bg-hover
 *
 * أمثلة:
 *   <Button>اطلب الفحص</Button>
 *   <Button variant="secondary" size="sm" loading>جارٍ الحفظ...</Button>
 *   <Button variant="danger" leftIcon={<Trash2 />}>حذف</Button>
 *   <Button asChild><Link href="/login">تسجيل الدخول</Link></Button>
 * ═══════════════════════════════════════════════════════════════
 */

export type ButtonVariant =
  | 'primary' // CTA رئيسي (أخضر emerald)
  | 'secondary' // ثانوي (paper مع border)
  | 'ghost' // شفاف بدون border
  | 'outline' // border فقط
  | 'danger' // تحذيري (rose أحمر)
  | 'link'; // كرابط نصي

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  /**
   * عند true يطبّق الـ styles على الـ child مباشرة بدل <button>
   * مفيد للاستخدام مع Link أو a tag
   */
  asChild?: boolean;
}

/* ─── Variants Map ─────────────────────────────────────────── */

const variantClasses: Record<ButtonVariant, string> = {
  primary: cn(
    'bg-[var(--btn-primary-bg,#0E5C4D)] text-[var(--btn-primary-fg,#FAF6EB)]',
    'hover:bg-[var(--btn-primary-bg-hover,#073B30)]',
    'shadow-[0_4px_12px_-4px_rgba(14,92,77,0.35)]',
    'hover:shadow-[0_6px_16px_-4px_rgba(14,92,77,0.45)]',
    'active:translate-y-px',
    'disabled:bg-[#6E7878] disabled:shadow-none'
  ),
  secondary: cn(
    'bg-[var(--btn-secondary-bg,#F4EFE2)] text-[var(--btn-secondary-fg,#0F1A1C)]',
    'border border-[var(--line,rgba(15,26,28,0.08))]',
    'hover:bg-[var(--paper,#FAF6EB)]',
    'disabled:opacity-50'
  ),
  ghost: cn(
    'bg-transparent text-[var(--ink,#0F1A1C)]',
    'hover:bg-[var(--paper-2,#F4EFE2)]',
    'disabled:opacity-50'
  ),
  outline: cn(
    'bg-transparent text-[var(--btn-primary-bg,#0E5C4D)]',
    'border-2 border-[var(--btn-primary-bg,#0E5C4D)]',
    'hover:bg-[var(--btn-primary-bg,#0E5C4D)] hover:text-[var(--btn-primary-fg,#FAF6EB)]',
    'disabled:opacity-50'
  ),
  danger: cn(
    'bg-[var(--btn-danger-bg,#A82E3D)] text-[var(--btn-danger-fg,#FAF6EB)]',
    'hover:bg-[var(--btn-danger-bg-hover,#8A2532)]',
    'shadow-[0_4px_12px_-4px_rgba(168,46,61,0.35)]',
    'disabled:opacity-50 disabled:shadow-none'
  ),
  link: cn(
    'bg-transparent text-[var(--btn-primary-bg,#0E5C4D)]',
    'underline-offset-4 hover:underline',
    'p-0 shadow-none',
    'disabled:opacity-50'
  ),
};

/* ─── Sizes Map ────────────────────────────────────────────── */

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'px-2.5 py-1.5 text-xs rounded-md gap-1.5 min-h-[28px]',
  sm: 'px-3.5 py-2 text-sm rounded-lg gap-1.5 min-h-[36px]',
  md: 'px-5 py-2.5 text-sm rounded-xl gap-2 min-h-[44px]',
  lg: 'px-6 py-3.5 text-base rounded-xl gap-2 min-h-[52px]',
};

const iconSizes: Record<ButtonSize, number> = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
};

/* ─── Base classes (مشتركة) ────────────────────────────────── */

const baseClasses = cn(
  'inline-flex items-center justify-center',
  'font-bold leading-none',
  'transition-all duration-150 ease-out',
  'select-none whitespace-nowrap',
  'disabled:cursor-not-allowed',
  'focus-visible:outline-none focus-visible:ring-2',
  'focus-visible:ring-[var(--btn-primary-bg,#0E5C4D)] focus-visible:ring-offset-2',
  'focus-visible:ring-offset-[var(--paper-3,#FAF6EB)]'
);

/* ─── المكوّن ──────────────────────────────────────────────── */

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      fullWidth,
      loading = false,
      leftIcon,
      rightIcon,
      asChild = false,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const iconSize = iconSizes[size];

    const composedClassName = cn(
      baseClasses,
      variantClasses[variant],
      variant !== 'link' && sizeClasses[size],
      fullWidth && 'w-full',
      className
    );

    // asChild: استخدم span للالتفاف بـ child (مفيد مع Link)
    if (asChild) {
      return (
        <span className={composedClassName} data-disabled={isDisabled || undefined}>
          {loading ? (
            <Loader2
              size={iconSize}
              strokeWidth={2.2}
              className="animate-spin"
              aria-hidden
            />
          ) : (
            leftIcon
          )}
          {children}
          {!loading && rightIcon}
        </span>
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={composedClassName}
        {...props}
      >
        {loading ? (
          <Loader2
            size={iconSize}
            strokeWidth={2.2}
            className="animate-spin"
            aria-hidden
          />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
