/**
 * ════════════════════════════════════════════════════════════════════
 * 🟦 BentoServicesGridV3 - V26.2
 * ════════════════════════════════════════════════════════════════════
 * شبكة الخدمات الـ 15 المتبقّية (Bento style)
 * ════════════════════════════════════════════════════════════════════
 */

import Link from 'next/link';
import { IconArrowLeft } from '@tabler/icons-react';
import { CORE_SERVICES, type ServiceConfig } from '@/lib/services-v3';
import { getServiceSwitches } from '@/lib/service-switches.server';
import { isEnabled } from '@/lib/service-switches';

export default async function BentoServicesGridV3() {
  // مصدرُ «قريباً» صار القاعدة لا ثابتاً في الكود. و`cache` من React تجعل
  // هذا النداءَ نفسه الذي أجراه التخطيط في الطلب ذاته — لا رحلةً ثانية.
  const switches = await getServiceSwitches();
  return (
    <div style={{ padding: '0 14px 14px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: '#3C4043', margin: 0 }}>
          خدماتنا
        </h2>
        <span style={{ fontSize: 11, color: '#5F6368' }}>
          {CORE_SERVICES.length} خدمة
        </span>
      </div>
      
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
      }}>
        {CORE_SERVICES.map((service) => (
          <BentoCard
            key={service.id}
            service={service}
            disabled={!isEnabled(switches, service.id)}
          />
        ))}
      </div>
    </div>
  );
}

function BentoCard({
  service,
  disabled,
}: {
  service: ServiceConfig;
  disabled: boolean;
}) {
  const Icon = service.icon;
  // مطفأةٌ من اللوحة، أو معلَّمةٌ «قريباً» في الإعداد الساكن — كلاهما يمنع
  const isComingSoon = disabled || service.badge === 'قريباً';
  const badge = isComingSoon ? 'قريباً' : service.badge;
  
  const cardContent = (
    <>
      <div aria-hidden style={{
        position: 'absolute', width: 70, height: 70, borderRadius: '50%',
        background: service.softBg, opacity: 0.7, top: -12, left: -12,
      }} />
      
      {badge && (
        <span style={{
          position: 'absolute', top: 10, right: 10,
          background: badge === 'جديد' ? 'var(--rose, #C71C56)'
            : badge === 'الأكثر طلباً' ? '#FBBC04' : '#F1F3F4',
          color: badge === 'جديد' ? '#FFFFFF'
            : badge === 'الأكثر طلباً' ? '#202124' : '#5F6368',
          fontSize: 11, fontWeight: 700,
          padding: '2px 7px', borderRadius: 9999, zIndex: 2,
        }}>
          {badge}
        </span>
      )}
      
      <div style={{ marginBottom: 12, position: 'relative', zIndex: 1 }}>
        <Icon size={26} stroke={1.75} color={service.color} />
      </div>
      
      <div style={{
        fontSize: 12, fontWeight: 600, color: '#202124',
        marginBottom: 3, position: 'relative', zIndex: 1,
        lineHeight: 1.3,
      }}>
        {service.title}
      </div>
      
      <div style={{
        fontSize: 11, color: '#5F6368', lineHeight: 1.4,
        position: 'relative', zIndex: 1,
      }}>
        {service.description}
      </div>
      
      <div style={{
        position: 'absolute', bottom: 10, left: 10, color: '#80868B',
      }}>
        <IconArrowLeft size={14} stroke={2} />
      </div>
    </>
  );
  
  const cardStyle: React.CSSProperties = {
    background: '#FFFFFF',
    border: '0.5px solid #DADCE0',
    borderRadius: 14,
    padding: 14,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 110,
    textDecoration: 'none',
    color: 'inherit',
    cursor: isComingSoon ? 'default' : 'pointer',
    opacity: isComingSoon ? 0.55 : 1,
    display: 'block',
  };
  
  if (isComingSoon) {
    // لا رابط. و`aria-disabled` كي يعرف قارئُ الشاشة أنّها معروضةٌ لا مُتاحة.
    return (
      <div style={cardStyle} aria-disabled="true">
        {cardContent}
      </div>
    );
  }
  
  return (
    <Link href={service.route} style={cardStyle}>
      {cardContent}
    </Link>
  );
}
