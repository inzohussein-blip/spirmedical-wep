// تعطيل pre-rendering — searchParams
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { z } from 'zod';
import { genderLabels } from '@/lib/validations/auth-forms';
import { registerPatient } from '../actions';

const searchParamsSchema = z.object({
  error: z.string().max(500).optional(),
});

export const metadata = {
  title: 'تسجيل مراجع · سباير ميديكال',
};

export default function PatientRegisterPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const params = searchParamsSchema.safeParse(searchParams);
  const error = params.success ? params.data.error : undefined;

  // ⭐ OTP Mode (3 أوضاع)
  const otpMode = (process.env.NEXT_PUBLIC_OTP_MODE ?? 'disabled') as
    | 'disabled'
    | 'optional'
    | 'required';

  const isOtpRequired = otpMode === 'required';
  const isOtpOptional = otpMode === 'optional';
  const isOtpDisabled = otpMode === 'disabled';

  return (
    <main className="auth-screen">
      <Link href="/register" className="auth-back">
        <span>←</span>
        <span>العودة</span>
      </Link>

      <div className="auth-header">
        <div className="auth-logo">س</div>
        <h1 className="auth-brand">Spir Medical</h1>
        <div className="auth-brand-sub">سباير ميديكال</div>
      </div>

      <div className="auth-role-badge">
        <span aria-hidden="true">⊕</span>
        <span>تسجيل كمراجع جديد</span>
      </div>

      <div className="auth-title-section">
        <h2 className="auth-title">معلوماتك الأساسية</h2>
        <p className="auth-subtitle">
          سنحتاج هذه المعلومات لإنشاء حسابك. كلها إلزامية.
        </p>
      </div>

      {error && (
        <div className="auth-error" role="alert">
          <div className="auth-error-icon">!</div>
          <span>{error}</span>
        </div>
      )}

      <form action={registerPatient} className="auth-form">
        {/* الاسم الكامل */}
        <div className="auth-field">
          <label htmlFor="fullName" className="auth-field-label">
            الاسم الكامل
            <span className="auth-required">*</span>
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="مثال: أحمد محمد علي"
            autoComplete="name"
            required
            minLength={3}
            maxLength={50}
            className="auth-input"
          />
        </div>

        {/* الجنس */}
        <div className="auth-field">
          <label className="auth-field-label">
            الجنس
            <span className="auth-required">*</span>
          </label>
          <div className="radio-group" role="radiogroup" aria-required="true">
            {(['male', 'female', 'other'] as const).map((g) => (
              <label key={g} className="radio-option">
                <input type="radio" name="gender" value={g} required />
                <span>{genderLabels[g]}</span>
              </label>
            ))}
          </div>
        </div>

        {/* رقم الهاتف */}
        <div className="auth-field">
          <label htmlFor="phone" className="auth-field-label">
            رقم الهاتف
            <span className="auth-required">*</span>
          </label>
          <div className="auth-phone-wrap">
            <div className="auth-phone-prefix">
              <span aria-hidden="true">🇮🇶</span>
              <span>+964</span>
            </div>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              placeholder="7XX XXX XXXX"
              autoComplete="tel"
              required
              pattern="0?7[0-9]{9}"
              maxLength={11}
            />
          </div>
          <div className="auth-field-hint">
            {isOtpRequired
              ? 'مثال: 07712345678 - سنرسل لك رمز تحقق'
              : 'مثال: 07712345678'}
          </div>
        </div>

        {/* رمز الدخول */}
        <div className="auth-field">
          <label htmlFor="password" className="auth-field-label">
            رمز الدخول (PIN)
            <span className="auth-required">*</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            inputMode="numeric"
            placeholder="6 أرقام"
            autoComplete="new-password"
            required
            pattern="\d{6}"
            maxLength={6}
            minLength={6}
            className="auth-input"
          />
          <div className="auth-field-hint">
            استخدم 6 أرقام تتذكّرها · لا تشاركها مع أحد
          </div>
        </div>

        {/* الموافقة على الشروط */}
        <div className="auth-field">
          <label className="checkbox-option">
            <input type="checkbox" name="acceptTerms" required />
            <span className="checkbox-text">
              أوافق على{' '}
              <Link
                href="/legal/terms"
                target="_blank"
                className="auth-inline-link"
              >
                الشروط والأحكام
              </Link>
              {' '}و{' '}
              <Link
                href="/legal/privacy"
                target="_blank"
                className="auth-inline-link"
              >
                سياسة الخصوصية
              </Link>
            </span>
          </label>
        </div>

        {/* ─── الأزرار حسب OTP Mode ─── */}

        {isOtpRequired && (
          <>
            <input type="hidden" name="action" value="otp" />
            <button type="submit" className="auth-cta">
              إنشاء الحساب وإرسال رمز ←
            </button>
          </>
        )}

        {isOtpDisabled && (
          <>
            <input type="hidden" name="action" value="skip" />
            <button type="submit" className="auth-cta">
              إنشاء الحساب والدخول ←
            </button>
          </>
        )}

        {isOtpOptional && (
          <div className="auth-cta-group">
            <button
              type="submit"
              className="auth-cta auth-cta-primary"
              name="action"
              value="otp"
            >
              <span aria-hidden="true">🔐</span>
              <span>إنشاء + رمز تحقق</span>
            </button>
            <button
              type="submit"
              className="auth-cta auth-cta-secondary"
              name="action"
              value="skip"
            >
              <span aria-hidden="true">⚡</span>
              <span>إنشاء سريع (بدون رمز)</span>
            </button>
          </div>
        )}
      </form>

      {/* ملاحظة عن وضع OTP */}
      {(isOtpDisabled || isOtpOptional) && (
        <div className="auth-footer-note">
          ℹ️ الدخول السريع متاح للتجربة الأولى.
          <br />
          سيُفعَّل التحقق بـ OTP قريباً لمزيد من الأمان.
        </div>
      )}

      <div className="auth-helper">
        لديك حساب؟ <Link href="/login">تسجيل الدخول</Link>
      </div>
    </main>
  );
}
