export const dynamic = 'force-dynamic';

import Link from 'next/link';

export const metadata = {
  title: 'إنشاء حساب · سباير ميديكال',
};

export default function RegisterChoicePage() {
  return (
    <main className="auth-screen">
      <Link href="/gate" className="auth-back">
        <span>←</span>
        <span>العودة</span>
      </Link>

      <div className="auth-header">
        <div className="auth-logo">س</div>
        <h1 className="auth-brand">Spir Medical</h1>
        <div className="auth-brand-sub">سباير ميديكال</div>
      </div>

      <div className="auth-title-section">
        <h2 className="auth-title">إنشاء حساب جديد</h2>
        <p className="auth-subtitle">
          اختر نوع حسابك للحصول على التجربة المناسبة لك.
        </p>
      </div>

      <div className="auth-role-cards">
        <Link href="/register/patient" className="auth-role-card selected">
          <div className="auth-role-icon">⊕</div>
          <div className="auth-role-info">
            <div className="auth-role-title">مراجع / مريض</div>
            <div className="auth-role-desc">حجز الخدمات الطبية وإدارة العائلة</div>
          </div>
          <div className="auth-role-arrow">‹</div>
        </Link>

        <Link href="/register/specialist" className="auth-role-card">
          <div className="auth-role-icon">⌬</div>
          <div className="auth-role-info">
            <div className="auth-role-title">أخصائي طبي</div>
            <div className="auth-role-desc">تقديم خدمات طبية للمراجعين</div>
          </div>
          <div className="auth-role-arrow">‹</div>
        </Link>
      </div>

      <div className="auth-helper">
        لديك حساب؟ <Link href="/login">تسجيل الدخول</Link>
      </div>
    </main>
  );
}
