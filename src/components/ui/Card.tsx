import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * ═══════════════════════════════════════════════════════════════
 * Card Primitive — V25 (Design Tokens Aware)
 * ═══════════════════════════════════════════════════════════════
 *
 * أنواع Cards (variants):
 *   - default: بطاقة بيضاء + ظل خفيف
 *   - flat: بدون ظل (داخل containers)
 *   - elevated: ظل أكبر للأهمية
 *   - bordered: حدود فقط بدون ظل
 *   - filled: خلفية paper بدلاً من بيضاء
 *
 * أحجام (sizes):
 *   - sm: padding صغير (12px)
 *   - md: افتراضي (16px)
 *   - lg: padding كبير (20px)
 *   - xl: padding أكبر (24px)
 *
 * استخدام:
 *   <Card>
 *     <CardHeader>
 *       <CardTitle>عنوان</CardTitle>
 *       <CardDescription>وصف</CardDescription>
 *     </CardHeader>
 *     <CardContent>محتوى</CardContent>
 *     <CardFooter>أزرار</CardFooter>
 *   </Card>
 * ═══════════════════════════════════════════════════════════════
 */

type CardVariant = 'default' | 'flat' | 'elevated' | 'bordered' | 'filled';
type CardSize = 'sm' | 'md' | 'lg' | 'xl';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  size?: CardSize;
  /** إذا true، تتفاعل البطاقة مع hover (للبطاقات القابلة للنقر) */
  interactive?: boolean;
}

const VARIANT_CLASSES: Record<CardVariant, string> = {
  default: 'bg-white border border-line shadow-sm',
  flat: 'bg-white border border-line',
  elevated: 'bg-white shadow-md',
  bordered: 'bg-white border-2 border-line',
  filled: 'bg-paper-3 border border-line',
};

const SIZE_CLASSES: Record<CardSize, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
  xl: 'p-6',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      interactive = false,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg transition-base',
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          interactive &&
            'cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:translate-y-0',
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

/* ─── CardHeader ────────────────────────────────────────────── */

export const CardHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('mb-3 flex flex-col gap-1', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

/* ─── CardTitle ─────────────────────────────────────────────── */

export const CardTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-md font-extrabold tracking-tight text-ink leading-snug',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

/* ─── CardDescription ──────────────────────────────────────── */

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-xs text-ink-3 leading-relaxed', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

/* ─── CardContent ──────────────────────────────────────────── */

export const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('', className)} {...props} />
));
CardContent.displayName = 'CardContent';

/* ─── CardFooter ───────────────────────────────────────────── */

export const CardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'mt-4 pt-4 border-t border-line flex items-center gap-2',
      className
    )}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';
