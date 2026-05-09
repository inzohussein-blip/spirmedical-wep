// تعطيل pre-rendering
export const dynamic = 'force-dynamic';

import Link from 'next/link';

export const metadata = {
  title: 'بوابة الدخول · سباير ميديكال',
  description: 'سجّل دخول أو أنشئ حساب جديد',
};

export default function GatePage() {
  return (
    <main className="auth-screen">
      <Link href="/" className="auth-back">
        <span>←</span>
        <span>للرئيسية</span>
      </Link>

      <div className="auth-header">
        <div className="auth-logo">س</div>
        <h1 className="auth-brand">Spir Medical</h1>
        <div className="auth-brand-sub">سباير ميديكال</div>
      </div>

      <div className="auth-title-section">
        <h2 className="auth-title">أهلاً بك</h2>
        <p className="auth-subtitle">
          هل لديك حساب من قبل أم تريد إنشاء حساب جديد؟
        </p>
      </div>

      {/* Two main options */}
      <div className="gate-options">
        <Link href="/login" className="gate-option" aria-label="تسجيل الدخول لحساب موجود">
          <div className="gate-option-icon">🔐</div>
          <div className="gate-option-content">
            <h3>تسجيل الدخول</h3>
            <p>عندي حساب بالفعل وأريد الدخول</p>
          </div>
          <div className="gate-option-arrow">‹</div>
        </Link>

        <Link href="/register" className="gate-option highlight" aria-label="إنشاء حساب جديد">
          <div className="gate-option-icon">✨</div>
          <div className="gate-option-content">
            <h3>إنشاء حساب جديد</h3>
            <p>مستخدم جديد · تسجيل سريع · مجاناً</p>
          </div>
          <div className="gate-option-arrow">‹</div>
        </Link>
      </div>

      {/* Guest option (subtle) */}
      <div className="gate-divider">
        <span>أو</span>
      </div>

      <Link href="/guest" className="gate-guest-link">
        <span>👁</span>
        <span>تصفّح كضيف بدون تسجيل</span>
      </Link>
    </main>
  );
}
