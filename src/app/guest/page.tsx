'use client';

import Link from 'next/link';
import { useState } from 'react';
import { LockedAction } from '@/components/app/LockedAction';
import { BottomNav } from '@/components/app/BottomNav';

const STORIES = [
  { id: 1, title: 'لقاحات', icon: '💉' },
  { id: 2, title: 'فحص دوري', icon: '🩺' },
  { id: 3, title: 'أدوية الضغط', icon: '💊' },
  { id: 4, title: 'أطباء بغداد', icon: '👨‍⚕️' },
  { id: 5, title: 'خصومات', icon: '🎁' },
];

type Variant = 'default' | 'amber' | 'rose' | 'locked';

interface Service {
  id: string;
  icon: string;
  title: string;
  desc: string;
  variant: Variant;
  href?: string;
}

const SERVICES: Service[] = [
  { id: 'hospitals', icon: '🏥', title: 'المستشفيات', desc: 'دليل ومعلومات', variant: 'default', href: '/guest/services/hospitals' },
  { id: 'pharmacy', icon: '💊', title: 'الصيدليات', desc: 'مواقع وأدوية', variant: 'default', href: '/guest/services/pharmacy' },
  { id: 'tests', icon: '🧪', title: 'تحاليل مختبرية', desc: 'يتطلب التسجيل', variant: 'locked' },
  { id: 'nursing', icon: '💉', title: 'تمريض وتداوي', desc: 'يتطلب التسجيل', variant: 'locked' },
  { id: 'consult', icon: '💬', title: 'استشارة طبية', desc: 'يتطلب التسجيل', variant: 'locked' },
  { id: 'sos', icon: '🚨', title: 'طوارئ SOS', desc: 'متاح للجميع', variant: 'rose', href: '/guest/sos' },
];

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

        {/* Banner تشجيع التسجيل */}
        <Link href="/register" className="scr-guest-banner">
          <div className="scr-guest-banner-icon" aria-hidden="true">⚡</div>
          <div className="scr-guest-banner-content">
            <div className="scr-guest-banner-title">سجّل وافتح كل الميزات</div>
            <div className="scr-guest-banner-sub">حفظ السجلات، حجز الفحوصات، استشارات</div>
          </div>
          <div className="scr-guest-banner-cta">سجّل ‹</div>
        </Link>

        {/* Search */}
        <div className="scr-search" style={{ marginTop: 14 }}>
          <div className="scr-search-icon" aria-hidden="true">⌕</div>
          <input
            type="search"
            placeholder="ابحث عن صيدلية أو مستشفى..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="البحث"
          />
        </div>

        {/* Stories */}
        <div className="scr-stories" aria-label="القصص الطبية">
          {STORIES.map((story) => (
            <button key={story.id} className="story" type="button" aria-label={`قصة: ${story.title}`}>
              <div className="story-circle">
                <div className="story-inner">{story.icon}</div>
              </div>
              <div className="story-label">{story.title}</div>
            </button>
          ))}
        </div>

        {/* Section: تصفّح بدون تسجيل */}
        <div className="scr-section-head" style={{ marginTop: 6 }}>
          <div className="scr-section-title">تصفّح بدون تسجيل</div>
          <div className="scr-section-link">٦ خدمات</div>
        </div>

        <div className="services-grid">
          {SERVICES.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>

        <div style={{
          padding: '14px 18px 8px',
          fontSize: 10,
          color: 'var(--ink-3)',
          textAlign: 'center',
          lineHeight: 1.6,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          justifyContent: 'center'
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
  const className = `service-cell ${service.variant !== 'default' ? service.variant : ''}`;
  const arrow = service.variant === 'locked' ? '🔒' : '‹';

  if (service.variant === 'locked') {
    return (
      <LockedAction
        isLocked={true}
        message={`${service.title} - ${service.desc}`}
        className={className}
      >
        <div className="service-arrow" aria-hidden="true">{arrow}</div>
        <div className="service-icon" aria-hidden="true">{service.icon}</div>
        <div className="service-name">{service.title}</div>
        <div className="service-sub">{service.desc}</div>
      </LockedAction>
    );
  }

  return (
    <Link href={service.href || '#'} className={className}>
      <div className="service-arrow" aria-hidden="true">{arrow}</div>
      <div className="service-icon" aria-hidden="true">{service.icon}</div>
      <div className="service-name">{service.title}</div>
      <div className="service-sub">{service.desc}</div>
    </Link>
  );
}
