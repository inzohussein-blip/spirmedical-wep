'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * ═══════════════════════════════════════════════════════════════
 * Input Primitive — V25 (Design Tokens Aware)
 * ═══════════════════════════════════════════════════════════════
 *
 * Features:
 *   ✓ Label, error, hint built-in
 *   ✓ Left/Right icons
 *   ✓ 3 sizes (sm, md, lg)
 *   ✓ 2 variants (default, filled)
 *   ✓ Disabled + readOnly states
 *   ✓ Full accessibility
 *
 * استخدام:
 *   <Input
 *     label="رقم الهاتف"
 *     placeholder="07XXXXXXXXX"
 *     leftIcon={<Phone size={16} />}
 *     error={phoneError}
 *     required
 *   />
 * ═══════════════════════════════════════════════════════════════
 */

type InputSize = 'sm' | 'md' | 'lg';
type InputVariant = 'default' | 'filled';

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** تسمية فوق الحقل */
  label?: string;
  /** رسالة خطأ (تجعل اللون أحمر) */
  error?: string;
  /** نص مساعد تحت الحقل */
  hint?: string;
  /** أيقونة على اليمين (RTL: تظهر في بداية الحقل) */
  leftIcon?: ReactNode;
  /** أيقونة على اليسار */
  rightIcon?: ReactNode;
  /** حجم الحقل */
  inputSize?: InputSize;
  /** نوع المظهر */
  variant?: InputVariant;
  /** هل الحقل مطلوب؟ يظهر * أحمر */
  required?: boolean;
  /** label إضافي إلى يسار الحقل (مثل عدد الأحرف) */
  labelAccessory?: ReactNode;
}

const SIZE_CLASSES: Record<InputSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-3 text-base',
  lg: 'h-12 px-4 text-md',
};

const VARIANT_CLASSES: Record<InputVariant, string> = {
  default: 'bg-white border border-line',
  filled: 'bg-paper-3 border border-transparent',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      inputSize = 'md',
      variant = 'default',
      required,
      labelAccessory,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId =
      id || `input-${label?.replace(/\s+/g, '-') || Math.random().toString(36).slice(2, 8)}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const hintId = hint ? `${inputId}-hint` : undefined;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {/* Label */}
        {(label || labelAccessory) && (
          <div className="flex items-center justify-between">
            {label && (
              <label
                htmlFor={inputId}
                className="text-xs font-bold text-ink-2 flex items-center gap-1"
              >
                <span>{label}</span>
                {required && (
                  <span className="text-rose" aria-label="إلزامي">
                    *
                  </span>
                )}
              </label>
            )}
            {labelAccessory && (
              <span className="text-xs text-ink-3">{labelAccessory}</span>
            )}
          </div>
        )}

        {/* Input container with icons */}
        <div
          className={cn(
            'relative flex items-center rounded-md transition-base overflow-hidden',
            VARIANT_CLASSES[variant],
            error && 'border-rose',
            !error &&
              'focus-within:border-emerald focus-within:shadow-focus',
            disabled && 'opacity-60 cursor-not-allowed bg-paper-2'
          )}
        >
          {leftIcon && (
            <div className="flex items-center justify-center pr-3 text-ink-3 pointer-events-none">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={cn(
              'flex-1 bg-transparent outline-none border-0',
              'placeholder:text-ink-4',
              'font-medium text-ink',
              'disabled:cursor-not-allowed',
              SIZE_CLASSES[inputSize],
              // إذا فيه icon، نقلل padding الجانب
              leftIcon && 'pr-0 ps-0',
              rightIcon && 'pl-0 pe-0',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
            {...props}
          />

          {rightIcon && (
            <div className="flex items-center justify-center pl-3 text-ink-3 pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>

        {/* Hint or Error */}
        {hint && !error && (
          <span id={hintId} className="text-2xs text-ink-3 px-1">
            {hint}
          </span>
        )}
        {error && (
          <span
            id={errorId}
            className="text-2xs font-bold text-rose px-1 flex items-center gap-1"
            role="alert"
          >
            <span aria-hidden="true">⚠</span>
            <span>{error}</span>
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

/* ─── Textarea (نفس النمط) ──────────────────────────────────── */

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  variant?: InputVariant;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      hint,
      required,
      variant = 'default',
      id,
      disabled,
      rows = 3,
      ...props
    },
    ref
  ) => {
    const inputId =
      id || `textarea-${label?.replace(/\s+/g, '-') || Math.random().toString(36).slice(2, 8)}`;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-bold text-ink-2 flex items-center gap-1"
          >
            <span>{label}</span>
            {required && <span className="text-rose">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          disabled={disabled}
          className={cn(
            'w-full rounded-md transition-base p-3 text-base outline-none resize-y min-h-[80px]',
            'placeholder:text-ink-4 font-medium text-ink',
            VARIANT_CLASSES[variant],
            error
              ? 'border-rose'
              : 'focus:border-emerald focus:shadow-focus',
            disabled && 'opacity-60 cursor-not-allowed bg-paper-2',
            className
          )}
          aria-invalid={!!error}
          {...props}
        />

        {hint && !error && (
          <span className="text-2xs text-ink-3 px-1">{hint}</span>
        )}
        {error && (
          <span
            className="text-2xs font-bold text-rose px-1 flex items-center gap-1"
            role="alert"
          >
            <span aria-hidden="true">⚠</span>
            <span>{error}</span>
          </span>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
