// ═══════════════════════════════════════════════════════════════════
// 🩺 V26.0 - Patient Dashboard (Design System V3)
// ═══════════════════════════════════════════════════════════════════
// المرجع: docs/spir-v3-design-reference.md
// ═══════════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import OnboardingTrigger from '@/components/onboarding/OnboardingTrigger';
import RefreshWrapper from '@/components/pwa/RefreshWrapper';
import ActiveAppointmentCard from '@/components/dashboard/ActiveAppointmentCard';
import StoriesRow from '@/components/dashboard/StoriesRow';

// ─── V26.0 V3 Components ───
import HeroCardV3 from '@/components/dashboard-v3/HeroCardV3';
import SearchBarV3 from '@/components/dashboard-v3/SearchBarV3';
import FeaturedServiceCardV3 from '@/components/dashboard-v3/FeaturedServiceCardV3';
import BentoServicesGridV3 from '@/components/dashboard-v3/BentoServicesGridV3';

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

  // ─── إحصاءات سريعة (للـ Hero) ───
  // فحوصات (lab_orders + appointments من blood-draw)
  
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

  // ─── إشعارات غير مقروءة ───
  
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
          
          {/* 1️⃣ Hero Card (V3 - أخضر، 6px margin) */}
          <HeroCardV3
            firstName={firstName}
            testsCount={testsCount}
            prescriptionsCount={prescriptionsCount}
            hasUnreadNotifications={hasUnread}
          />

          {/* 2️⃣ Live status للطلب النشط (لو موجود) */}
          <div style={{ padding: '0 14px' }}>
            <ActiveAppointmentCard />
          </div>

          {/* 3️⃣ Search Bar (V3) */}
          <SearchBarV3 />

          {/* 4️⃣ Stories Row (من admin44/stories) */}
          <StoriesRow />

          {/* 5️⃣ Featured Service (سحب الدم) */}
          <div style={{ marginTop: 14 }}>
            <FeaturedServiceCardV3 duration="30 دقيقة" priceFrom={15} />
          </div>

          {/* 6️⃣ Bento Grid (13 خدمة) */}
          <BentoServicesGridV3 />

          {/* spacer */}
          <div style={{ height: 80 }} />
        </div>
      </RefreshWrapper>
    </main>
  );
}
