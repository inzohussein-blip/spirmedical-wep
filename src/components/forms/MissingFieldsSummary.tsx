'use client';

import { AlertTriangle } from 'lucide-react';

/**
 * صندوق «الحقول الناقصة» — مشترك بين تدفّقات رفع الطلبات.
 * مكتفٍ ذاتياً (styled-jsx + توكنز --rose) فيعمل داخل أي نظام تنسيق.
 */
interface Props {
  /** الحقول الناقصة مرتّبة */
  fields: string[];
  /** تسمية عربية لكل مفتاح حقل */
  labels: Record<string, string>;
  /** رسالة الخطأ لكل حقل (تظهر كتلميح صغير) */
  errors: Record<string, string>;
  /** عند النقر على بند: يمرّر/يركّز على الحقل */
  onJump: (field: string) => void;
  title?: string;
}

export default function MissingFieldsSummary({
  fields,
  labels,
  errors,
  onJump,
  title = 'لإتمام الطلب، أكمل هذه الحقول:',
}: Props) {
  if (fields.length === 0) return null;

  return (
    <div className="ffs" role="alert">
      <div className="ffs-head">
        <AlertTriangle size={14} strokeWidth={2.6} aria-hidden />
        <span>{title}</span>
      </div>
      <div className="ffs-chips">
        {fields.map((f) => (
          <button
            key={f}
            type="button"
            className="ffs-chip"
            onClick={() => onJump(f)}
          >
            {labels[f] || f}
            {errors[f] && <span className="ffs-chip-hint">{errors[f]}</span>}
          </button>
        ))}
      </div>

      <style jsx>{`
        .ffs {
          background: var(--rose-soft, #FCE8E6);
          border: 1px solid var(--rose, #A82E3D);
          border-radius: 12px;
          padding: 10px 12px;
          margin-bottom: 10px;
        }
        .ffs-head {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--rose, #A82E3D);
          font-size: 12px;
          font-weight: 800;
          margin-bottom: 8px;
        }
        .ffs-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .ffs-chip {
          display: inline-flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 1px;
          padding: 6px 11px;
          background: var(--white, #FFFFFF);
          border: 1px solid var(--rose, #A82E3D);
          border-radius: 10px;
          font-size: 12px;
          font-weight: 800;
          color: var(--rose, #A82E3D);
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
          text-align: start;
        }
        .ffs-chip:hover {
          background: var(--rose, #A82E3D);
          color: var(--white, #FFFFFF);
          transform: translateY(-1px);
        }
        .ffs-chip-hint {
          font-size: 9px;
          font-weight: 600;
          opacity: 0.85;
        }
      `}</style>
    </div>
  );
}
