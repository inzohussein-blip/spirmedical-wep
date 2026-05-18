import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * ═══════════════════════════════════════════════════════════════
 * Separator Primitive — V25 (Design Tokens Aware)
 * ═══════════════════════════════════════════════════════════════
 *
 * فاصل بصري بين الأقسام
 *
 * استخدام:
 *   <Separator />                          // افتراضي
 *   <Separator orientation="vertical" />   // عمودي
 *   <Separator label="أو" />               // مع نص
 *   <Separator decorative dashed />        // متقطع
 * ═══════════════════════════════════════════════════════════════
 */

export interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  /** نص في المنتصف (مثل "أو") */
  label?: string;
  /** خط متقطّع */
  dashed?: boolean;
  /** سُمك */
  thick?: boolean;
}

export function Separator({
  className,
  orientation = 'horizontal',
  label,
  dashed = false,
  thick = false,
  ...props
}: SeparatorProps) {
  // Vertical separator
  if (orientation === 'vertical') {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={cn(
          'inline-block bg-line h-full',
          thick ? 'w-0.5' : 'w-px',
          className
        )}
        {...props}
      />
    );
  }

  // Horizontal with label
  if (label) {
    return (
      <div
        role="separator"
        className={cn(
          'flex items-center gap-3 my-4 w-full',
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'flex-1',
            thick ? 'h-0.5' : 'h-px',
            dashed ? 'border-t border-dashed border-line-2' : 'bg-line'
          )}
        />
        <span className="text-xs font-bold text-ink-3 px-2 select-none">
          {label}
        </span>
        <div
          className={cn(
            'flex-1',
            thick ? 'h-0.5' : 'h-px',
            dashed ? 'border-t border-dashed border-line-2' : 'bg-line'
          )}
        />
      </div>
    );
  }

  // Horizontal plain
  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      className={cn(
        'w-full my-4',
        thick ? 'h-0.5' : 'h-px',
        dashed ? 'border-t border-dashed border-line-2 bg-transparent' : 'bg-line',
        className
      )}
      {...props}
    />
  );
}
