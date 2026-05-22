import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardSearch from './search-client';
import DashboardPills from './pills-client';
import StoriesRow from '@/components/dashboard/StoriesRow';
import OnboardingTrigger from '@/components/onboarding/OnboardingTrigger';
import RefreshWrapper from '@/components/pwa/RefreshWrapper';
import PatientHeroCard from '@/components/dashboard/PatientHeroCard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'الرئيسية · سباير ميديكال',
};

// ============================================================
// Stories - مُدارة الآن من admin44/stories (V25)
// ============================================================

const PROMO_CARDS = [
{
    id: 'home-services',
    tag: 'جديد',
    title: 'خدمات منزلية',
    sub: 'سحب دم · إبر · تمريض · بأسرع وقت',
    href: '/appointments/new',
    icon: '🏠',
  },
];

const FEATURED_SERVICE = {
  id: 'blood-draw-lab',
  icon: '🩸',
  title: 'سحب الدم والتحاليل',
  desc: 'فني مختبر مدرّب يأتي لمنزلك · نتائج رقمية مع استشارة مجانية',
  meta: 'الخدمة الأساسية',
  href: '/appointments/new?service=blood-draw',
};

type ServiceVariant = 'default' | 'amber' | 'rose';

interface Service {
  id: string;
  icon: string;
  title: string;
  desc: string;
  variant: ServiceVariant;
  href?: string;
  badge?: string;
}

const CORE_SERVICES: Service[] = [
  { id: 'blood-lab', icon: '🩸', title: 'سحب دم + تحاليل', desc: '+٢٠٠ فحص · منزلي', variant: 'default', href: '/appointments/new?service=blood-draw', badge: 'الأكثر طلباً' },
  { id: 'nursing', icon: '💉', title: 'تمريض منزلي', desc: '7 خدمات · إبر · جروح · كانيولا', variant: 'amber', href: '/appointments/new?service=home-nursing' },
  { id: 'family-doctor', icon: '👨‍⚕️', title: 'طبيب العائلة', desc: 'اشتراك · زيارات · استشارات', variant: 'default', href: '/services/doctors', badge: 'جديد' },
  { id: 'hospitals', icon: '🏥', title: 'مستشفيات', desc: 'حكومي · أهلي · خريطة', variant: 'amber', href: '/services/hospitals' },
  { id: 'pharmacies', icon: '💊', title: 'صيدلية', desc: 'إرشاد لا بيع', variant: 'default', href: '/services/pharmacies' },
  { id: 'consultation', icon: '💬', title: 'استشاراتي', desc: 'نص + صور · 24س', variant: 'amber', href: '/consultations' },
  { id: 'reminders', icon: '⏰', title: 'تنبيهات', desc: 'دواء · مواعيد', variant: 'default', href: '/account/reminders' },
  { id: 'prescriptions', icon: '📋', title: 'وصفاتي', desc: 'كل وصفاتك', variant: 'amber', href: '/account/prescriptions' },
  { id: 'health-dashboard', icon: '📊', title: 'لوحة الصحة', desc: 'ضغط · سكر', variant: 'default', href: '/account/health' },
  { id: 'physio', icon: '🦾', title: 'فيزيائي', desc: 'علاج طبيعي', variant: 'amber', href: '/services/physio' },
  // ✨ V25.19: 4 خدمات جديدة
  { id: 'dental', icon: '🦷', title: 'طب الأسنان', desc: 'تقويم · زراعة · تبييض', variant: 'default', href: '/services/dental', badge: 'جديد' },
  { id: 'optical', icon: '👓', title: 'النظارات الطبية', desc: 'فحص · إطارات · عدسات', variant: 'amber', href: '/services/optical', badge: 'جديد' },
  { id: 'mental-health', icon: '🧠', title: 'الصحة النفسية', desc: 'سرية · علاج · استشارات', variant: 'default', href: '/services/mental-health', badge: 'جديد' },
  { id: 'nutrition', icon: '🥗', title: 'التغذية والحمية', desc: 'إنقاص وزن · سكري · رياضة', variant: 'amber', href: '/services/nutrition', badge: 'جديد' },
];

// ============================================================
// 🆕 الأدوات الذكية (٤ أدوات)
// ============================================================
const SMART_TOOLS: Service[] = [
  { id: 'risk-calculator', icon: '🧮', title: 'حاسبة المخاطر', desc: 'قيّم حالتك في ٣٠ ثانية', variant: 'amber', href: '/tools/risk-calculator' },
  { id: 'symptom-checker', icon: '🩺', title: 'مدقّق الأعراض', desc: 'حدّد توجّهك الطبي', variant: 'default', href: '/tools/symptom-checker' },
  { id: 'first-aid', icon: '🩹', title: 'الإسعافات الأولية', desc: 'دليل لـ ١٠+ حالات طارئة', variant: 'amber', href: '/tools/first-aid' },
  { id: 'vaccinations', icon: '💉', title: 'جدول التطعيمات', desc: '١٨ لقاح حسب العمر', variant: 'default', href: '/tools/vaccinations' },
];

const EMERGENCY_SERVICE = {
  id: 'sos',
  icon: '🚨',
  title: 'طوارئ SOS',
  desc: 'استجابة فورية · ١٢٢',
  href: '/sos',
};

function getGreeting(): string {
  const now = new Date();
  const baghdadHour = (now.getUTCHours() + 3) % 24;

  if (baghdadHour >= 5 && baghdadHour < 12) return 'صباح الخير';
  if (baghdadHour >= 12 && baghdadHour < 17) return 'مساء الخير';
  if (baghdadHour >= 17 && baghdadHour < 22) return 'مساء الخير';
  return 'مساء الخير';
}

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, governorate')
    .eq('id', user.id)
    .single();

  const fullName = profile?.full_name || 'صديقنا';
  const firstName = fullName.split(' ')[0];
  const initial = firstName.charAt(0);
  const displayName = fullName.length > 18 ? firstName : fullName;
  const governorate = profile?.governorate || 'بغداد';
  const greeting = getGreeting();
  const hasNotifications = true;

  return (
    <main className="app-screen">
      <OnboardingTrigger />
      <RefreshWrapper>
      <div className="scr-content">

        {/* HEADER */}
        <div className="scr-header-v2">
          <Link href="/account" className="scr-header-user">
            <div className="scr-avatar-small" aria-hidden="true">{initial}</div>
            <div className="scr-header-info">
              <div className="scr-header-greeting">{greeting}</div>
              <div className="scr-header-name">{displayName} <span aria-hidden="true">👋</span></div>
            </div>
          </Link>

          <div className="scr-header-actions">
            <button
              className="scr-header-btn"
              aria-label={`الموقع: ${governorate}`}
              type="button"
            >
              <span className="scr-header-btn-icon" aria-hidden="true">📍</span>
              <span className="scr-header-btn-label">{governorate}</span>
            </button>
            <Link
              href="/account/notifications"
              className="scr-header-btn scr-header-btn-notif"
              aria-label="الإشعارات"
            >
              <span aria-hidden="true">🔔</span>
              {hasNotifications && <span className="scr-header-notif-dot" aria-hidden="true"></span>}
            </Link>
          </div>
        </div>

        {/* البحث */}
        <DashboardSearch />

        {/* 🎨 V25.34: Hero Card الشخصي */}
        <PatientHeroCard fullName={fullName} governorate={governorate} />

        {/* Quick Action Pills */}
        <DashboardPills />

        {/* Stories - من admin44/stories */}
        <StoriesRow />

        {/* البطاقات الإعلانية */}
        <div className="scr-promo-cards">
          {PROMO_CARDS.map((card) => (
            <Link key={card.id} href={card.href} className="scr-promo-card">
              <div className="scr-promo-content">
                <div className="scr-promo-tag">{card.tag}</div>
                <div className="scr-promo-title">{card.title}</div>
                <div className="scr-promo-sub">{card.sub}</div>
              </div>
              <div className="scr-promo-icon" aria-hidden="true">{card.icon}</div>
            </Link>
          ))}
        </div>

        {/* الخدمة المميزة */}
        <div className="scr-section-head" style={{ marginTop: 20 }}>
          <div className="scr-section-title">المُميّز</div>
        </div>
        <Link href={FEATURED_SERVICE.href} className="service-featured-v2">
          <div className="service-featured-v2-row">
            <div className="service-featured-v2-icon" aria-hidden="true">{FEATURED_SERVICE.icon}</div>
            <div className="service-featured-v2-body">
              <div className="service-featured-v2-title-row">
                <span className="service-featured-v2-title">{FEATURED_SERVICE.title}</span>
                <span className="service-featured-v2-badge">الأكثر طلباً</span>
              </div>
              <div className="service-featured-v2-desc">{FEATURED_SERVICE.desc}</div>
              <div className="service-featured-v2-tags">
                <span className="service-featured-v2-tag">
                  <span aria-hidden="true">⏱</span> 30د
                </span>
                <span className="service-featured-v2-tag">
                  <span aria-hidden="true">💵</span> من 15$
                </span>
                <span className="service-featured-v2-tag">
                  <span aria-hidden="true">🏠</span> في منزلك
                </span>
              </div>
            </div>
            <div className="service-featured-v2-arrow" aria-hidden="true">←</div>
          </div>
        </Link>

        {/* الخدمات الرئيسية */}
        <div className="scr-section-head" style={{ marginTop: 20 }}>
          <div className="scr-section-title">خدماتنا</div>
          <div className="scr-section-link">{CORE_SERVICES.length} خدمة</div>
        </div>
        <div className="services-grid">
          {CORE_SERVICES.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>

        {/* 🆕 الأدوات الذكية - قسم جديد */}
        <div className="scr-section-head" style={{ marginTop: 20 }}>
          <div className="scr-section-title">أدوات الصحة الذكية</div>
          <div className="scr-section-link">{SMART_TOOLS.length} أداة</div>
        </div>
        <div className="services-grid">
          {SMART_TOOLS.map((tool) => (
            <ServiceCard key={tool.id} service={tool} />
          ))}
        </div>

        {/* طوارئ */}
        <div className="scr-section-head" style={{ marginTop: 20 }}>
          <div className="scr-section-title">طوارئ</div>
        </div>
        <Link href={EMERGENCY_SERVICE.href} className="service-card service-emergency">
          <div className="service-icon emergency" aria-hidden="true">{EMERGENCY_SERVICE.icon}</div>
          <div style={{ flex: 1, textAlign: 'right' }}>
            <div className="service-title">{EMERGENCY_SERVICE.title}</div>
            <div className="service-desc">{EMERGENCY_SERVICE.desc}</div>
          </div>
          <div className="service-arrow" aria-hidden="true">←</div>
        </Link>
      </div>
      </RefreshWrapper>
    </main>
  );
}

function ServiceCard({ service }: { service: Service }) {
  const isComingSoon = service.badge === 'قريباً';

  // أداة "قريباً" مع href - تظل قابلة للضغط لعرض الصفحة
  if (isComingSoon && service.href) {
    return (
      <Link href={service.href} className={`service-card service-${service.variant}`}>
        <div className="service-icon" aria-hidden="true">{service.icon}</div>
        <div className="service-title">{service.title}</div>
        <div className="service-desc">{service.desc}</div>
        {service.badge && <div className="service-badge">{service.badge}</div>}
      </Link>
    );
  }

  if (isComingSoon || !service.href) {
    return (
      <div className={`service-card service-${service.variant}`}>
        <div className="service-icon" aria-hidden="true">{service.icon}</div>
        <div className="service-title">{service.title}</div>
        <div className="service-desc">{service.desc}</div>
        {service.badge && <div className="service-badge">{service.badge}</div>}
      </div>
    );
  }

  return (
    <Link href={service.href} className={`service-card service-${service.variant}`}>
      <div className="service-icon" aria-hidden="true">{service.icon}</div>
      <div className="service-title">{service.title}</div>
      <div className="service-desc">{service.desc}</div>
    </Link>
  );
}
