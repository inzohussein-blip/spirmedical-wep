'use client';

import { useState, useTransition } from 'react';
import { adminResetLoginPin } from '../_actions/login-pin';

/** زرُّ «رمز دخولٍ مؤقّت» في صفحتَي المريض والمختصّ — يعرض الرمزَ مرّةً واحدة. */
const btnGhost: React.CSSProperties = {
  width: '100%', padding: '10px', background: 'transparent',
  color: 'var(--ink-2)', border: '1px solid var(--line)', borderRadius: 10,
  fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
};

export default function ResetLoginPinButton({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition();
  const [pin, setPin] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    if (!confirm('سيُستبدل رمزُ دخول هذا الحساب برمزٍ مؤقّت. متابعة؟')) return;
    setError(null);
    startTransition(async () => {
      const res = await adminResetLoginPin(userId);
      if (res.ok) setPin(res.pin);
      else setError(res.error);
    });
  };

  return (
    <div style={{ background: 'var(--white)', borderRadius: 14, padding: 20, marginTop: 16 }}>
      <h2 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 10px' }}>🔑 رمز الدخول</h2>
      {pin ? (
        <div role="status">
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 8 }}>
            أعطِ هذا الرمز لصاحب الحساب. يدخل به برقمه، ثمّ يغيّره من «رمز الدخول».
            لن يُعرض مرّةً أخرى.
          </div>
          <div dir="ltr" style={{ fontSize: 24, fontWeight: 800, letterSpacing: 6, textAlign: 'center' }}>
            {pin}
          </div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 10 }}>
            لمن نسي رمزه: يُنشأ رمزٌ مؤقّت ويُلغى القديم.
          </div>
          <button type="button" onClick={reset} disabled={pending} style={btnGhost}>
            {pending ? 'جارٍ…' : 'إنشاء رمز دخولٍ مؤقّت'}
          </button>
        </>
      )}
      {error && <div role="alert" style={{ background: 'var(--rose-soft)', color: 'var(--rose)', padding: '10px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, marginTop: 10 }}>{error}</div>}
    </div>
  );
}
