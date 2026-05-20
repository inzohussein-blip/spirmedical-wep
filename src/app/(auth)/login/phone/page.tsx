// تعطيل pre-rendering — searchParams
export const dynamic = 'force-dynamic';

export const metadata = {
  title: "تسجيل دخول بالهاتف · سباير ميديكال",
  description: "سجّل الدخول برقم هاتفك",
};

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
    <main className="auth-screen">
      <Link href="/login" className="auth-back">
        <span>←</span>
        <span>تغيير الحساب</span>
      </Link>

      <div className="auth-header">
        <div className="auth-logo">س</div>
        <h1 className="auth-brand">Spir Medical</h1>
        <div className="auth-brand-sub">سباير ميديكال</div>
      </div>

      <div className={`auth-role-badge ${isSpecialist ? 'specialist' : ''}`}>
        <span>{isSpecialist ? '⌬' : '⊕'}</span>
        <span>الدخول {isSpecialist ? 'كأخصائي' : 'كمراجع'}</span>
      </div>

      <div className="auth-title-section">
        <h2 className="auth-title">مرحباً بك</h2>
        <p className="auth-subtitle">
          أدخل رقم هاتفك لنُرسل لك
          <br />
          رمز التحقق برسالة نصية
        </p>
      </div>

      {error && (
        <div className="auth-error">
          <div className="auth-error-icon">!</div>
          <span>{error}</span>
        </div>
      )}

      <form action={sendOtp} className="auth-form">
        <input type="hidden" name="role" value={role} />

        <div className="auth-field">
          <label htmlFor="phone" className="auth-field-label">
            رقم الهاتف
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
          <div className="auth-field-hint">مثال: ٠٧٧١٢٣٤٥٦٧٨ أو ٧٧١٢٣٤٥٦٧٨</div>
        </div>

        <button type="submit" className="auth-cta">
          إرسال رمز التحقق ←
        </button>
      </form>

      <div className="auth-helper">
        <Link href="/forgot">نسيت الرمز؟</Link>
      </div>
    </main>
  );
}
