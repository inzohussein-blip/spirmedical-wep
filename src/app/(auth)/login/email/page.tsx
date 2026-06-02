export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { loginWithEmail } from '../../register/email-actions';

export const metadata = {
  title: 'دخول بالبريد · سباير ميديكال',
};

export default function EmailLoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const error = searchParams.error;

  return (
    <main className="auth-screen">
      <Link href="/login" className="auth-back">
        <span>←</span>
        <span>العودة للدخول بالهاتف</span>
      </Link>

      <div className="auth-header">
        <div className="auth-logo">س</div>
        <h1 className="auth-brand">Spir Medical</h1>
        <div className="auth-brand-sub">سباير ميديكال</div>
      </div>

      <div className="auth-title-section">
        <h2 className="auth-title">الدخول بالبريد الإلكتروني</h2>
        <p className="auth-subtitle">أدخل بريدك وكلمة المرور.</p>
      </div>

      {error && (
        <div className="auth-error" role="alert">
          <div className="auth-error-icon">!</div>
          <span>{error}</span>
        </div>
      )}

      <form action={loginWithEmail} className="auth-form">
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
            placeholder="••••••••"
            autoComplete="current-password"
            required
            className="auth-input"
            style={{ direction: 'ltr', textAlign: 'left' }}
          />
        </div>

        <button type="submit" className="auth-cta">
          تسجيل الدخول
        </button>
      </form>

      <div className="auth-helper">
        ليس لديك حساب؟ <Link href="/register/email">التسجيل بالبريد</Link>
      </div>
    </main>
  );
}
