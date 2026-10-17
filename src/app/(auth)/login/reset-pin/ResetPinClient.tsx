'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { completePinReset, startPinReset } from './actions';
import { displayPhone } from '@/lib/whatsapp/share';

import EmojiIcon from '@/components/ui/EmojiIcon';
type Started = { id: string; code: string; link: string; number: string; expiresAt: string };
type Step = 'phone' | 'waiting' | 'pin';

const POLL_MS = 2000;

/**
 * ثلاثُ خطوات: الرقم ← «أرسل عبر واتساب» (والصفحةُ تنتظر وحدها) ← رمزٌ جديد.
 * الانتظارُ بالسؤال كلَّ ثانيتين (`/api/whatsapp/verify/<id>`) — لا WebSockets على Vercel.
 */
export default function ResetPinClient({ initialPhone }: { initialPhone: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState(initialPhone);
  const [started, setStarted] = useState<Started | null>(null);
  const [expired, setExpired] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const pinRef = useRef<HTMLInputElement>(null);

  // انتظارُ وصول الرسالة + العدّ التنازليّ
  useEffect(() => {
    if (step !== 'waiting' || !started) return;
    let stopped = false;
    const tick = () => {
      const left = Math.max(0, Math.round((new Date(started.expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(left);
    };
    const clock = setInterval(tick, 1000);
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/whatsapp/verify/${started.id}`, { cache: 'no-store' });
        const { state } = (await res.json()) as { state: string };
        if (stopped) return;
        if (state === 'verified') {
          setStep('pin');
        } else if (state === 'expired') {
          setExpired(true);
        }
      } catch {
        /* انقطاعٌ عابر — المحاولةُ التالية بعد ثانيتين */
      }
    }, POLL_MS);
    return () => {
      stopped = true;
      clearInterval(clock);
      clearInterval(poll);
    };
  }, [step, started]);

  useEffect(() => {
    if (step === 'pin') pinRef.current?.focus();
  }, [step]);

  function begin() {
    setError(null);
    setExpired(false);
    startTransition(async () => {
      const r = await startPinReset(phone);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setStarted(r);
      setSecondsLeft(Math.round((new Date(r.expiresAt).getTime() - Date.now()) / 1000));
      setStep('waiting');
    });
  }

  function finish(e: React.FormEvent) {
    e.preventDefault();
    if (!started) return;
    setError(null);
    startTransition(async () => {
      const r = await completePinReset(started.id, pin, confirm);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.replace(r.redirectTo);
    });
  }

  return (
    <div className="auth-form" aria-live="polite">
      {error && (
        <div className="auth-error" role="alert">
          <div className="auth-error-icon">!</div>
          <span>{error}</span>
        </div>
      )}

      {step === 'phone' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            begin();
          }}
        >
          <div className="auth-field">
            <label htmlFor="phone" className="auth-field-label">رقم هاتفك المسجّل</label>
            <div className="auth-phone-wrap">
              <div className="auth-phone-prefix">
                <span aria-hidden="true">🇮🇶</span>
                <span>+964</span>
              </div>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="07XX XXX XXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                required
              />
            </div>
          </div>
          <button type="submit" className="auth-cta" disabled={isPending || phone.length < 10}>
            {isPending ? 'جارٍ التحضير…' : 'متابعة ←'}
          </button>
        </form>
      )}

      {step === 'waiting' && started && (
        <div className="wa-verify">
          {!expired ? (
            <>
              <p className="wa-verify-lead">
                اضغط الزرّ، وسيفتح واتساب برسالةٍ جاهزة إلى رقمنا — <strong>اضغط «إرسال» فقط</strong>.
              </p>
              <a className="wa-verify-btn" href={started.link} target="_blank" rel="noopener noreferrer">
                <span aria-hidden="true"><EmojiIcon e="💬" /></span>
                <span>أرسل الرمز عبر واتساب</span>
              </a>
              <div className="wa-verify-wait" role="status">
                <span className="wa-verify-dot" aria-hidden="true" />
                <span>ننتظر رسالتك… ({Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')})</span>
              </div>
              <details className="wa-verify-manual">
                <summary>لا يفتح واتساب؟</summary>
                <p>
                  أرسل من رقمك <bdi dir="ltr">{displayPhone(phone)}</bdi> الرمزَ{' '}
                  <strong dir="ltr">{started.code}</strong> إلى الرقم{' '}
                  <bdi dir="ltr">{displayPhone(started.number)}</bdi> على واتساب.
                </p>
              </details>
            </>
          ) : (
            <>
              <p className="wa-verify-lead">انتهت صلاحيةُ الرمز قبل وصول الرسالة.</p>
              <button type="button" className="auth-cta" onClick={begin} disabled={isPending}>
                رمزٌ جديد
              </button>
            </>
          )}
          <button
            type="button"
            className="auth-link auth-link--muted"
            onClick={() => {
              setStep('phone');
              setStarted(null);
            }}
          >
            تغيير الرقم
          </button>
        </div>
      )}

      {step === 'pin' && (
        <form onSubmit={finish}>
          <div className="wa-verify-ok" role="status"><EmojiIcon e="✓" /> تأكّدنا أنّ الرقم لك</div>
          <div className="auth-field">
            <label htmlFor="pin" className="auth-field-label">رمز الدخول الجديد</label>
            <input
              id="pin"
              ref={pinRef}
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              placeholder="6 أرقام"
              maxLength={6}
              className="auth-input"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="confirm" className="auth-field-label">أعد كتابة الرمز</label>
            <input
              id="confirm"
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              maxLength={6}
              className="auth-input"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value.replace(/\D/g, ''))}
              required
            />
          </div>
          <button type="submit" className="auth-cta" disabled={isPending || pin.length !== 6}>
            {isPending ? 'جارٍ الحفظ…' : 'حفظ الرمز والدخول'}
          </button>
        </form>
      )}
    </div>
  );
}
