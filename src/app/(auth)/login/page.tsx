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
    <main className="auth-page">
      <Link href="/" className="back-link">
        <span>←</span>
        <span>للرئيسية</span>
      </Link>

      <div className="phone">
        <div className="phone-screen">
          <div className="scr-auth">
            <div className="scr-auth-logo">س</div>
            <h2>كيف تود الدخول؟</h2>
            <p>اختر نوع حسابك للحصول على التجربة المناسبة. يمكنك تغيير ذلك لاحقاً.</p>

            {error && (
              <div className="error-alert">
                <span>{error}</span>
              </div>
            )}

            <div className="role-cards">
              <Link href="/guest" className="role-card">
                <div className="role-icon">👁</div>
                <div className="role-info">
                  <div className="role-title">ضيف</div>
                  <div className="role-desc">للتصفح فقط دون تسجيل</div>
                </div>
                <div className="role-arrow">‹</div>
              </Link>

              <Link href="/login/phone?role=patient" className="role-card selected">
                <div className="role-icon">⊕</div>
                <div className="role-info">
                  <div className="role-title">مراجع / مريض</div>
                  <div className="role-desc">حجز الخدمات وإدارة العائلة</div>
                </div>
                <div className="role-arrow">‹</div>
              </Link>

              <Link href="/login/phone?role=specialist" className="role-card">
                <div className="role-icon">⌬</div>
                <div className="role-info">
                  <div className="role-title">أخصائي</div>
                  <div className="role-desc">تقديم خدمات طبية للمراجعين</div>
                </div>
                <div className="role-arrow">‹</div>
              </Link>
            </div>

            <Link href="/login/phone?role=patient" className="cta-btn">
              المتابعة كمراجع
            </Link>

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
