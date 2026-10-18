'use client';

import { useState, useTransition } from 'react';
import { PROVIDER_META, PROVIDER_TYPES } from '@/lib/providers';
import { approveProvider, changeProviderType, rejectProvider, type ProviderActionResult } from './actions';

export default function ProviderActions({ id, status, type }: { id: string; status: string; type: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<ProviderActionResult | null>(null);
  const run = (f: () => Promise<ProviderActionResult>) => start(async () => setMsg(await f()));
  return (
    <span className="err-act">
      {status !== 'approved' && (
        <button type="button" className="err-btn err-btn-primary" disabled={pending} onClick={() => run(() => approveProvider(id))}>
          اعتماد
        </button>
      )}
      {status !== 'rejected' && (
        <button
          type="button"
          className="err-btn"
          disabled={pending}
          onClick={() => {
            const reason = window.prompt('سببُ الرفض (يراه صاحبُ الحساب):');
            if (reason) run(() => rejectProvider(id, reason));
          }}
        >
          رفض
        </button>
      )}
      <select
        className="err-btn"
        aria-label="نوع الخدمة"
        value={type}
        disabled={pending}
        onChange={(e) => run(() => changeProviderType(id, e.target.value))}
      >
        {PROVIDER_TYPES.map((t) => <option key={t} value={t}>{PROVIDER_META[t].label}</option>)}
      </select>
      {msg && <span className={msg.ok ? 'err-ok' : 'err-msg'} role="status">{msg.message}</span>}
    </span>
  );
}
