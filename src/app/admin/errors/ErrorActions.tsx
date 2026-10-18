'use client';

import { useState, useTransition } from 'react';
import { purgeOldResolved, resolveAllOpen, setErrorResolved, type ErrorActionResult } from './actions';

/** زرُّ صفٍّ واحد: «تمّ الحلّ» أو «إعادة فتح» */
export function ResolveButton({ id, resolved }: { id: string; resolved: boolean }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<ErrorActionResult | null>(null);
  return (
    <span className="err-act">
      <button
        type="button"
        className={resolved ? 'err-btn' : 'err-btn err-btn-primary'}
        disabled={pending}
        onClick={() => start(async () => setMsg(await setErrorResolved(id, !resolved)))}
      >
        {pending ? '…' : resolved ? 'إعادة فتح' : 'تمّ الحلّ'}
      </button>
      {msg && !msg.ok && <span className="err-msg" role="status">{msg.message}</span>}
    </span>
  );
}

/** «حلُّ كلّ المفتوح» للمصدر المعروض، وحذفُ المحلول القديم */
export function BulkActions({ source, openCount }: { source: string | null; openCount: number }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<ErrorActionResult | null>(null);
  return (
    <div className="err-bulk">
      <button
        type="button"
        className="err-btn"
        disabled={pending || openCount === 0}
        onClick={() => {
          if (!window.confirm(`تعليمُ ${openCount} خطأً مفتوحاً محلولاً؟ ما يتكرّر منها يُفتح من جديد تلقائياً.`)) return;
          start(async () => setMsg(await resolveAllOpen(source)));
        }}
      >
        حلُّ كلّ المفتوح{source ? ' هنا' : ''}
      </button>
      <button
        type="button"
        className="err-btn"
        disabled={pending}
        onClick={() => start(async () => setMsg(await purgeOldResolved()))}
      >
        حذفُ المحلول الأقدم من 30 يوماً
      </button>
      {msg && <span className={msg.ok ? 'err-ok' : 'err-msg'} role="status">{msg.message}</span>}
    </div>
  );
}
