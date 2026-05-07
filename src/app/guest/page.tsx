'use client';

import Link from 'next/link';
import { useState } from 'react';
import { LockedAction } from '@/components/app/LockedAction';
import { BottomNav } from '@/components/app/BottomNav';

const STORIES = [
  { id: 'add', icon: '+', label: 'إضافة', isAdd: true, locked: true },
  { id: 'vaccines', icon: '💉', label: 'لقاحات', isAdd: false, locked: false },
  { id: 'health', icon: '🩺', label: 'صحتك', isAdd: false, locked: false },
  { id: 'meds', icon: '💊', label: 'دواء', isAdd: false, locked: false },
  { id: 'nutrition', icon: '🍎', label: 'تغذية', isAdd: false, locked: false },
];

type Variant = 'default' | 'amber' | 'rose' | 'locked' | 'featured';

interface Service {
  id: string;
  icon: string;
  title: string;
  desc: string;
  variant: Variant;
  // الضيف: هل مقفلة؟
  guestLocked?: boolean;
  guestLockedDesc?: string;
  href?: string;
  // للـ featured فقط
  meta?: string;
  isFeatured?: boolean;
}

// نفس الخدمات في الـ playbook PHONE 2 - بترتيبها وألوانها
// الضيف: مقفل ما يحتاج حساب، مفتوح ما هو browse-only أو طوارئ
const SERVICES: Service[] = [
  {
    id: 'family-doctor',
    icon: '⌬',
    title: 'طبيب العائلة المخصص',
    desc: 'طبيب مرافق لك ولأهلك على مدار العام',
    meta: 'حصري · جديد',
    variant: 'featured',
    isFeatured: true,
    guestLocked: true,
    guestLockedDesc: 'يتطلب التسجيل',
  },
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
    desc: '+٥٠ نوع فحص',
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
    desc: 'دليل ومعلومات',
    variant: 'default',
    guestLocked: false, // متاح للضيف للتصفّح
    href: '/guest/services/hospitals',
  },
  {
    id: 'pharmacies',
    icon: '💊',
    title: 'دليل الصيدليات',
    desc: 'إرشاد لا بيع',
    variant: 'default',
    guestLocked: false, // متاح للضيف للتصفّح
    href: '/guest/services/pharmacies',
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
  {
    id: 'sos',
    icon: '🚨',
    title: 'طوارئ SOS',
    desc: 'استجابة فورية ١٢٢',
    variant: 'rose',
    guestLocked: false, // طوارئ - متاح للجميع
    href: '/guest/sos',
  },
];

export default function GuestHomePage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <main className="app-screen">
      <div className="scr-content">

        {/* Greeting - مطابق للـ playbook */}
        <div className="scr-greet">
          <div>
            <div className="scr-h1">مرحباً، ضيف</div>
            <div className="scr-loc">📍 تصفح فقط · سجّل لرفع طلب</div>
          </div>
          <div className="scr-avatar guest" aria-hidden="true">ض</div>
        </div>

        {/* Search - مطابق للـ playbook */}
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

        {/* Stories - مطابق للـ playbook */}
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

        {/* Promo Banner - مطابق للـ playbook */}
        <Link href="/register" className="scr-banner" style={{ textDecoration: 'none' }}>
          <div className="scr-banner-content">
            <div className="scr-banner-tag">عرض الخريف</div>
            <div className="scr-banner-title">سجّل وافتح كل الميزات</div>
            <div className="scr-banner-sub">حفظ السجلات · حجز الفحوصات · استشارات</div>
          </div>
          <div className="scr-banner-cta">سجّل ‹</div>
        </Link>

        {/* Section Title */}
        <div className="scr-section-head">
          <div className="scr-section-title">خدماتنا الطبية</div>
          <div className="scr-section-link">٩ خدمات</div>
        </div>

        {/* Services Grid - كل الـ٩ خدمات من الـ playbook */}
        <div className="services-grid">
          {SERVICES.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>

        {/* Footer hint */}
        <div style={{
          padding: '14px 18px 8px',
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
          <span>الخدمات المقفلة تتطلب التسجيل كمراجع</span>
        </div>
      </div>

      <BottomNav isGuest={true} />
    </main>
  );
}

function ServiceCard({ service }: { service: Service }) {
  // إذا مقفلة للضيف
  if (service.guestLocked) {
    if (service.isFeatured) {
      // Featured locked variant
      return (
        <LockedAction
          isLocked={true}
          message={`${service.title} - متاح للمسجّلين فقط`}
          className="service-cell featured locked"
        >
          <div className="service-icon" aria-hidden="true">{service.icon}</div>
          <div className="featured-info">
            <div className="featured-meta">{service.meta}</div>
            <div className="service-name">{service.title}</div>
            <div className="service-sub">{service.guestLockedDesc || service.desc}</div>
          </div>
          <div className="service-arrow" aria-hidden="true">🔒</div>
        </LockedAction>
      );
    }

    // عادي مقفل
    return (
      <LockedAction
        isLocked={true}
        message={`${service.title} - ${service.guestLockedDesc}`}
        className="service-cell locked"
      >
        <div className="service-arrow" aria-hidden="true">🔒</div>
        <div className="service-icon" aria-hidden="true">{service.icon}</div>
        <div className="service-name">{service.title}</div>
        <div className="service-sub">{service.guestLockedDesc || service.desc}</div>
      </LockedAction>
    );
  }

  // متاح (browse-only للضيف)
  if (service.isFeatured) {
    return (
      <Link href={service.href || '#'} className="service-cell featured">
        <div className="service-icon" aria-hidden="true">{service.icon}</div>
        <div className="featured-info">
          <div className="featured-meta">{service.meta}</div>
          <div className="service-name">{service.title}</div>
          <div className="service-sub">{service.desc}</div>
        </div>
        <div className="service-arrow" aria-hidden="true">‹</div>
      </Link>
    );
  }

  const cellClass = `service-cell${service.variant !== 'default' ? ' ' + service.variant : ''}`;

  return (
    <Link href={service.href || '#'} className={cellClass}>
      <div className="service-arrow" aria-hidden="true">‹</div>
      <div className="service-icon" aria-hidden="true">{service.icon}</div>
      <div className="service-name">{service.title}</div>
      <div className="service-sub">{service.desc}</div>
    </Link>
  );
}
