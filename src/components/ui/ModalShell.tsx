'use client';

import { type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useModalDialog } from '@/lib/hooks/useModalDialog';

/**
 * غلافُ النوافذ المنبثقة: ورقةٌ من الأسفل على الهاتف (قريبةٌ من الإبهام،
 * وارتفاعُها بـdvh فلا يختفي أسفلُها خلف شريط المتصفّح)، ونافذةٌ وسطى على
 * الشاشات الواسعة. السلوكُ (Escape، قفل التمرير، التركيز) من useModalDialog.
 * التنسيق في shared.css تحت .ms-*.
 */
export default function ModalShell({
  onClose,
  labelledBy,
  children,
  maxWidth = 480,
}: {
  onClose: () => void;
  /** معرّفُ عنوان النافذة — يُقرأ اسماً لها */
  labelledBy: string;
  children: ReactNode;
  maxWidth?: number;
}) {
  const ref = useModalDialog(true, onClose);
  return (
    <div className="ms-backdrop" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="ms-panel"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/** زرّ الإغلاق: 44px ومُسمّى — كان ✕ بحجم 22px بلا اسمٍ تقرؤه قارئات الشاشة. */
export function ModalCloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="ms-close" onClick={onClick} aria-label="إغلاق">
      <X size={22} strokeWidth={2.2} aria-hidden />
    </button>
  );
}
