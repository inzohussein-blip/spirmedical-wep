/**
 * ════════════════════════════════════════════════════════════════════
 * 🦸 HeroCardV3 - V26.0
 * ════════════════════════════════════════════════════════════════════
 * 
 * بطاقة الترحيب الأخضرة الكبيرة في رأس الـ Dashboard
 * - Avatar 40×40 دائري
 * - الاسم + الإشعارات
 * - 2 stats pills (فحوصات + وصفات)
 * - decorative circles بـ rgba بيضاء
 * ════════════════════════════════════════════════════════════════════
 */

import Link from 'next/link';
import { IconBell, IconFlask, IconPill } from '@tabler/icons-react';

interface Props {
  firstName: string;
  testsCount: number;
  prescriptionsCount: number;
  hasUnreadNotifications?: boolean;
}

export default function HeroCardV3({
  firstName,
  testsCount,
  prescriptionsCount,
  hasUnreadNotifications,
}: Props) {
  // الحرف الأول للأفاتار
  const initial = firstName?.[0] || 'م';
  
  return (
    <div
      style={{
        background: '#01875F',
        margin: '6px 6px 14px',
        borderRadius: 20,
        padding: 16,
        position: 'relative',
        overflow: 'hidden',
        color: '#fff',
      }}
    >
      {/* Decorative circles */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
          top: -40,
          right: -40,
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          width: 90,
          height: 90,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
          bottom: -20,
          left: -20,
        }}
      />
      
      {/* الصف الأعلى: Avatar + اسم + جرس */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 14,
          position: 'relative',
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: '#E6F3EF',
            color: '#01875F',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 900,
            fontFamily: 'Tajawal, sans-serif',
            flexShrink: 0,
          }}
        >
          {initial}
        </div>
        
        {/* Greeting */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, opacity: 0.85, marginBottom: 1 }}>
            مرحباً 👋
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {firstName}
          </div>
        </div>
        
        {/* Bell */}
        <Link
          href="/account/notifications"
          aria-label="الإشعارات"
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.18)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            position: 'relative',
            flexShrink: 0,
            textDecoration: 'none',
          }}
        >
          <IconBell size={18} stroke={2.2} />
          {hasUnreadNotifications && (
            <span
              aria-hidden
              style={{
                position: 'absolute',
                top: 6,
                left: 6,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#C71C56',
                border: '1.5px solid #01875F',
              }}
            />
          )}
        </Link>
      </div>
      
      {/* Stats Pills */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          position: 'relative',
        }}
      >
        <StatPill
          icon={<IconFlask size={14} stroke={2.2} />}
          value={testsCount}
          label="فحوصات"
        />
        <StatPill
          icon={<IconPill size={14} stroke={2.2} />}
          value={prescriptionsCount}
          label="وصفات"
        />
      </div>
    </div>
  );
}

function StatPill({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        background: 'rgba(255,255,255,0.14)',
        borderRadius: 12,
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        backdropFilter: 'blur(8px)',
      }}
    >
      <span style={{ opacity: 0.9 }}>{icon}</span>
      <span style={{ fontSize: 14, fontWeight: 800 }}>{value}</span>
      <span style={{ fontSize: 11, opacity: 0.85 }}>{label}</span>
    </div>
  );
}
