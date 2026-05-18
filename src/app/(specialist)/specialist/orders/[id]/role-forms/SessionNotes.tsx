'use client';

import { useState, useTransition } from 'react';
import { updateOrderRoleData } from '../actions';
import type { LucideIcon } from 'lucide-react';
import {
  Lock, Brain, Smile, MessageSquare, Wrench, FileText, Save, CheckCircle2,
} from 'lucide-react';

interface SessionData {
  mood_assessment?: string;
  topics_discussed?: string;
  techniques_used?: string;
  homework?: string;
  notes_confidential?: string;
}

export default function SessionNotes({ orderId, initialData }: { orderId: string; initialData: SessionData | null }) {
  const [data, setData] = useState<SessionData>(initialData ?? {});
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: '1px solid var(--line)',
    borderRadius: 10, fontSize: 13, fontFamily: 'inherit', resize: 'vertical',
  };

  function handleSave() {
    startTransition(async () => {
      const result = await updateOrderRoleData(orderId, 'session_plan', data);
      if (result.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2500);
      }
    });
  }

  const fields: Array<{ key: keyof SessionData; label: string; icon: LucideIcon }> = [
    { key: 'mood_assessment',     icon: Smile,         label: 'تقييم الحالة المزاجية' },
    { key: 'topics_discussed',    icon: MessageSquare, label: 'المواضيع التي نوقشت' },
    { key: 'techniques_used',     icon: Wrench,        label: 'التقنيات المستخدمة' },
    { key: 'homework',            icon: FileText,      label: 'الواجب البيتي' },
    { key: 'notes_confidential',  icon: Lock,          label: 'ملاحظات سرية' },
  ];

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ background: 'var(--paper-3)', padding: 12, borderRadius: 10, marginBottom: 12, fontSize: 11, color: 'var(--ink-3)', display: 'flex', gap: 8, alignItems: 'center' }}>
        <Lock size={14} strokeWidth={2.2} aria-hidden />
        <span>ملاحظاتك سرية تماماً. لن يراها أحد غيرك ومدير النظام.</span>
      </div>

      <div className="scr-section-head">
        <div className="scr-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Brain size={16} strokeWidth={2.2} />
          ملاحظات الجلسة النفسية
        </div>
      </div>
      <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 14, padding: 16 }}>
        {fields.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.key} style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <Icon size={12} strokeWidth={2.2} aria-hidden />
                {f.label}
              </label>
              <textarea
                value={data[f.key] ?? ''}
                onChange={(e) => setData({ ...data, [f.key]: e.target.value })}
                rows={2}
                style={inputStyle}
              />
            </div>
          );
        })}

        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="scr-empty-cta"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%' }}
        >
          <Save size={16} strokeWidth={2.2} />
          {isPending ? 'جارٍ الحفظ...' : 'حفظ الجلسة'}
        </button>
        {success && (
          <div style={{ background: 'var(--emerald-soft)', color: 'var(--emerald-deep)', padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, marginTop: 8, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <CheckCircle2 size={14} strokeWidth={2.4} />
            تم الحفظ
          </div>
        )}
      </div>
    </div>
  );
}
