'use client';

import { useState, useTransition } from 'react';
import { setAutoRejectHours } from './auto-reject-actions';

export default function AutoRejectClient({ initialHours }: { initialHours: number }) {
  const [hours, setHours] = useState(String(initialHours));
  const [saved, setSaved] = useState(initialHours);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const parsed = Number(hours);
  const valid = Number.isInteger(parsed) && parsed >= 0 && parsed <= 24 * 365;
  const dirty = valid && parsed !== saved;

  function save() {
    if (!dirty) return;
    startTransition(async () => {
      const res = await setAutoRejectHours(parsed);
      if (!res.ok) {
        setMsg({ kind: 'err', text: res.error ?? 'تعذّر الحفظ' });
        return;
      }
      setSaved(parsed);
      setMsg({
        kind: 'ok',
        text: parsed === 0
          ? 'أُوقف الرفض التلقائيّ — تبقى الطلبات معلَّقةً حتى يتدخّل أحد'
          : `يُرفض الطلب المعلَّق غير المُسنَد بعد ${parsed} ساعة`,
      });
    });
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0, lineHeight: 1.7 }}>
        الطلب الذي يبقى <strong>معلَّقاً بلا إسناد</strong> هذه المدّة يُلغى
        تلقائياً <strong>ويصل المريضَ إشعار</strong>. ولا يُمسّ ما هو مؤكَّدٌ أو
        قيد التنفيذ، ولا طلبات الطوارئ.
      </p>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <label htmlFor="auto-reject-hours" style={{ fontSize: 13, fontWeight: 700 }}>
          المدّة بالساعات
        </label>
        <input
          id="auto-reject-hours"
          type="number"
          min={0}
          max={24 * 365}
          step={1}
          inputMode="numeric"
          value={hours}
          onChange={(e) => { setHours(e.target.value); setMsg(null); }}
          style={{
            minHeight: 44, width: 120, padding: '0 12px', fontSize: 14, fontWeight: 700,
            borderRadius: 10, border: `1px solid ${valid ? 'var(--line)' : '#F5B4B4'}`,
            background: 'var(--white)', color: 'var(--ink-1)',
          }}
        />
        <button
          type="button"
          onClick={save}
          disabled={!dirty || pending}
          style={{
            minHeight: 44, padding: '0 18px', fontSize: 13, fontWeight: 800, borderRadius: 10,
            border: 'none', cursor: dirty && !pending ? 'pointer' : 'not-allowed',
            opacity: dirty && !pending ? 1 : 0.5,
            background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-fg)',
          }}
        >
          {pending ? '…يُحفظ' : 'حفظ'}
        </button>
        <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
          صفرٌ يوقف الرفض التلقائيّ
        </span>
      </div>

      {msg && (
        <div
          role="status"
          style={{
            padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            background: msg.kind === 'ok' ? '#E7F5EF' : '#FCEBEB',
            color: msg.kind === 'ok' ? '#0B5B45' : '#791F1F',
            border: `1px solid ${msg.kind === 'ok' ? '#B6E0CF' : '#F5B4B4'}`,
          }}
        >
          {msg.text}
        </div>
      )}
    </div>
  );
}
