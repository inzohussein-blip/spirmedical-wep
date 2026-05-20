// تعطيل pre-rendering — searchParams
export const dynamic = 'force-dynamic';

export const metadata = {
  title: "استعادة كلمة المرور · سباير ميديكال",
  description: "استعد الوصول إلى حسابك",
};

import Link from 'next/link';
import { z } from 'zod';
import { sendOtp } from '../login/actions';

const searchParamsSchema = z.object({
  error: z.string().max(500).optional(),
});

export default function ForgotPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const params = searchParamsSchema.safeParse(searchParams);
  const error = params.success ? params.data.error : undefined;

  return (
    <main className="auth-screen">
      <Link href="/login" className="auth-back">
        <span>←</span>
        <span>العودة</span>
      </Link>

      <div className="auth-header">
        <div className="auth-logo">س</div>
        <h1 className="auth-brand">Spir Medical</h1>
        <div className="auth-brand-sub">سباير ميديكال</div>
      </div>

      <div className="auth-status-icon amber">🔑</div>

      <div className="auth-title-section">
        <h2 className="auth-title">نسيت الرمز؟</h2>
        <p className="auth-subtitle">
          لا تقلق! أدخل رقم هاتفك المُسجّل
          <br />
          وسنُرسل لك رمز جديد لاستعادة الدخول.
        </p>
      </div>

      {error && (
        <div className="auth-error">
          <div className="auth-error-icon">!</div>
          <span>{error}</span>
        </div>
      )}

      <form action={sendOtp} className="auth-form">
        <div className="auth-field">
          <label htmlFor="phone" className="auth-field-label">
            رقم الهاتف المُسجّل
          </label>
          <div className="auth-phone-wrap">
            <div className="auth-phone-prefix">
              <span>🇮🇶</span>
              <span>+964</span>
            </div>
            <input
              id="phone"
              type="tel"
              name="phone"
              placeholder="7XX XXX XXXX"
              required
              autoComplete="tel"
              autoFocus
              pattern="0?7[0-9]{9}"
            />
          </div>
        </div>

        <button type="submit" className="auth-cta">
          إرسال رمز جديد ←
        </button>
      </form>

      <div className="auth-helper">
        تذكّرت رمزك؟ <Link href="/login">العودة لتسجيل الدخول</Link>
      </div>
    </main>
  );
}
