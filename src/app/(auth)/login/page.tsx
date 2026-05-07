// تعطيل pre-rendering — searchParams
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { z } from 'zod';

const searchParamsSchema = z.object({
  error: z.string().max(500).optional(),
});

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const params = searchParamsSchema.safeParse(searchParams);
  const error = params.success ? params.data.error : undefined;

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
        <h2 className="auth-title">كيف تود الدخول؟</h2>
        <p className="auth-subtitle">
          اختر نوع حسابك للحصول على التجربة المناسبة.
          <br />
          يمكنك تغيير ذلك لاحقاً.
        </p>
      </div>

      {error && (
        <div className="auth-error">
          <div className="auth-error-icon">!</div>
          <span>{error}</span>
        </div>
      )}

      <div className="auth-role-cards">
        <Link href="/guest" className="auth-role-card">
          <div className="auth-role-icon">👁</div>
          <div className="auth-role-info">
            <div className="auth-role-title">ضيف</div>
            <div className="auth-role-desc">للتصفح فقط دون تسجيل</div>
          </div>
          <div className="auth-role-arrow">‹</div>
        </Link>

        <Link href="/login/phone?role=patient" className="auth-role-card selected">
          <div className="auth-role-icon">⊕</div>
          <div className="auth-role-info">
            <div className="auth-role-title">مراجع / مريض</div>
            <div className="auth-role-desc">حجز الخدمات وإدارة العائلة</div>
          </div>
          <div className="auth-role-arrow">‹</div>
        </Link>

        <Link href="/login/phone?role=specialist" className="auth-role-card">
          <div className="auth-role-icon">⌬</div>
          <div className="auth-role-info">
            <div className="auth-role-title">أخصائي</div>
            <div className="auth-role-desc">تقديم خدمات طبية للمراجعين</div>
          </div>
          <div className="auth-role-arrow">‹</div>
        </Link>
      </div>

      <Link href="/login/phone?role=patient" className="auth-cta">
        المتابعة كمراجع ←
      </Link>

      <div className="auth-helper">
        <Link href="/forgot">نسيت الرمز؟</Link>
      </div>
    </main>
  );
}
