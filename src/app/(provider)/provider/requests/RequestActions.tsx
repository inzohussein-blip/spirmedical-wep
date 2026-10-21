'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { BOOKING_ACTIONS, RESERVATION_ACTIONS } from '@/lib/provider-listings';
import { updateBooking, updateReservation } from './actions';

type Result = { ok: boolean; message: string };

/** أزرارُ الأفعال المسموحة من الحالة الحاليّة — والاعتذارُ يطلب سبباً يراه المريض */
export default function RequestActions({ kind, id, status }: { kind: 'reservation' | 'booking'; id: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<Result | null>(null);
  const table = kind === 'reservation' ? RESERVATION_ACTIONS : BOOKING_ACTIONS;
  const allowed = Object.entries(table).filter(([, a]) => (a.from as readonly string[]).includes(status));
  if (allowed.length === 0) return null;

  const run = (action: string) => {
    const refusing = action === 'cancel' || action === 'decline';
    const reason = refusing ? window.prompt('سببُ الاعتذار (يراه المريض):')?.trim() : undefined;
    if (refusing && !reason) return;
    start(async () => {
      const r = kind === 'reservation' ? await updateReservation(id, action, { reason }) : await updateBooking(id, action, reason);
      setMsg(r);
      if (r.ok) router.refresh();
    });
  };

  return (
    <div className="pv-actions">
      {allowed.map(([action, a]) => (
        <button
          key={action}
          type="button"
          className={action === 'cancel' || action === 'decline' ? 'pv-btn pv-btn-ghost pv-btn-sm' : 'pv-btn pv-btn-sm'}
          disabled={pending}
          onClick={() => run(action)}
        >
          {a.label}
        </button>
      ))}
      {msg && <p className={msg.ok ? 'pv-ok' : 'pv-err'} role="status">{msg.message}</p>}
    </div>
  );
}
