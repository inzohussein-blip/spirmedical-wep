// تعطيل pre-rendering — searchParams
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { verifyOtp } from '../login/actions';

const searchParamsSchema = z.object({
  phone: z.string().min(10).max(20),
  error: z.string().max(500).optional(),
});

export default function OtpPage({
  searchParams,
}: {
  searchParams: { phone?: string; error?: string };
}) {
  const params = searchParamsSchema.safeParse(searchParams);
  if (!params.success) redirect('/login');

  const { phone, error } = params.data;
  const maskedPhone =
    phone.length > 6
      ? phone.slice(0, 4) + ' ●●● ' + phone.slice(-3)
      : phone;

  return (
    <main className="auth-page">
      <Link href="/login/phone" className="back-link">
        <span>←</span>
        <span>تغيير الرقم</span>
      </Link>

      <div className="phone">
        <div className="phone-screen">
          <div className="scr-auth">
            <div className="scr-auth-logo">س</div>

            <div className="otp-icon">💬</div>

            <h2 className="center">تحقّق من رقمك</h2>
            <p className="center">
              أرسلنا رمزاً مكوّناً من ٦ أرقام إلى<br />
              <span className="masked-phone">{maskedPhone}</span>
            </p>

            {error && (
              <div className="error-alert">
                <span>{error}</span>
              </div>
            )}

            <form action={verifyOtp} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <input type="hidden" name="phone" value={phone} />

              <label htmlFor="token" className="field-label" style={{ position: 'absolute', left: '-9999px' }}>
                رمز التحقق
              </label>
              <input
                id="token"
                type="text"
                name="token"
                className="otp-input"
                placeholder="000000"
                inputMode="numeric"
                maxLength={6}
                minLength={6}
                pattern="\d{6}"
                required
                autoComplete="one-time-code"
                autoFocus
              />

              <button type="submit" className="cta-btn">
                تحقّق وادخل
              </button>
            </form>

            <div className="helper-link">
              لم يصلك الرمز؟ <Link href="/login/phone">إعادة الإرسال</Link>
            </div>
            <div className="expiry-note">⏱ ينتهي خلال ٥ دقائق</div>
          </div>
          <div className="phone-home-bar"></div>
        </div>
      </div>
    </main>
  );
}
