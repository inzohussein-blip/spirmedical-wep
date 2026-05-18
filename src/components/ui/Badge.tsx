import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * ═══════════════════════════════════════════════════════════════
 * Badge Primitive — V25 (Design Tokens Aware)
 * ═══════════════════════════════════════════════════════════════
 *
 * Badge عام للـ tags, labels, counts.
 *
 * مختلف عن StatusBadge:
 *   - StatusBadge: للحالات الطبية (pending/confirmed/...) مع أيقونات ثابتة
 *   - Badge: عام للاستخدام في أي مكان (مثل count, category, tag)
 *
 * استخدام:
 *   <Badge variant="emerald">جديد</Badge>
 *   <Badge variant="amber" size="lg">عرض محدود</Badge>
 *   <Badge icon={<Star size={10} />}>مميز</Badge>
 * ═══════════════════════════════════════════════════════════════
 */

type BadgeVariant =
  | 'emerald' // أخضر
  | 'amber'   // كهرماني
  | 'rose'    // وردي
  | 'paper'   // رمادي فاتح
  | 'ink'     // داكن
  | 'soft'    // soft default
  | 'outline'; // فقط حدود

type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** أيقونة في البداية */
  icon?: ReactNode;
  /** هل rounded full (pill) أم rounded عادي؟ */
  pill?: boolean;
  /** إخفاء الـ pulse animation */
  pulse?: boolean;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  emerald: 'bg-emerald-soft text-emerald-deep',
  amber: 'bg-amber-soft text-amber',
  rose: 'bg-rose-soft text-rose',
  paper: 'bg-paper-2 text-ink-2',
  ink: 'bg-ink text-paper-3',
  soft: 'bg-paper-3 text-ink-2 border border-line',
  outline: 'bg-transparent border-2 border-line text-ink-2',
};

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: 'text-2xs px-2 py-0.5 gap-1',
  md: 'text-xs px-2.5 py-1 gap-1.5',
  lg: 'text-sm px-3 py-1.5 gap-2',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = 'soft',
      size = 'md',
      icon,
      pill = true,
      pulse = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-bold leading-none whitespace-nowrap transition-base',
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          pill ? 'rounded-full' : 'rounded-sm',
          pulse && 'animate-pulse',
          className
        )}
        {...props}
      >
        {icon && <span className="inline-flex">{icon}</span>}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

/* ─── Dot Badge (نقطة صغيرة فقط) ─────────────────────────── */

export interface DotBadgeProps {
  variant?: BadgeVariant;
  pulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const DOT_VARIANT_CLASSES: Record<BadgeVariant, string> = {
  emerald: 'bg-emerald',
  amber: 'bg-amber',
  rose: 'bg-rose',
  paper: 'bg-paper-2',
  ink: 'bg-ink',
  soft: 'bg-ink-3',
  outline: 'bg-transparent border-2 border-line',
};

const DOT_SIZE_CLASSES = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
};

export function DotBadge({
  variant = 'emerald',
  pulse = false,
  size = 'md',
  className,
}: DotBadgeProps) {
  return (
    <span
      className={cn(
        'inline-block rounded-full',
        DOT_VARIANT_CLASSES[variant],
        DOT_SIZE_CLASSES[size],
        pulse && 'animate-pulse',
        className
      )}
      aria-hidden="true"
    />
  );
}
