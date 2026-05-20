// تعطيل pre-rendering — searchParams
export const dynamic = 'force-dynamic';

export const metadata = {
  title: "تحقّق من الرمز · سباير ميديكال",
  description: "أدخل رمز التحقّق",
};

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { verifyOtp } from '../login/actions';

const searchParamsSchema = z.object({
  phone: z.string().min(10).max(20),
  error: z.string().max(500).optional(),
});

export default function OtpPage({
  searchParams,
}: {
  searchParams: { phone?: string; error?: string };
}) {
  const params = searchParamsSchema.safeParse(searchParams);
  if (!params.success) redirect('/login');

  const { phone, error } = params.data;
  const maskedPhone =
    phone.length > 6
      ? phone.slice(0, 4) + ' ●●● ' + phone.slice(-3)
      : phone;

  return (
    <main className="auth-screen">
      <Link href="/login/phone" className="auth-back">
        <span>←</span>
        <span>تغيير الرقم</span>
      </Link>

      <div className="auth-header">
        <div className="auth-logo">س</div>
        <h1 className="auth-brand">Spir Medical</h1>
        <div className="auth-brand-sub">سباير ميديكال</div>
      </div>

      <div className="auth-status-icon">💬</div>

      <div className="auth-title-section">
        <h2 className="auth-title">تحقّق من رقمك</h2>
        <p className="auth-subtitle">
          أرسلنا رمزاً مكوّناً من ٦ أرقام إلى
        </p>
        <span className="auth-masked-phone">{maskedPhone}</span>
      </div>

      {error && (
        <div className="auth-error">
          <div className="auth-error-icon">!</div>
          <span>{error}</span>
        </div>
      )}

      <form action={verifyOtp} className="auth-form">
        <input type="hidden" name="phone" value={phone} />

        <label htmlFor="token" className="auth-field-label" style={{ position: 'absolute', left: '-9999px' }}>
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

      <div className="auth-helper">
        لم يصلك الرمز؟ <Link href="/login/phone">إعادة الإرسال</Link>
      </div>
      <div className="auth-expiry">⏱ ينتهي خلال ٥ دقائق</div>
    </main>
  );
}
