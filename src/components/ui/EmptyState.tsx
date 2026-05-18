import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * ═══════════════════════════════════════════════════════════════
 * EmptyState Primitive — V25 (Design Tokens Aware)
 * ═══════════════════════════════════════════════════════════════
 *
 * عرض موحّد لـ "لا توجد بيانات" في كل المنصة
 *
 * استخدام:
 *   <EmptyState
 *     icon="📭"
 *     title="لا توجد طلبات"
 *     description="ابدأ بإنشاء أول طلب الآن"
 *     action={<Button>+ طلب جديد</Button>}
 *   />
 *
 *   // أو مع lucide icon:
 *   <EmptyState
 *     icon={<Inbox size={48} />}
 *     title="..." description="..."
 *   />
 * ═══════════════════════════════════════════════════════════════
 */

type EmptyStateSize = 'sm' | 'md' | 'lg';
type EmptyStateVariant = 'default' | 'bordered' | 'plain';

export interface EmptyStateProps {
  /** أيقونة (emoji أو lucide icon component) */
  icon?: ReactNode;
  /** عنوان رئيسي */
  title: string;
  /** وصف مختصر */
  description?: string;
  /** أزرار في الأسفل */
  action?: ReactNode;
  /** زر ثانوي (link) */
  secondaryAction?: ReactNode;
  /** حجم */
  size?: EmptyStateSize;
  /** نوع المظهر */
  variant?: EmptyStateVariant;
  className?: string;
}

const SIZE_CONFIG: Record<
  EmptyStateSize,
  { padding: string; iconSize: number; titleClass: string; descClass: string }
> = {
  sm: {
    padding: 'py-8 px-4',
    iconSize: 32,
    titleClass: 'text-base',
    descClass: 'text-xs',
  },
  md: {
    padding: 'py-12 px-6',
    iconSize: 48,
    titleClass: 'text-lg',
    descClass: 'text-sm',
  },
  lg: {
    padding: 'py-16 px-8',
    iconSize: 64,
    titleClass: 'text-xl',
    descClass: 'text-base',
  },
};

const VARIANT_CLASSES: Record<EmptyStateVariant, string> = {
  default: 'bg-white border border-line rounded-lg',
  bordered: 'bg-transparent border-2 border-dashed border-line-2 rounded-lg',
  plain: '',
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
  variant = 'default',
  className,
}: EmptyStateProps) {
  const config = SIZE_CONFIG[size];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center animate-fade-in',
        config.padding,
        VARIANT_CLASSES[variant],
        className
      )}
      role="status"
    >
      {icon && (
        <div
          className="mb-4 flex items-center justify-center text-ink-3"
          style={{ fontSize: config.iconSize }}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}

      <h3
        className={cn(
          'font-extrabold text-ink mb-2 leading-snug',
          config.titleClass
        )}
      >
        {title}
      </h3>

      {description && (
        <p
          className={cn(
            'text-ink-3 max-w-md leading-relaxed',
            config.descClass
          )}
        >
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="mt-5 flex items-center gap-2 flex-wrap justify-center">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}

/* ─── ErrorState (مخصص للأخطاء) ──────────────────────────── */

export interface ErrorStateProps {
  title?: string;
  description?: string;
  error?: Error | string;
  action?: ReactNode;
  size?: EmptyStateSize;
}

export function ErrorState({
  title = 'حدث خطأ',
  description = 'لم نتمكّن من إكمال العملية. حاول مرة أخرى.',
  error,
  action,
  size = 'md',
}: ErrorStateProps) {
  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <EmptyState
      icon="⚠️"
      title={title}
      description={errorMessage || description}
      action={action}
      size={size}
      variant="bordered"
      className="text-rose"
    />
  );
}
