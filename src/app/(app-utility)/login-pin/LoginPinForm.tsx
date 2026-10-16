'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { changeLoginPin } from './actions';

export default function LoginPinForm({ homePath, hasPin }: { homePath: string; hasPin: boolean }) {
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await changeLoginPin(pin, confirm);
      if (res.ok) setDone(true);
      else setError(res.error ?? 'تعذّر الحفظ');
    });
  };

  if (done) {
    return (
      <div role="status" className="scr-empty">
        <div className="scr-empty-icon" aria-hidden="true">✅</div>
        <p className="scr-empty-title">حُفظ رمز الدخول</p>
        <p className="scr-empty-desc">ادخل به من الآن مع رقم هاتفك.</p>
        <Link href={homePath} className="scr-empty-cta">متابعة</Link>
      </div>
    );
  }

  const digits = (v: string) => v.replace(/\D/g, '').slice(0, 6);

  return (
    <form onSubmit={submit} className="auth-form" noValidate>
      <p className="scr-page-subtitle">
        {hasPin ? 'اختر رمزاً جديداً من 6 أرقام.' : 'اختر رمزاً من 6 أرقام لتدخل به مع رقم هاتفك.'}
      </p>
      <div className="auth-field">
        <label htmlFor="new-pin" className="auth-field-label">الرمز الجديد</label>
        <input
          id="new-pin" type="password" inputMode="numeric" autoComplete="new-password"
          maxLength={6} placeholder="6 أرقام" className="auth-input"
          value={pin} onChange={(e) => setPin(digits(e.target.value))}
        />
      </div>
      <div className="auth-field">
        <label htmlFor="confirm-pin" className="auth-field-label">أعد كتابة الرمز</label>
        <input
          id="confirm-pin" type="password" inputMode="numeric" autoComplete="new-password"
          maxLength={6} placeholder="6 أرقام" className="auth-input"
          value={confirm} onChange={(e) => setConfirm(digits(e.target.value))}
        />
      </div>
      {error && <div role="alert" className="auth-error"><div className="auth-error-icon">!</div><span>{error}</span></div>}
      <button type="submit" className="auth-cta" disabled={pending}>
        {pending ? 'جارٍ الحفظ…' : 'حفظ الرمز'}
      </button>
    </form>
  );
}
