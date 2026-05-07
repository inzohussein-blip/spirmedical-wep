'use client';

import Link from 'next/link';
import { useState } from 'react';
import { LockedAction } from '@/components/app/LockedAction';
import { BottomNav } from '@/components/app/BottomNav';

const STORIES = [
  { id: 1, title: 'لقاحات الأطفال', icon: '💉', color: '#0E5C4D' },
  { id: 2, title: 'فحص دوري', icon: '🩺', color: '#B8540C' },
  { id: 3, title: 'أدوية الضغط', icon: '💊', color: '#A82E3D' },
  { id: 4, title: 'أطباء بغداد', icon: '👨‍⚕️', color: '#0E5C4D' },
  { id: 5, title: 'خصومات اليوم', icon: '🎁', color: '#B8540C' },
];

const SERVICES = [
  { id: 'blood', icon: '🩸', title: 'سحب دم', desc: 'حجز موعد للسحب المنزلي', locked: false },
  { id: 'tests', icon: '🧪', title: 'تحاليل', desc: '+٢٠٠ فحص متاح', locked: false },
  { id: 'hospitals', icon: '🏥', title: 'مستشفيات', desc: '+٤٠ مستشفى', locked: false },
  { id: 'pharmacy', icon: '💊', title: 'صيدلية', desc: 'إرشاد عن الأدوية', locked: false },
  { id: 'consult', icon: '📞', title: 'استشارة', desc: 'تواصل مع طبيب', locked: false },
  { id: 'cosmetic', icon: '💄', title: 'كوزمتك طبي', desc: 'منتجات معتمدة', locked: false },
  { id: 'clinics', icon: '🏨', title: 'عيادات', desc: 'حجز مواعيد', locked: false },
  { id: 'nursing', icon: '👩‍⚕️', title: 'تمريض وتداوي', desc: 'عناية منزلية', locked: false },
  { id: 'family', icon: '👨‍👩‍👧', title: 'العائلة', desc: 'إدارة حسابات الأقارب', locked: true },
  { id: 'records', icon: '📋', title: 'سجلك الطبي', desc: 'تاريخك الصحي', locked: true },
  { id: 'reminders', icon: '⏰', title: 'تنبيهات الأدوية', desc: 'مواعيد ذكية', locked: true },
  { id: 'family_doc', icon: '🩺', title: 'طبيب العائلة', desc: 'طبيبك الخاص', locked: true },
];

const ADS = [
  { id: 1, title: 'خصم ٢٠٪ على الفحوصات الشاملة', subtitle: 'هذا الأسبوع · مختبرات الكندي', color: '#0E5C4D', image: '🏥' },
  { id: 2, title: 'استشارة طبية مجانية', subtitle: 'لأول حجز · +٢٠ تخصص', color: '#B8540C', image: '👨‍⚕️' },
];

type Service = (typeof SERVICES)[number];

export default function GuestHomePage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <main className="app-screen">
      <header className="app-header">
        <div className="app-header-row">
          <div className="app-greeting">
            <div className="app-avatar guest" aria-hidden="true">👁</div>
            <div>
              <div className="app-greeting-label">مرحباً بك زائراً</div>
              <div className="app-greeting-name">تصفّح بحرّية</div>
            </div>
          </div>
          <LockedAction
            isLocked={true}
            message="سجّل الآن لتلقي التنبيهات الطبية"
            ariaLabel="التنبيهات"
            className="app-icon-btn"
          >
            <span aria-hidden="true">🔔</span>
          </LockedAction>
        </div>

        <div className="app-location">
          <span aria-hidden="true">📍</span>
          <span>بغداد - تحديد الموقع غير متاح للضيف</span>
        </div>

        <div className="app-search">
          <span className="app-search-icon" aria-hidden="true">🔍</span>
          <input
            type="search"
            placeholder="ابحث عن خدمة، طبيب، فحص..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="app-search-input"
            aria-label="البحث في الخدمات"
          />
          <button className="app-search-filter" aria-label="فلتر البحث" type="button">⚙</button>
        </div>
      </header>

      <section aria-label="القصص الطبية">
        <h2 className="sr-only">قصص اليوم</h2>
        <div className="app-stories">
          {STORIES.map((story) => (
            <button
              key={story.id}
              className="app-story"
              style={{ ['--story-color' as string]: story.color } as React.CSSProperties}
              type="button"
              aria-label={`قصة: ${story.title}`}
            >
              <div className="app-story-circle">
                <span aria-hidden="true">{story.icon}</span>
              </div>
              <span className="app-story-label">{story.title}</span>
            </button>
          ))}
        </div>
      </section>

      <section aria-label="عروض اليوم">
        <h2 className="app-section-title">
          <span>عروض اليوم</span>
          <button className="app-section-link" type="button">الكل ←</button>
        </h2>
        <div className="app-ads">
          {ADS.map((ad) => (
            <div
              key={ad.id}
              className="app-ad-card"
              style={{ ['--ad-color' as string]: ad.color } as React.CSSProperties}
            >
              <div className="app-ad-content">
                <h3>{ad.title}</h3>
                <p>{ad.subtitle}</p>
                <LockedAction
                  isLocked={true}
                  message="سجّل الآن للاستفادة من العروض"
                  className="app-ad-cta"
                >
                  استفد الآن
                </LockedAction>
              </div>
              <div className="app-ad-image" aria-hidden="true">{ad.image}</div>
            </div>
          ))}
        </div>
      </section>

      <section aria-label="الخدمات الطبية">
        <h2 className="app-section-title"><span>خدماتنا</span></h2>
        <div className="app-services-grid">
          {SERVICES.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </section>

      <div className="app-sos-section">
        <button className="app-sos-btn" type="button" aria-label="طوارئ - اتصال فوري">
          <span className="app-sos-icon" aria-hidden="true">🚨</span>
          <div>
            <div className="app-sos-title">طوارئ SOS</div>
            <div className="app-sos-subtitle">الإسعاف ١٢٢ · متاح ٢٤/٧</div>
          </div>
        </button>
      </div>

      <div className="app-bottom-spacer" />
      <BottomNav isGuest={true} hasActiveChat={false} />
    </main>
  );
}

function ServiceCard({ service }: { service: Service }) {
  if (service.locked) {
    return (
      <LockedAction
        isLocked={true}
        message={`سجّل الآن للوصول لـ"${service.title}"`}
        className="app-service-card locked"
      >
        <div className="app-service-icon" aria-hidden="true">{service.icon}</div>
        <div className="app-service-info">
          <h3 className="app-service-title">{service.title}</h3>
          <p className="app-service-desc">{service.desc}</p>
        </div>
      </LockedAction>
    );
  }

  return (
    <Link
      href={`/guest/services/${service.id}`}
      className="app-service-card"
      aria-label={`${service.title}: ${service.desc}`}
    >
      <div className="app-service-icon" aria-hidden="true">{service.icon}</div>
      <div className="app-service-info">
        <h3 className="app-service-title">{service.title}</h3>
        <p className="app-service-desc">{service.desc}</p>
      </div>
      <span className="app-service-arrow" aria-hidden="true">‹</span>
    </Link>
  );
}
