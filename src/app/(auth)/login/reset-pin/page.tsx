import Link from 'next/link';
import { isWaVerifyAvailable } from '@/lib/whatsapp/inbound-verify';
import ResetPinClient from './ResetPinClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'استعادة رمز الدخول · سباير ميديكال',
  description: 'استعد رمز دخولك برسالة واتساب واحدة من رقمك',
};

/**
 * /login/reset-pin — استعادةُ رمز الدخول، أو تفعيلُ حسابٍ أنشأته الإدارة.
 * يُفتح من «نسيت الرمز» ومن رابط الإدارة (`?phone=07…`). والتحقّقُ مطفأ ⇒ رسالةٌ لا شاشةٌ معطوبة.
 */
export default async function ResetPinPage(props: { searchParams: Promise<{ phone?: string }> }) {
  const { phone } = await props.searchParams;
  const available = await isWaVerifyAvailable().catch(() => false);
  const initialPhone = (phone ?? '').replace(/\D/g, '').slice(0, 11);

  return (
    <main className="auth-screen">
      <Link href="/login/phone" className="auth-back">
        <span>←</span>
        <span>العودة</span>
      </Link>

      <div className="auth-header">
        <div className="auth-logo">س</div>
        <h1 className="auth-brand">Spir Medical</h1>
        <div className="auth-brand-sub">سباير ميديكال</div>
      </div>

      <div className="auth-title-section">
        <h2 className="auth-title">رمز الدخول عبر واتساب</h2>
        <p className="auth-subtitle">
          نتأكّد أنّ الرقم لك برسالة واتساب واحدة منه، ثمّ تختار رمزَ دخولك.
        </p>
      </div>

      {available ? (
        <ResetPinClient initialPhone={initialPhone} />
      ) : (
        <div className="auth-error" role="alert">
          <div className="auth-error-icon">!</div>
          <span>
            الاستعادةُ عبر واتساب غير متاحة الآن. تواصل مع الدعم ليُنشئ لك رمزاً مؤقّتاً.
          </span>
        </div>
      )}

      <div className="auth-helper">
        تذكّرتَ الرمز؟ <Link href="/login/phone">تسجيل الدخول</Link>
      </div>
    </main>
  );
}
