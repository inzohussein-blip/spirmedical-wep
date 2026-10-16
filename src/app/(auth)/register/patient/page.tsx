import Link from 'next/link';
import { registerPatient } from '../actions';
import PatientEmailRegister from './PatientEmailRegister';

export const metadata = { title: 'حساب مريض جديد · سباير ميديكال' };

// ═══════════════════════════════════════════════════════════
// 📝 تسجيل مريض — الرقم + رمز دخول (0049)، والبريدُ بديلٌ
// ═══════════════════════════════════════════════════════════
// قرار المالك: لا رمز واتساب في التسجيل. كان `registerPatient` بالهاتف قائماً بلا
// واجهة، فلم يكن أمام المريض إلّا البريد. الرمزُ يُرسَل في حقل `password`
// ويُحرس في `guardPinRegistration` (رمزٌ ضعيف أو رقمٌ مسجَّل يُرفضان).

export default async function PatientRegisterPage(
  props: {
    searchParams: Promise<{ error?: string; method?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  if (searchParams.method === 'email') return <PatientEmailRegister />;
  const error = searchParams.error;

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

      <div className="auth-title-section">
        <h2 className="auth-title">حساب مريض جديد</h2>
        <p className="auth-subtitle">برقم هاتفك ورمز دخولٍ تختاره — بلا رسائل تحقّق.</p>
      </div>

      {error && (
        <div className="auth-error" role="alert">
          <div className="auth-error-icon">!</div>
          <span>{error}</span>
        </div>
      )}

      <form action={registerPatient} className="auth-form">
        <input type="hidden" name="action" value="skip" />

        <div className="auth-field">
          <label htmlFor="fullName" className="auth-field-label">
            الاسم الكامل<span className="auth-required">*</span>
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="مثال: أحمد محمد علي"
            autoComplete="name"
            required
            minLength={2}
            maxLength={50}
            className="auth-input"
          />
        </div>

        <div className="auth-field">
          <label htmlFor="gender" className="auth-field-label">
            الجنس<span className="auth-required">*</span>
          </label>
          <select id="gender" name="gender" required defaultValue="" className="auth-input">
            <option value="" disabled>اختر</option>
            <option value="male">ذكر</option>
            <option value="female">أنثى</option>
          </select>
        </div>

        <div className="auth-field">
          <label htmlFor="phone" className="auth-field-label">
            رقم الهاتف<span className="auth-required">*</span>
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
              pattern="0?7[0-9]{9}"
            />
          </div>
          <div className="auth-field-hint">مثال: ٠٧٧١٢٣٤٥٦٧٨ أو ٧٧١٢٣٤٥٦٧٨</div>
        </div>

        <div className="auth-field">
          <label htmlFor="pin" className="auth-field-label">
            رمز الدخول (PIN)<span className="auth-required">*</span>
          </label>
          <input
            id="pin"
            type="password"
            name="password"
            inputMode="numeric"
            autoComplete="new-password"
            placeholder="6 أرقام"
            required
            minLength={6}
            maxLength={6}
            pattern="[0-9]{6}"
            className="auth-input"
          />
          <div className="auth-field-hint">تدخل به مع رقمك. تجنّب المتكرّر والمتتالي (111111، 123456).</div>
        </div>

        <div className="auth-field">
          <label className="checkbox-option">
            <input type="checkbox" name="acceptTerms" required className="w-6 h-6 shrink-0 accent-emerald-700" />
            <span className="checkbox-text" style={{ fontSize: 13 }}>
              أوافق على{' '}
              <Link href="/legal/terms" className="auth-inline-link">الشروط والأحكام</Link>
              {' '}و{' '}
              <Link href="/legal/privacy" className="auth-inline-link">سياسة الخصوصية</Link>
            </span>
          </label>
        </div>

        <button type="submit" className="auth-cta">
          إنشاء الحساب
        </button>
      </form>

      <div className="auth-helper">
        لديك حساب؟ <Link href="/login/phone">تسجيل الدخول</Link>
      </div>
      <div className="auth-helper auth-helper--center">
        <Link href="/register/patient?method=email" className="auth-link auth-link--muted">
          التسجيل بالبريد الإلكتروني بدلاً من ذلك
        </Link>
      </div>
    </main>
  );
}
