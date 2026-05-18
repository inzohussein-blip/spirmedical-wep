'use client';

import { useState, useTransition } from 'react';
import { updateOrderRoleData } from '../actions';
import type { LucideIcon } from 'lucide-react';
import {
  Dumbbell, Search, Home, Save, CheckCircle2,
} from 'lucide-react';

interface SessionData {
  assessment?: string;
  exercises?: string;
  sessions_count?: string;
  homework?: string;
  next_session?: string;
}

export default function SessionPlan({ orderId, initialData }: { orderId: string; initialData: SessionData | null }) {
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
    { key: 'assessment', icon: Search,    label: 'التقييم الأولي' },
    { key: 'exercises',  icon: Dumbbell,  label: 'التمارين المنفّذة' },
    { key: 'homework',   icon: Home,      label: 'تمارين منزلية' },
  ];

  return (
    <div style={{ marginTop: 16 }}>
      <div className="scr-section-head">
        <div className="scr-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Dumbbell size={16} strokeWidth={2.2} />
          خطة الجلسة
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>عدد الجلسات</label>
            <input
              type="text"
              value={data.sessions_count ?? ''}
              onChange={(e) => setData({ ...data, sessions_count: e.target.value })}
              placeholder="10 جلسات"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>الجلسة التالية</label>
            <input
              type="text"
              value={data.next_session ?? ''}
              onChange={(e) => setData({ ...data, next_session: e.target.value })}
              placeholder="بعد يومين"
              style={inputStyle}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="scr-empty-cta"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%' }}
        >
          <Save size={16} strokeWidth={2.2} />
          {isPending ? 'جارٍ الحفظ...' : 'حفظ الخطة'}
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
