// تعطيل pre-rendering — searchParams
export const dynamic = 'force-dynamic';

export const metadata = {
  title: "تحقّق من الرمز · سباير ميديكال",
  description: "أدخل رمز التحقّق",
};

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import OtpForm from './OtpForm';

const searchParamsSchema = z.object({
  phone: z.string().min(10).max(20),
  error: z.string().max(500).optional(),
  redirect: z.string().max(200).optional(),
  channel: z.enum(['whatsapp', 'telegram', 'sms']).optional(),
});

// 🎯 V26.6: معلومات القناة للعرض
const CHANNEL_INFO: Record<string, { icon: string; label: string; color: string }> = {
  whatsapp: { icon: '💬', label: 'WhatsApp', color: '#25D366' },
  telegram: { icon: '✈️', label: 'Telegram', color: '#0088CC' },
  sms: { icon: '📱', label: 'رسالة نصية', color: '#5F6368' },
};

export default function OtpPage({
  searchParams,
}: {
  searchParams: { phone?: string; error?: string; redirect?: string; channel?: string };
}) {
  const params = searchParamsSchema.safeParse(searchParams);
  if (!params.success) redirect('/login');

  const { phone, error, redirect: redirectTo, channel = 'whatsapp' } = params.data;
  const channelInfo = CHANNEL_INFO[channel];
  const maskedPhone =
    phone.length > 6
      ? phone.slice(0, 4) + ' ●●● ' + phone.slice(-3)
      : phone;

  return (
    <main className="auth-screen">
      <Link href="/login/phone" className="auth-back">
        <span>←</span>
        <span>تغيير الرقم</span>
      </Link>

      <div className="auth-header">
        <div className="auth-logo">س</div>
        <h1 className="auth-brand">Spir Medical</h1>
        <div className="auth-brand-sub">سباير ميديكال</div>
      </div>

      {/* 🎯 V26.6: أيقونة القناة */}
      <div className="auth-status-icon">{channelInfo.icon}</div>

      <div className="auth-title-section">
        <h2 className="auth-title">تحقّق من رقمك</h2>
        <p className="auth-subtitle">
          أرسلنا رمزاً مكوّناً من ٦ أرقام عبر{' '}
          <strong style={{ color: channelInfo.color }}>{channelInfo.label}</strong>
          {' '}إلى
        </p>
        <span className="auth-masked-phone">{maskedPhone}</span>
      </div>

      {error && (
        <div className="auth-error">
          <div className="auth-error-icon">!</div>
          <span>{error}</span>
        </div>
      )}

      <OtpForm phone={phone} channel={channel} redirectTo={redirectTo} />

      <div className="auth-expiry">⏱ ينتهي خلال ٥ دقائق</div>
    </main>
  );
}
