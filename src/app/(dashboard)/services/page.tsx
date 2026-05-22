// ═══════════════════════════════════════════════════════════════
// 🏥 صفحة كل الخدمات الشاملة (V25.30)
// ═══════════════════════════════════════════════════════════════
// Index page لكل الخدمات الـ 13 المتوفرة في Spir Medical
// ═══════════════════════════════════════════════════════════════

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'كل الخدمات الطبية - Spir Medical',
  description: 'استكشف كل الخدمات الطبية في سباير ميديكال: سحب دم، تمريض، أسنان، نظارات، صحة نفسية، تغذية، وأكثر',
};

interface ServiceCategory {
  id: string;
  icon: string;
  title: string;
  desc: string;
  href: string;
  variant: 'emerald' | 'amber';
  badge?: string;
}

const ALL_SERVICES: ServiceCategory[] = [
  // 🩸 الخدمات الأساسية
  {
    id: 'blood-lab',
    icon: '🩸',
    title: 'سحب دم + تحاليل',
    desc: '+٢٠٠ فحص · في منزلك',
    href: '/appointments/new?service=blood-draw',
    variant: 'emerald',
    badge: 'الأكثر طلباً',
  },
  {
    id: 'nursing',
    icon: '💉',
    title: 'تمريض منزلي',
    desc: 'إبر · جروح · كانيولا · مغذي',
    href: '/appointments/new?service=home-nursing',
    variant: 'amber',
  },
  {
    id: 'consultations',
    icon: '💬',
    title: 'استشارات طبية',
    desc: 'نص · صور · 24 ساعة',
    href: '/consultations',
    variant: 'emerald',
  },

  // 👨‍⚕️ الأطباء والمتخصّصون
  {
    id: 'doctors',
    icon: '👨‍⚕️',
    title: 'الأطباء والاختصاصيون',
    desc: 'دليل · طبيب عائلة',
    href: '/services/doctors',
    variant: 'amber',
  },
  {
    id: 'consultation-services',
    icon: '🩺',
    title: 'استشارات إضافية',
    desc: 'استشارات تخصّصية',
    href: '/services/consultation',
    variant: 'emerald',
  },

  // 🏥 المرافق الصحية
  {
    id: 'hospitals',
    icon: '🏥',
    title: 'مستشفيات',
    desc: 'حكومي · أهلي · على الخريطة',
    href: '/services/hospitals',
    variant: 'amber',
  },
  {
    id: 'clinics',
    icon: '🏨',
    title: 'عيادات',
    desc: 'دليل عيادات مُعتمدة',
    href: '/services/clinics',
    variant: 'emerald',
  },
  {
    id: 'pharmacies',
    icon: '💊',
    title: 'صيدليات',
    desc: 'إرشاد لا بيع',
    href: '/services/pharmacies',
    variant: 'amber',
  },

  // 🦷 الخدمات التخصّصية الجديدة
  {
    id: 'dental',
    icon: '🦷',
    title: 'طب الأسنان',
    desc: 'تقويم · زراعة · تبييض',
    href: '/services/dental',
    variant: 'emerald',
    badge: 'جديد',
  },
  {
    id: 'optical',
    icon: '👓',
    title: 'النظارات الطبية',
    desc: 'فحص · إطارات · عدسات',
    href: '/services/optical',
    variant: 'amber',
    badge: 'جديد',
  },
  {
    id: 'mental-health',
    icon: '🧠',
    title: 'الصحة النفسية',
    desc: 'سرية تامة · علاج · استشارات',
    href: '/services/mental-health',
    variant: 'emerald',
    badge: 'جديد',
  },
  {
    id: 'nutrition',
    icon: '🥗',
    title: 'التغذية والحمية',
    desc: 'إنقاص وزن · سكري · رياضة',
    href: '/services/nutrition',
    variant: 'amber',
    badge: 'جديد',
  },

  // 🦾 خدمات أخرى
  {
    id: 'physio',
    icon: '🦾',
    title: 'العلاج الفيزيائي',
    desc: 'إعادة تأهيل · علاج طبيعي',
    href: '/services/physio',
    variant: 'emerald',
  },
  {
    id: 'cosmetic',
    icon: '💄',
    title: 'الطب التجميلي',
    desc: 'بشرة · فيلر · بوتوكس',
    href: '/services/cosmetic',
    variant: 'amber',
  },
];

export default function ServicesPage() {
  return (
    <main className="app-screen">
      <div className="scr-content">
        {/* Header */}
        <div className="scr-page-header">
          <Link href="/dashboard" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} />
          </Link>
          <h1 className="scr-page-title">كل الخدمات</h1>
          <div className="scr-page-spacer" />
        </div>

        <p className="scr-page-subtitle" style={{ marginBottom: 16 }}>
          استكشف {ALL_SERVICES.length} خدمة طبية متكاملة
        </p>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
          marginBottom: 20,
        }}>
          {ALL_SERVICES.map((service) => (
            <Link
              key={service.id}
              href={service.href}
              className={`service-card service-${service.variant}`}
              aria-label={service.title}
            >
              {service.badge && (
                <span style={{
                  position: 'absolute',
                  top: 8,
                  insetInlineEnd: 8,
                  fontSize: 9,
                  fontWeight: 900,
                  background: service.variant === 'emerald' ? 'var(--amber)' : 'var(--emerald)',
                  color: 'var(--paper-3)',
                  padding: '2px 6px',
                  borderRadius: 100,
                }}>
                  {service.badge}
                </span>
              )}

              <div style={{ fontSize: 32, marginBottom: 8 }}>
                {service.icon}
              </div>
              <div style={{
                fontSize: 13,
                fontWeight: 900,
                marginBottom: 4,
                color: 'var(--ink)',
              }}>
                {service.title}
              </div>
              <div style={{
                fontSize: 10,
                color: 'var(--ink-3)',
                lineHeight: 1.5,
              }}>
                {service.desc}
              </div>
            </Link>
          ))}
        </div>

        {/* CTA: 24/7 */}
        <Link
          href="/sos"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            background: 'var(--rose-soft)',
            border: '1px solid var(--rose)',
            borderRadius: 14,
            textDecoration: 'none',
            marginBottom: 14,
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--rose)' }}>
              🚨 طوارئ SOS
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
              مساعدة فورية 24/7
            </div>
          </div>
          <ArrowRight size={18} color="var(--rose)" style={{ transform: 'scaleX(-1)' }} />
        </Link>

        {/* المعلومات الإضافية */}
        <div style={{
          background: 'var(--emerald-soft)',
          borderRadius: 12,
          padding: 14,
          fontSize: 11,
          color: 'var(--ink-2)',
          lineHeight: 1.8,
        }}>
          💡 <strong>سباير ميديكال</strong> منصة طبية رقمية عراقية متكاملة
          <br />
          📞 خدمة عملاء 24/7 · 🇮🇶 صناعة عراقية · ⚡ خدمة سريعة
        </div>
      </div>
    </main>
  );
}
