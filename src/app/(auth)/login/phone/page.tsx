// تعطيل pre-rendering — searchParams
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { z } from 'zod';
import { sendOtp } from '../actions';

const searchParamsSchema = z.object({
  role: z.enum(['patient', 'specialist']).optional(),
  error: z.string().max(500).optional(),
});

export default function PhonePage({
  searchParams,
}: {
  searchParams: { role?: string; error?: string };
}) {
  const params = searchParamsSchema.safeParse(searchParams);
  const role = (params.success ? params.data.role : 'patient') ?? 'patient';
  const error = params.success ? params.data.error : undefined;

  const isSpecialist = role === 'specialist';

  return (
    <main className="auth-page">
      <Link href="/login" className="back-link">
        <span>←</span>
        <span>تغيير نوع الحساب</span>
      </Link>

      <div className="phone">
        <div className="phone-screen">
          <div className="scr-auth">
            <div className="scr-auth-logo">س</div>

            <div className={`role-badge ${isSpecialist ? 'specialist' : ''}`}>
              <span>{isSpecialist ? '⌬' : '⊕'}</span>
              <span>الدخول {isSpecialist ? 'كأخصائي' : 'كمراجع'}</span>
            </div>

            <h2>مرحباً بك</h2>
            <p>أدخل رقم هاتفك لنُرسل لك رمز التحقق برسالة نصية</p>

            {error && (
              <div className="error-alert">
                <span>{error}</span>
              </div>
            )}

            <form action={sendOtp} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <input type="hidden" name="role" value={role} />

              <label htmlFor="phone" className="field-label">رقم الهاتف</label>
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
              <div className="field-hint">مثال: ٠٧٧١٢٣٤٥٦٧٨ أو ٧٧١٢٣٤٥٦٧٨</div>

              <button type="submit" className="cta-btn" style={{ marginTop: '24px' }}>
                إرسال رمز التحقق
              </button>
            </form>

            <div className="helper-link">
              <Link href="/forgot">نسيت الرمز؟</Link>
            </div>
          </div>
          <div className="phone-home-bar"></div>
        </div>
      </div>
    </main>
  );
}
