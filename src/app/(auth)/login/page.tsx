// تعطيل pre-rendering — searchParams
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { z } from 'zod';

const searchParamsSchema = z.object({
  error: z.string().max(500).optional(),
});

const TEST_MODE = process.env.ENABLE_TEST_MODE === 'true';

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

      {/* 🧪 شارة وضع التجربة */}
      {TEST_MODE && (
        <div
          style={{
            background: 'var(--amber-soft)',
            border: '1.5px dashed var(--amber)',
            borderRadius: '14px',
            padding: '14px 16px',
            marginBottom: '20px',
            fontSize: '12px',
            lineHeight: 1.6,
          }}
        >
          <div
            style={{
              fontWeight: 800,
              color: 'var(--amber)',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            🧪 وضع التجربة مُفعّل
          </div>
          <div style={{ color: 'var(--ink-2)', marginBottom: '6px' }}>
            استخدم أحد هذه الحسابات للاختبار:
          </div>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              color: 'var(--ink)',
              background: 'rgba(255,255,255,0.5)',
              padding: '8px 10px',
              borderRadius: '8px',
              direction: 'ltr',
              textAlign: 'left',
            }}
          >
            <div>مراجع:   7712345678 → 123456</div>
            <div>أخصائي:  7811111111 → 111111</div>
            <div>أدمن:    7900000000 → 000000</div>
          </div>
        </div>
      )}

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
