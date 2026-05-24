// ═══════════════════════════════════════════════════════════════════
// 🩺 V26.2 - Patient Dashboard (إعادة الترتيب الكامل)
// ═══════════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import OnboardingTrigger from '@/components/onboarding/OnboardingTrigger';
import RefreshWrapper from '@/components/pwa/RefreshWrapper';
import ActiveAppointmentCard from '@/components/dashboard/ActiveAppointmentCard';
import StoriesRow from '@/components/dashboard/StoriesRow';

// ─── V26 V3 Components ───
import HeroCardV3 from '@/components/dashboard-v3/HeroCardV3';
import SearchBarV3 from '@/components/dashboard-v3/SearchBarV3';
import FeaturedServiceCardV3 from '@/components/dashboard-v3/FeaturedServiceCardV3';
import BentoServicesGridV3 from '@/components/dashboard-v3/BentoServicesGridV3';
import SmartToolsGridV3 from '@/components/dashboard-v3/SmartToolsGridV3';
import PromoCardsV3 from '@/components/dashboard-v3/PromoCardsV3';
import EmergencyCardV3 from '@/components/dashboard-v3/EmergencyCardV3';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'الرئيسية · سباير ميديكال',
};

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // ─── جلب الـ profile ───
  const { data: profile } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single();

  const fullName = profile?.full_name || 'صديقنا';
  const firstName = fullName.split(' ')[0];

  // ─── إحصاءات للـ Hero ───
  
  const supabaseAny = supabase as unknown as {
    from: (t: string) => {
      select: (cols: string, opts?: { count?: 'exact'; head?: boolean }) => {
        eq: (col: string, val: string) => Promise<{ count: number | null }>;
      };
    };
  };

  
  const testsCountRes = await supabaseAny
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);
  const testsCount = testsCountRes.count ?? 0;

  
  const rxCountRes = await supabaseAny
    .from('prescriptions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);
  const prescriptionsCount = rxCountRes.count ?? 0;

  
  const notifRes = await supabaseAny
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);
  const hasUnread = (notifRes.count ?? 0) > 0;

  return (
    <main className="app-screen">
      <OnboardingTrigger />
      <RefreshWrapper>
        <div className="scr-content" style={{ padding: 0 }}>
          
          {/* 1️⃣ Hero Card (أخضر V3) */}
          <HeroCardV3
            firstName={firstName}
            testsCount={testsCount}
            prescriptionsCount={prescriptionsCount}
            hasUnreadNotifications={hasUnread}
          />

          {/* 2️⃣ Live status للطلب النشط */}
          <div style={{ padding: '0 14px' }}>
            <ActiveAppointmentCard />
          </div>

          {/* 3️⃣ Search Bar */}
          <SearchBarV3 />

          {/* 4️⃣ Stories */}
          <StoriesRow />

          {/* 5️⃣ Promo Cards (خدمات منزلية) */}
          <PromoCardsV3 />

          {/* 6️⃣ Featured Service (سحب الدم) */}
          <FeaturedServiceCardV3 duration="30 دقيقة" priceFrom={15} />

          {/* 7️⃣ Core Services Grid (15 خدمة) */}
          <BentoServicesGridV3 />

          {/* 8️⃣ Smart Tools (قسم منفصل!) */}
          <SmartToolsGridV3 />

          {/* 9️⃣ Emergency SOS */}
          <EmergencyCardV3 />

          {/* spacer */}
          <div style={{ height: 80 }} />
        </div>
      </RefreshWrapper>
    </main>
  );
}
