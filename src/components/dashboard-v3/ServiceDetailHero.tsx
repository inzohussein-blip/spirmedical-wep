/**
 * ════════════════════════════════════════════════════════════════════
 * 🦸 ServiceDetailHero - V26.3
 * ════════════════════════════════════════════════════════════════════
 * 
 * Hero قابل لإعادة الاستخدام في كل صفحات التفاصيل
 * يدعم: gradient backgrounds + decorative circles + stats
 * ════════════════════════════════════════════════════════════════════
 */

import type { Icon as TablerIcon } from '@tabler/icons-react';

interface Stat {
  icon: TablerIcon;
  value: string | number;
  label: string;
}

interface Props {
  // اللون الأساسي للـ Gradient
  color: string;
  colorDeep?: string;
  
  // الأيقونة الكبيرة في الـ Hero (Avatar style)
  icon?: TablerIcon;
  iconEmoji?: string;
  iconBg?: string;
  iconColor?: string;
  imageSrc?: string;
  
  // النصوص
  subtitle?: string;
  title: string;
  titleSecondary?: string;
  
  // Badges
  badges?: Array<{
    label: string;
    color: string;
    bg: string;
    icon?: TablerIcon;
  }>;
  
  // إحصاءات (3 صفوف عادةً)
  stats?: Stat[];
  
  // Optional content أسفل الـ Hero
  children?: React.ReactNode;
}

export default function ServiceDetailHero({
  color,
  colorDeep,
  icon: Icon,
  iconEmoji,
  iconBg,
  iconColor,
  imageSrc,
  subtitle,
  title,
  titleSecondary,
  badges,
  stats,
  children,
}: Props) {
  const gradientEnd = colorDeep || color;
  
  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${color} 0%, ${gradientEnd} 100%)`,
        color: '#FFFFFF',
        margin: 14,
        borderRadius: 20,
        padding: 18,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: `0 4px 16px ${color}26`,
      }}
    >
      {/* Decorative circles */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          width: 160,
          height: 160,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          top: -50,
          right: -50,
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
          bottom: -30,
          left: -30,
        }}
      />
      
      {/* الصف العلوي: Icon + Title */}
      <div
        style={{
          display: 'flex',
          gap: 14,
          alignItems: 'center',
          position: 'relative',
        }}
      >
        {/* Icon / Avatar / Image */}
        {imageSrc ? (
          <div
            style={{
              width: 70,
              height: 70,
              borderRadius: '50%',
              overflow: 'hidden',
              flexShrink: 0,
              background: 'rgba(255,255,255,0.15)',
              border: '2px solid rgba(255,255,255,0.3)',
            }}
          >
            <img
              src={imageSrc}
              alt={title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        ) : (
          <div
            style={{
              width: 70,
              height: 70,
              borderRadius: iconEmoji ? 16 : '50%',
              background: iconBg || 'rgba(255,255,255,0.2)',
              color: iconColor || '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: 32,
            }}
          >
            {iconEmoji ? (
              <span>{iconEmoji}</span>
            ) : Icon ? (
              <Icon size={34} stroke={1.75} />
            ) : null}
          </div>
        )}
        
        <div style={{ flex: 1, minWidth: 0 }}>
          {subtitle && (
            <div style={{ fontSize: 11, opacity: 0.85, marginBottom: 2 }}>
              {subtitle}
            </div>
          )}
          <h2
            style={{
              fontSize: 18,
              fontWeight: 900,
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {title}
          </h2>
          {titleSecondary && (
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
              {titleSecondary}
            </div>
          )}
          
          {/* Badges */}
          {badges && badges.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
              {badges.map((b, i) => {
                const BadgeIcon = b.icon;
                return (
                  <span
                    key={i}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      padding: '2px 8px',
                      background: 'rgba(255,255,255,0.18)',
                      borderRadius: 10,
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {BadgeIcon && <BadgeIcon size={11} stroke={2.5} />}
                    {b.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Stats Row */}
      {stats && stats.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
            gap: 8,
            marginTop: 14,
            paddingTop: 14,
            borderTop: '1px solid rgba(255,255,255,0.15)',
            position: 'relative',
          }}
        >
          {stats.map((stat, i) => {
            const StatIcon = stat.icon;
            return (
              <div
                key={i}
                style={{
                  textAlign: 'center',
                  padding: 6,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: 4,
                    opacity: 0.85,
                  }}
                >
                  <StatIcon size={16} stroke={2} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 900 }}>{stat.value}</div>
                <div style={{ fontSize: 9, opacity: 0.75, marginTop: 1 }}>
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Children */}
      {children && (
        <div style={{ marginTop: 14, position: 'relative' }}>
          {children}
        </div>
      )}
    </div>
  );
}
