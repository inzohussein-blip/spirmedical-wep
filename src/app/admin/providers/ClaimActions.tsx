'use client';

import { useState, useTransition } from 'react';
import { approveListingClaim, rejectListingClaim, type ProviderActionResult } from './actions';

export default function ClaimActions({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<ProviderActionResult | null>(null);
  const run = (f: () => Promise<ProviderActionResult>) => start(async () => setMsg(await f()));
  return (
    <span className="err-act">
      <button type="button" className="err-btn err-btn-primary" disabled={pending} onClick={() => run(() => approveListingClaim(id))}>
        اعتماد الربط
      </button>
      <button
        type="button"
        className="err-btn"
        disabled={pending}
        onClick={() => {
          const reason = window.prompt('سببُ الرفض (يراه صاحبُ الحساب):');
          if (reason) run(() => rejectListingClaim(id, reason));
        }}
      >
        رفض
      </button>
      {msg && <span className={msg.ok ? 'err-ok' : 'err-msg'} role="status">{msg.message}</span>}
    </span>
  );
}
