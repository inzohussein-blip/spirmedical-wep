export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { registerWithEmail } from '../email-actions';

export const metadata = {
  title: 'تسجيل بالبريد · سباير ميديكال',
};

export default function EmailRegisterPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const error = searchParams.error;

  return (
    <main className="auth-screen">
      <Link href="/register/patient" className="auth-back">
        <span>←</span>
        <span>العودة للتسجيل بالهاتف</span>
      </Link>

      <div className="auth-header">
        <div className="auth-logo">س</div>
        <h1 className="auth-brand">Spir Medical</h1>
        <div className="auth-brand-sub">سباير ميديكال</div>
      </div>

      <div className="auth-title-section">
        <h2 className="auth-title">التسجيل بالبريد الإلكتروني</h2>
        <p className="auth-subtitle">طريقة بديلة لإنشاء حسابك.</p>
      </div>

      {error && (
        <div className="auth-error" role="alert">
          <div className="auth-error-icon">!</div>
          <span>{error}</span>
        </div>
      )}

      <form action={registerWithEmail} className="auth-form">
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
            minLength={3}
            maxLength={50}
            className="auth-input"
          />
        </div>

        <div className="auth-field">
          <label htmlFor="email" className="auth-field-label">
            البريد الإلكتروني<span className="auth-required">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@email.com"
            autoComplete="email"
            required
            className="auth-input"
            style={{ direction: 'ltr', textAlign: 'left' }}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="password" className="auth-field-label">
            كلمة المرور<span className="auth-required">*</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="8 أحرف على الأقل"
            autoComplete="new-password"
            required
            minLength={8}
            className="auth-input"
            style={{ direction: 'ltr', textAlign: 'left' }}
          />
        </div>

        <button type="submit" className="auth-cta">
          إنشاء الحساب
        </button>
      </form>

      <div className="auth-helper">
        لديك حساب؟ <Link href="/login">تسجيل الدخول</Link>
      </div>
    </main>
  );
}
