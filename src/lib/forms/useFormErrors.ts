'use client';

import { useRef, useState, useCallback } from 'react';

/**
 * ════════════════════════════════════════════════════════════════════
 * useFormErrors — إدارة أخطاء الحقول (محايد التنسيق، قابل لإعادة الاستخدام)
 * ════════════════════════════════════════════════════════════════════
 *
 * يعمّم النمط الذي بُني في BloodDrawFlow لتشاركه بقيّة تدفّقات «رفع الطلبات»
 * رغم اختلاف أنظمة تنسيقها (styled-jsx / inline). منطق فقط، بلا JSX/CSS.
 *
 * الاستعمال:
 *   const fe = useFormErrors(['procedure', 'address', 'phone', 'date']);
 *   <div ref={fe.registerRef('address')} className={fe.hasError('address') ? 'error' : ''}>
 *   ...
 *   const { ok, fieldErrors } = validateNursing(...);
 *   if (!ok) { fe.setErrors(fieldErrors); fe.focusFirst(); return; }
 * ════════════════════════════════════════════════════════════════════
 */

export type FieldErrors = Record<string, string>;

export interface UseFormErrors {
  fieldErrors: FieldErrors;
  setFieldErrors: React.Dispatch<React.SetStateAction<FieldErrors>>;
  /** يستبدل كل الأخطاء دفعة واحدة */
  setErrors: (errors: FieldErrors) => void;
  /** يمسح خطأ حقل واحد (يُستدعى عند التعديل) */
  clearError: (field: string) => void;
  /** يمسح كل الأخطاء */
  clearAll: () => void;
  hasError: (field: string) => boolean;
  /** الحقول التي بها خطأ حالياً، مرتّبة حسب `order` المُمرّر للهوك */
  missingFields: string[];
  /** ref callback لتسجيل عنصر الحقل (للتمرير/التركيز) */
  registerRef: (field: string) => (el: HTMLElement | null) => void;
  /** يمرّر ويركّز على حقل بعينه */
  jumpTo: (field: string) => void;
  /** يمرّر ويركّز على أوّل حقل خاطئ حسب الترتيب */
  focusFirst: (errors?: FieldErrors) => void;
}

export function useFormErrors(order: string[] = []): UseFormErrors {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const refs = useRef<Record<string, HTMLElement | null>>({});

  const registerRef = useCallback(
    (field: string) => (el: HTMLElement | null) => {
      refs.current[field] = el;
    },
    [],
  );

  const setErrors = useCallback((errors: FieldErrors) => {
    setFieldErrors(errors);
  }, []);

  const clearError = useCallback((field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const clearAll = useCallback(() => setFieldErrors({}), []);

  const hasError = useCallback(
    (field: string) => !!fieldErrors[field],
    [fieldErrors],
  );

  const jumpTo = useCallback((field: string) => {
    const el = refs.current[field];
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // تأخير بسيط ليكتمل التمرير قبل التركيز
    setTimeout(() => {
      if (typeof (el as HTMLElement & { focus?: () => void }).focus === 'function') {
        (el as HTMLInputElement).focus({ preventScroll: true });
      }
    }, 300);
  }, []);

  const focusFirst = useCallback(
    (errors?: FieldErrors) => {
      const errs = errors ?? fieldErrors;
      const pool = order.length > 0 ? order : Object.keys(errs);
      const first = pool.find((f) => errs[f]);
      if (first) jumpTo(first);
    },
    [fieldErrors, order, jumpTo],
  );

  const missingFields =
    order.length > 0
      ? order.filter((f) => fieldErrors[f])
      : Object.keys(fieldErrors);

  return {
    fieldErrors,
    setFieldErrors,
    setErrors,
    clearError,
    clearAll,
    hasError,
    missingFields,
    registerRef,
    jumpTo,
    focusFirst,
  };
}
