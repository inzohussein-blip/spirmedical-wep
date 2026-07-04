'use client';

import { useState, useTransition } from 'react';
import { Bug, X, Send, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from '@/components/ui/Toaster';
import { reportBug } from '@/app/admin/bugs/actions';

/**
 * ═══════════════════════════════════════════════════════════════
 * 🐛 BugReportButton (V25.14)
 * ═══════════════════════════════════════════════════════════════
 *
 * زر عائم في dashboard يسمح للمستخدم بالإبلاغ عن عطل.
 * يفتح modal بسيط مع form سريع.
 *
 * Usage:
 *   <BugReportButton />  // داخل dashboard layout
 * ═══════════════════════════════════════════════════════════════
 */

export default function BugReportButton() {
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'critical' | 'high' | 'medium' | 'low'>('medium');

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) {
      toast.error('العنوان والوصف مطلوبان');
      return;
    }

    startTransition(async () => {
      const r = await reportBug({
        title: title.trim(),
        description: description.trim(),
        severity,
        page_url: typeof window !== 'undefined' ? window.location.href : null,
      });

      if (r.success) {
        toast.success('شكراً! وصلنا تقريرك ✓');
        setTitle('');
        setDescription('');
        setSeverity('medium');
        setShowModal(false);
      } else {
        toast.error(r.error || 'فشل الإرسال');
      }
    });
  };

  return (
    <>
      {/* Floating button */}
      {!showModal && (
        <button
          type="button"
          onClick={() => setShowModal(true)}
          aria-label="الإبلاغ عن عطل"
          style={{
            position: 'fixed',
            bottom: 90,
            insetInlineEnd: 16,
            width: 48,
            height: 48,
            background: 'var(--rose)',
            color: 'var(--paper-3)',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            boxShadow: '0 4px 16px rgba(217, 89, 76, 0.4)',
          }}
        >
          <Bug size={20} />
        </button>
      )}

      {/* Modal */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--paper)',
              width: '100%',
              maxWidth: 440,
              borderRadius: 16,
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'var(--rose-soft)', color: 'var(--rose)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Bug size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>
                  الإبلاغ عن عطل
                </h3>
                <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: '2px 0 0' }}>
                  تقريرك يساعدنا في تحسين التطبيق
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                aria-label="إغلاق"
                style={{
                  width: 32, height: 32, background: 'var(--paper-3)', border: 'none',
                  borderRadius: '50%', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Severity */}
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>مستوى الخطورة *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                {([
                  { id: 'low' as const,      label: 'بسيط',  emoji: '🔵' },
                  { id: 'medium' as const,   label: 'متوسط', emoji: '🟡' },
                  { id: 'high' as const,     label: 'مهم',   emoji: '🟠' },
                  { id: 'critical' as const, label: 'حرج',   emoji: '🔴' },
                ]).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSeverity(s.id)}
                    style={{
                      padding: 8,
                      background: severity === s.id ? 'var(--emerald-soft)' : 'var(--white)',
                      border: '2px solid',
                      borderColor: severity === s.id ? 'var(--emerald)' : 'var(--line)',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    <div style={{ fontSize: 16 }}>{s.emoji}</div>
                    <div style={{ marginTop: 2 }}>{s.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>عنوان مختصر *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثلاً: زر الحجز لا يعمل"
                style={inputStyle}
                maxLength={100}
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>الوصف التفصيلي *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ماذا حدث؟ ما الذي توقّعته؟ متى يحدث؟"
                rows={4}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                maxLength={500}
              />
              <div style={{ fontSize: 9, color: 'var(--ink-3)', marginTop: 2, textAlign: 'end' }}>
                {description.length}/500
              </div>
            </div>

            {/* Info */}
            <div style={{
              background: 'var(--amber-soft)',
              borderRadius: 8,
              padding: 10,
              fontSize: 10,
              color: 'var(--ink-2)',
              marginBottom: 14,
              display: 'flex',
              gap: 6,
              alignItems: 'flex-start',
            }}>
              <AlertTriangle size={14} color="var(--amber)" style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                سنُسجّل تلقائياً: الصفحة الحالية، نوع المتصفّح، والجهاز
                لمساعدتنا في تشخيص العطل.
              </span>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1, padding: 12, background: 'var(--paper-3)', color: 'var(--ink-2)',
                  border: '1px solid var(--line)', borderRadius: 10, cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                }}
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending || !title.trim() || !description.trim()}
                style={{
                  flex: 2, padding: 12,
                  background: (title.trim() && description.trim()) ? 'var(--rose)' : 'var(--paper-3)',
                  color: (title.trim() && description.trim()) ? 'var(--paper-3)' : 'var(--ink-3)',
                  border: 'none', borderRadius: 10,
                  cursor: isPending || !title.trim() || !description.trim() ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', fontSize: 13, fontWeight: 900,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                {isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                إرسال
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--ink-3)',
  display: 'block', marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid var(--line)',
  borderRadius: 10, fontSize: 13, fontFamily: 'inherit', background: 'var(--white)',
};
