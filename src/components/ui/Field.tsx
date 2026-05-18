'use client';

import type { ReactNode, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * ═══════════════════════════════════════════════════════════════
 * Field — Form Field Wrapper (V25)
 * ═══════════════════════════════════════════════════════════════
 *
 * Wrapper موحّد لحقول النماذج مع:
 *   - Label + required marker
 *   - Hint text
 *   - Error message
 *   - Character counter (اختياري)
 *
 * استخدام:
 *   <Field
 *     label="رقم الهاتف"
 *     required
 *     hint="رقم عراقي يبدأ بـ 07"
 *     error={errors.phone}
 *     charCount={{ current: phone.length, max: 11 }}
 *   >
 *     <input type="tel" ... />
 *   </Field>
 * ═══════════════════════════════════════════════════════════════
 */

export interface FieldProps extends HTMLAttributes<HTMLDivElement> {
  /** الـ label */
  label?: string;
  /** هل هذا الحقل مطلوب؟ */
  required?: boolean;
  /** نص مساعد */
  hint?: string;
  /** رسالة خطأ (تجعل اللون أحمر) */
  error?: string;
  /** عدّاد الأحرف */
  charCount?: {
    current: number;
    max: number;
  };
  /** الـ id لربط الـ label */
  htmlFor?: string;
  /** هل الحقل اختياري؟ (يظهر "اختياري") */
  optional?: boolean;
  children: ReactNode;
}

export function Field({
  label,
  required,
  hint,
  error,
  charCount,
  htmlFor,
  optional,
  children,
  className,
  ...props
}: FieldProps) {
  const isCharOver = charCount && charCount.current > charCount.max;

  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)} {...props}>
      {/* ─── Label + Char counter ─── */}
      {(label || charCount) && (
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={htmlFor}
              className="text-xs font-bold text-ink-2 flex items-center gap-1"
            >
              <span>{label}</span>
              {required && (
                <span className="text-rose" aria-label="إلزامي">
                  *
                </span>
              )}
              {optional && (
                <span className="text-ink-4 font-medium text-2xs">
                  (اختياري)
                </span>
              )}
            </label>
          )}
          {charCount && (
            <span
              className={cn(
                'text-2xs font-bold',
                isCharOver ? 'text-rose' : 'text-ink-4'
              )}
              dir="ltr"
            >
              {charCount.current}/{charCount.max}
            </span>
          )}
        </div>
      )}

      {/* ─── Input ─── */}
      {children}

      {/* ─── Hint OR Error ─── */}
      {error ? (
        <span
          className="text-2xs font-bold text-rose px-1 flex items-center gap-1 animate-fade-in-up"
          role="alert"
        >
          <span aria-hidden="true">⚠</span>
          <span>{error}</span>
        </span>
      ) : hint ? (
        <span className="text-2xs text-ink-3 px-1">{hint}</span>
      ) : null}
    </div>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════
 * FieldGroup — مجموعة حقول مع title (للنماذج المعقّدة)
 * ═══════════════════════════════════════════════════════════════
 *
 * استخدام:
 *   <FieldGroup title="معلومات الاتصال" description="...">
 *     <Field label="..." ...><input /></Field>
 *     <Field label="..." ...><input /></Field>
 *   </FieldGroup>
 */

export interface FieldGroupProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  children: ReactNode;
}

export function FieldGroup({
  title,
  description,
  children,
  className,
  ...props
}: FieldGroupProps) {
  return (
    <div className={cn('flex flex-col gap-4', className)} {...props}>
      {(title || description) && (
        <div className="flex flex-col gap-1">
          {title && (
            <h3 className="text-base font-extrabold text-ink leading-snug">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-xs text-ink-3 leading-relaxed">{description}</p>
          )}
        </div>
      )}
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}
