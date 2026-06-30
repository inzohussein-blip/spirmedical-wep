'use client';

import { useEffect, useState } from 'react';
import { verifyOtp, resendOtp } from '../login/actions';

const RESEND_COOLDOWN_SECONDS = 60;

interface OtpFormProps {
  phone: string;
  channel: 'whatsapp' | 'telegram' | 'sms';
  redirectTo?: string;
}

/**
 * نموذج إدخال OTP + إعادة إرسال مع عدّاد تنازلي.
 * - يحافظ على القناة المختارة عند إعادة الإرسال (action=otp).
 * - يمنع إعادة الإرسال المتكرّر خلال 60 ثانية.
 */
export default function OtpForm({ phone, channel, redirectTo }: OtpFormProps) {
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const canResend = cooldown <= 0;

  return (
    <>
      <form action={verifyOtp} className="auth-form">
        <input type="hidden" name="phone" value={phone} />
        <input type="hidden" name="channel" value={channel} />
        {redirectTo && <input type="hidden" name="redirect" value={redirectTo} />}

        <label
          htmlFor="token"
          className="auth-field-label"
          style={{ position: 'absolute', left: '-9999px' }}
        >
          رمز التحقق
        </label>
        <input
          id="token"
          type="text"
          name="token"
          className="auth-otp-input"
          placeholder="000000"
          inputMode="numeric"
          maxLength={6}
          minLength={6}
          pattern="\d{6}"
          required
          autoComplete="one-time-code"
          autoFocus
        />

        <button type="submit" className="auth-cta">
          تحقّق وادخل ←
        </button>
      </form>

      <form action={resendOtp} className="auth-helper">
        <input type="hidden" name="phone" value={phone} />
        <input type="hidden" name="channel" value={channel} />
        <input type="hidden" name="action" value="otp" />
        {redirectTo && <input type="hidden" name="redirect" value={redirectTo} />}

        {canResend ? (
          <>
            لم يصلك الرمز؟{' '}
            <button type="submit" className="auth-inline-link auth-resend-btn">
              إعادة الإرسال
            </button>
          </>
        ) : (
          <span>
            يمكنك إعادة الإرسال خلال{' '}
            <strong className="auth-resend-count">{cooldown}</strong> ثانية
          </span>
        )}
      </form>
    </>
  );
}
