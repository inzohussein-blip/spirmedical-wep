// تعطيل pre-rendering — searchParams
export const dynamic = 'force-dynamic';

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
    <main className="auth-page">
      <Link href="/login" className="back-link">
        <span>←</span>
        <span>العودة</span>
      </Link>

      <div className="phone">
        <div className="phone-screen">
          <div className="scr-auth">
            <div className="scr-auth-logo">س</div>

            <div className="otp-icon amber">🔑</div>

            <h2 className="center">نسيت الرمز؟</h2>
            <p className="center">
              لا تقلق! أدخل رقم هاتفك المُسجّل وسنُرسل لك رمز جديد لاستعادة الدخول.
            </p>

            {error && (
              <div className="error-alert">
                <span>{error}</span>
              </div>
            )}

            <form action={sendOtp} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <label htmlFor="phone" className="field-label" style={{ marginTop: '8px' }}>
                رقم الهاتف المُسجّل
              </label>
              <div className="phone-input-wrap">
                <div className="phone-prefix">
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

              <button type="submit" className="cta-btn" style={{ marginTop: '24px' }}>
                إرسال رمز جديد
              </button>
            </form>

            <div className="helper-link">
              تذكّرت رمزك؟ <Link href="/login">العودة لتسجيل الدخول</Link>
            </div>
          </div>
          <div className="phone-home-bar"></div>
        </div>
      </div>
    </main>
  );
}
