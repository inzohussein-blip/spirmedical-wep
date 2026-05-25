// ═══════════════════════════════════════════════════════════════
// 💬 V26.5: WhatsApp OTP Settings Page
// ═══════════════════════════════════════════════════════════════
//
// صفحة إعدادات OTP عبر واتساب / تليجرام / SMS
// المستخدم يختار قناة OTP المفضّلة + يتحقّق من رقمه عبر واتساب
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import WhatsAppOtpSettings from '@/components/settings/WhatsAppOtpSettings';
import ServiceDetailHeader from '@/components/dashboard-v3/ServiceDetailHeader';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'إعدادات OTP عبر واتساب · سباير ميديكال',
};

export default async function WhatsAppOtpPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // جلب الإعدادات (Migration 12 columns)
  
  const supabaseAny = supabase as unknown as {
    from: (t: string) => {
      
      select: (cols: string) => any;
    };
  };

  const res = await supabaseAny
    .from('users')
    .select('phone, wa_otp_enabled, wa_verified, preferred_otp_channel')
    .eq('id', user.id)
    .single();

  const userData = (res.data ?? {}) as {
    phone?: string;
    wa_otp_enabled?: boolean;
    wa_verified?: boolean;
    preferred_otp_channel?: 'whatsapp' | 'telegram' | 'sms';
  };

  return (
    <main className="app-screen" style={{ background: '#F8F9FA' }}>
      <div className="scr-content" style={{ padding: 0 }}>
        <ServiceDetailHeader
          backHref="/account/settings"
          title="رمز OTP عبر واتساب"
        />

        <div style={{ padding: 14 }}>
          <WhatsAppOtpSettings
            initialEnabled={userData.wa_otp_enabled ?? false}
            initialChannel={userData.preferred_otp_channel ?? 'sms'}
            waVerified={userData.wa_verified ?? false}
            userPhone={userData.phone ?? ''}
          />
        </div>
      </div>
    </main>
  );
}
