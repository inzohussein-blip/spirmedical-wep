'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/Toaster';

type Status = 'open' | 'responding' | 'resolved' | 'false_alarm';

const ACTIONS: Record<Status, Array<{ next: Status; label: string; bg: string }>> = {
  open: [
    { next: 'responding', label: 'بدء الاستجابة', bg: 'var(--amber)' },
    { next: 'false_alarm', label: 'إنذار كاذب', bg: 'var(--ink-3)' },
  ],
  responding: [
    { next: 'resolved', label: 'تم الحل', bg: 'var(--emerald)' },
    { next: 'false_alarm', label: 'إنذار كاذب', bg: 'var(--ink-3)' },
  ],
  resolved: [],
  false_alarm: [],
};

export default function EmergencyActions({ id, status }: { id: string; status: Status }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const update = async (next: Status) => {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/emergency-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: next }),
      });
      if (res.ok) {
        toast.success('تم التحديث');
        router.refresh();
      } else {
        toast.error('فشل التحديث');
      }
    } catch {
      toast.error('خطأ في الاتصال');
    } finally {
      setBusy(false);
    }
  };

  const actions = ACTIONS[status];
  if (actions.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
      {actions.map((a) => (
        <button
          key={a.next}
          type="button"
          disabled={busy}
          onClick={() => update(a.next)}
          style={{
            background: a.bg,
            color: 'var(--paper-3)',
            border: 'none',
            borderRadius: 12,
            padding: '10px 18px',
            fontSize: 13,
            fontWeight: 800,
            cursor: busy ? 'default' : 'pointer',
            opacity: busy ? 0.6 : 1,
            fontFamily: 'inherit',
          }}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
