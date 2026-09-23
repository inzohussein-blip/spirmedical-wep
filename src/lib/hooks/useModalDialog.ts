'use client';

import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * سلوكُ النافذة المنبثقة كاملاً، لتُعلنه كلُّ نافذةٍ بسطرٍ واحد:
 *   - Escape يُغلق.
 *   - الصفحةُ خلفها لا تتمرّر (كان التمريرُ داخل النافذة على الهاتف يبلغ
 *     نهايتها ثمّ يُمرّر الصفحةَ تحتها).
 *   - التركيزُ ينتقل إلى النافذة نفسها — لا إلى أوّل حقل، كي لا تنبثق لوحةُ
 *     المفاتيح فوق نصف الشاشة قبل أن يقرأ المريضُ شيئاً — ويبقى داخلها مع
 *     Tab، ثمّ يعود إلى الزرّ الذي فتحها عند الإغلاق.
 *
 * يُعيد مرجعاً يوضع على عنصر النافذة (ذي role="dialog").
 */
export function useModalDialog<T extends HTMLElement = HTMLDivElement>(
  open: boolean,
  onClose: () => void,
) {
  const ref = useRef<T>(null);
  // المرجعُ لا الدالّة في الاعتماديات: كثيرٌ من المستدعين يمرّرون سهماً
  // جديداً كلَّ عرض، فكان الأثرُ سيُعاد فيسرق التركيزَ من حقلٍ يُكتب فيه.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const node = ref.current;
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    if (node) {
      if (!node.hasAttribute('tabindex')) node.setAttribute('tabindex', '-1');
      node.focus({ preventScroll: true });
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !node) return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.getClientRects().length > 0,
      );
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === node)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, [open]);

  return ref;
}
