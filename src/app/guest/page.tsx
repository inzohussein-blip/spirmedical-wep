'use client';

import Link from 'next/link';
import { useState } from 'react';
import { LockedAction } from '@/components/app/LockedAction';

const STORIES = [
  { id: 'add', icon: '+', label: 'إضافة', isAdd: true, locked: true },
  { id: 'vaccines', icon: '💉', label: 'لقاحات', isAdd: false, locked: false },
  { id: 'health', icon: '🩺', label: 'صحتك', isAdd: false, locked: false },
  { id: 'meds', icon: '💊', label: 'دواء', isAdd: false, locked: false },
  { id: 'nutrition', icon: '🍎', label: 'تغذية', isAdd: false, locked: false },
  { id: 'firstaid', icon: '🚑', label: 'إسعافات', isAdd: false, locked: false },
];

type Variant = 'default' | 'amber' | 'rose' | 'locked' | 'featured';

interface Service {
  id: string;
  icon: string;
  title: string;
  desc: string;
  variant: Variant;
  guestLocked?: boolean;
  guestLockedDesc?: string;
  href?: string;
  meta?: string;
  isFeatured?: boolean;
  badge?: string; // شارة "قريباً" أو "جديد"
}

// ============================================================
// قسم ١: الخدمة المميزة (طبيب العائلة)
// ============================================================
const FEATURED_SERVICE: Service = {
  id: 'family-doctor',
  icon: '⌬',
  title: 'طبيب العائلة المخصص',
  desc: 'طبيب مرافق لك ولأهلك على مدار العام',
  meta: 'حصري · جديد',
  variant: 'featured',
  isFeatured: true,
  guestLocked: true,
  guestLockedDesc: 'يتطلب التسجيل',
};

// ============================================================
// قسم ٢: الخدمات الطبية الأساسية (٨ خدمات)
// ============================================================
const CORE_SERVICES: Service[] = [
  {
    id: 'blood-draw',
    icon: '🩸',
    title: 'سحب دم',
    desc: 'خدمة منزلية سريعة',
    variant: 'default',
    guestLocked: true,
    guestLockedDesc: 'يتطلب التسجيل',
  },
  {
    id: 'lab-tests',
    icon: '🧪',
    title: 'تحاليل مختبرية',
    desc: '+٢٠٠ نوع فحص',
    variant: 'amber',
    guestLocked: true,
    guestLockedDesc: 'يتطلب التسجيل',
  },
  {
    id: 'nursing',
    icon: '💉',
    title: 'تمريض وتداوي',
    desc: 'زرق إبر وعناية',
    variant: 'default',
    guestLocked: true,
    guestLockedDesc: 'يتطلب التسجيل',
  },
  {
    id: 'consultation',
    icon: '💬',
    title: 'استشارة طبية',
    desc: '١٢ طبيب متاح الآن',
    variant: 'amber',
    guestLocked: true,
    guestLockedDesc: 'يتطلب التسجيل',
  },
  {
    id: 'hospitals',
    icon: '🏥',
    title: 'المستشفيات',
    desc: '+٤٠ مستشفى · دليل ومعلومات',
    variant: 'default',
    guestLocked: false,
    href: '/guest/services/hospitals',
  },
  {
    id: 'pharmacies',
    icon: '💊',
    title: 'دليل الصيدليات',
    desc: 'إرشاد لا بيع',
    variant: 'default',
    guestLocked: false,
    href: '/guest/services/pharmacies',
  },
  {
    id: 'medical-record',
    icon: '📋',
    title: 'سجلي الطبي',
    desc: 'تاريخك الصحي مؤرشف',
    variant: 'default',
    guestLocked: true,
    guestLockedDesc: 'يتطلب التسجيل',
  },
  {
    id: 'family',
    icon: '👨‍👩‍👧',
    title: 'حساب العائلة',
    desc: 'إدارة حسابات الأقارب',
    variant: 'default',
    guestLocked: true,
    guestLockedDesc: 'يتطلب التسجيل',
  },
];

// ============================================================
// قسم ٣: أدوات الصحة الذكية (٥ أدوات للضيف)
// ============================================================
const SMART_TOOLS: Service[] = [
  {
    id: 'risk-calculator',
    icon: '🧮',
    title: 'حاسبة المخاطر الصحية',
    desc: 'قيّم حالتك في ٣٠ ثانية',
    variant: 'amber',
    guestLocked: false,
    href: '/guest/tools/risk-calculator',
  },
  {
    id: 'symptom-checker',
    icon: '🔍',
    title: 'مدقّق الأعراض',
    desc: 'اختر أعراضك واحصل على توصية',
    variant: 'default',
    guestLocked: false,
    href: '/guest/tools/symptom-checker',
  },
  {
    id: 'first-aid',
    icon: '🚑',
    title: 'الإسعافات الأولية',
    desc: 'دليل ٦ حالات طارئة',
    variant: 'rose',
    guestLocked: false,
    href: '/guest/tools/first-aid',
  },
  {
    id: 'medication-reminder',
    icon: '⏰',
    title: 'تذكير الأدوية',
    desc: 'إشعارات ذكية بمواعيد الدواء',
    variant: 'default',
    guestLocked: true,
    guestLockedDesc: 'يتطلب التسجيل',
  },
  {
    id: 'vitals-tracking',
    icon: '📊',
    title: 'تتبع المؤشرات الحيوية',
    desc: 'ضغط · سكر · نبض · وزن',
    variant: 'default',
    guestLocked: true,
    guestLockedDesc: 'يتطلب التسجيل',
  },
];

// ============================================================
// قسم ٤: ميزات قادمة (٤ ميزات - badge "قريباً")
// ============================================================
const COMING_SOON: Service[] = [
  {
    id: 'wallet',
    icon: '💰',
    title: 'المحفظة الداخلية',
    desc: 'رصيد + نقاط ولاء',
    variant: 'amber',
    guestLocked: true,
    guestLockedDesc: 'قريباً',
    badge: 'قريباً',
  },
  {
    id: 'ocr-prescriptions',
    icon: '📷',
    title: 'قراءة الوصفات',
    desc: 'صوّر الوصفة لقراءتها',
    variant: 'default',
    guestLocked: true,
    guestLockedDesc: 'قريباً',
    badge: 'قريباً',
  },
  {
    id: 'beauty-clinics',
    icon: '💄',
    title: 'عيادات تجميل',
    desc: 'دليل العيادات المعتمدة',
    variant: 'amber',
    guestLocked: true,
    guestLockedDesc: 'قريباً',
    badge: 'قريباً',
  },
  {
    id: 'vaccinations',
    icon: '💉',
    title: 'التطعيمات',
    desc: 'جدول لقاحات الأطفال والكبار',
    variant: 'default',
    guestLocked: true,
    guestLockedDesc: 'قريباً',
    badge: 'قريباً',
  },
];

// ============================================================
// قسم ٥: الطوارئ (متاح للجميع)
// ============================================================
const EMERGENCY_SERVICE: Service = {
  id: 'sos',
  icon: '🚨',
  title: 'طوارئ SOS',
  desc: 'استجابة فورية ١٢٢',
  variant: 'rose',
  guestLocked: false,
  href: '/guest/sos',
};

// ============================================================
// المكوّن الرئيسي
// ============================================================
export default function GuestHomePage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <main className="app-screen">
      <div className="scr-content">

        {/* Greeting */}
        <div className="scr-greet">
          <div>
            <div className="scr-h1">مرحباً، ضيف</div>
            <div className="scr-loc">📍 تصفح فقط · سجّل لرفع طلب</div>
          </div>
          <div className="scr-avatar guest" aria-hidden="true">ض</div>
        </div>

        {/* Search */}
        <div className="scr-search">
          <div className="scr-search-icon" aria-hidden="true">⌕</div>
          <input
            type="search"
            placeholder="ابحث عن خدمة، طبيب، أو فحص..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="البحث"
          />
          <span className="scr-search-shortcut">صوت</span>
        </div>

        {/* Stories */}
        <div className="scr-stories" aria-label="القصص الطبية">
          {STORIES.map((story) =>
            story.isAdd ? (
              <LockedAction
                key={story.id}
                isLocked={true}
                message="سجّل الآن لإضافة قصصك الطبية"
                className="story story-add"
              >
                <div className="story-circle">
                  <div className="story-inner">{story.icon}</div>
                </div>
                <div className="story-label">{story.label}</div>
              </LockedAction>
            ) : (
              <button
                key={story.id}
                className="story"
                type="button"
                aria-label={`قصة: ${story.label}`}
              >
                <div className="story-circle">
                  <div className="story-inner">{story.icon}</div>
                </div>
                <div className="story-label">{story.label}</div>
              </button>
            )
          )}
        </div>

        {/* Promo Banner */}
        <Link href="/register" className="scr-banner" style={{ textDecoration: 'none' }}>
          <div className="scr-banner-content">
            <div className="scr-banner-tag">عرض الخريف</div>
            <div className="scr-banner-title">سجّل وافتح كل الميزات</div>
            <div className="scr-banner-sub">حفظ السجلات · حجز الفحوصات · استشارات</div>
          </div>
          <div className="scr-banner-cta">سجّل ‹</div>
        </Link>

        {/* القسم ١: الخدمة المميزة */}
        <div className="scr-section-head">
          <div className="scr-section-title">المُميّز</div>
        </div>
        <div className="services-grid">
          <ServiceCard service={FEATURED_SERVICE} />
        </div>

        {/* القسم ٢: الخدمات الطبية الأساسية */}
        <div className="scr-section-head" style={{ marginTop: 16 }}>
          <div className="scr-section-title">خدماتنا الطبية</div>
          <div className="scr-section-link">٨ خدمات</div>
        </div>
        <div className="services-grid">
          {CORE_SERVICES.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>

        {/* القسم ٣: أدوات الصحة الذكية */}
        <div className="scr-section-head" style={{ marginTop: 16 }}>
          <div className="scr-section-title">أدوات الصحة الذكية</div>
          <div className="scr-section-link">٣ مجانية</div>
        </div>
        <div className="services-grid">
          {SMART_TOOLS.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>

        {/* القسم ٤: ميزات قادمة */}
        <div className="scr-section-head" style={{ marginTop: 16 }}>
          <div className="scr-section-title">قريباً</div>
          <div className="scr-section-link">٤ ميزات</div>
        </div>
        <div className="services-grid">
          {COMING_SOON.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>

        {/* القسم ٥: الطوارئ */}
        <div className="scr-section-head" style={{ marginTop: 16 }}>
          <div className="scr-section-title">طوارئ</div>
        </div>
        <div className="services-grid">
          <ServiceCard service={EMERGENCY_SERVICE} />
        </div>

        {/* Footer hint */}
        <div style={{
          padding: '20px 18px 8px',
          fontSize: 10,
          color: 'var(--ink-3)',
          textAlign: 'center',
          lineHeight: 1.6,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          justifyContent: 'center',
        }}>
          <span style={{ opacity: 0.5 }} aria-hidden="true">🔒</span>
          <span>الخدمات المقفلة تتطلب التسجيل · إجمالي ١٧ خدمة</span>
        </div>
      </div>

    </main>
  );
}

// ============================================================
// مكوّن بطاقة الخدمة
// ============================================================
function ServiceCard({ service }: { service: Service }) {
  const isLocked = service.guestLocked;
  const isFeatured = service.isFeatured;
  const arrowSymbol = isLocked ? '🔒' : '‹';

  // الخدمة المميزة (Featured)
  if (isFeatured) {
    const featuredClass = `service-cell featured${isLocked ? ' locked' : ''}`;
    const content = (
      <>
        <div className="service-icon" aria-hidden="true">{service.icon}</div>
        <div className="featured-info">
          <div className="featured-meta">{service.meta}</div>
          <div className="service-name">{service.title}</div>
          <div className="service-sub">{isLocked ? service.guestLockedDesc : service.desc}</div>
        </div>
        <div className="service-arrow" aria-hidden="true">{arrowSymbol}</div>
      </>
    );

    if (isLocked) {
      return (
        <LockedAction
          isLocked={true}
          message={`${service.title} - ${service.guestLockedDesc}`}
          className={featuredClass}
        >
          {content}
        </LockedAction>
      );
    }

    return (
      <Link href={service.href || '#'} className={featuredClass}>
        {content}
      </Link>
    );
  }

  // البطاقات العادية
  const cellClass = `service-cell${service.variant !== 'default' ? ' ' + service.variant : ''}${isLocked ? ' locked' : ''}`;

  const content = (
    <>
      <div className="service-arrow" aria-hidden="true">{arrowSymbol}</div>
      <div className="service-icon" aria-hidden="true">{service.icon}</div>
      {service.badge && <div className="service-badge">{service.badge}</div>}
      <div className="service-name">{service.title}</div>
      <div className="service-sub">{isLocked ? service.guestLockedDesc : service.desc}</div>
    </>
  );

  if (isLocked) {
    return (
      <LockedAction
        isLocked={true}
        message={`${service.title} - ${service.guestLockedDesc}`}
        className={cellClass}
      >
        {content}
      </LockedAction>
    );
  }

  return (
    <Link href={service.href || '#'} className={cellClass}>
      {content}
    </Link>
  );
}
