'use client';

import React from 'react';
import Link from 'next/link';
import {
  Inbox, Search, Calendar, FileX, MessageCircle, Heart,
  Stethoscope, Building2, Pill, FlaskConical, Star, AlertCircle,
  Sparkles, Users, ShoppingBag, Bell, Wifi, type LucideIcon,
} from 'lucide-react';

/**
 * ═══════════════════════════════════════════════════════════════
 * 🌱 EmptyStateV2 (V25.12)
 * ═══════════════════════════════════════════════════════════════
 *
 * Empty state محسّن بصرياً:
 *   ✓ أيقونة مع gradient background
 *   ✓ Emoji decorative على الأيقونة
 *   ✓ animation float ناعمة
 *   ✓ متعدّد الأنواع (17 variant)
 *   ✓ يدعم CTA + secondary CTA
 *
 * مثال:
 *   <EmptyStateV2
 *     variant="favorites"
 *     cta={{ label: 'تصفّح الأطباء', href: '/services/doctors' }}
 *   />
 * ═══════════════════════════════════════════════════════════════
 */

export type EmptyVariant =
  | 'inbox' | 'search' | 'appointments' | 'messages' | 'favorites'
  | 'doctors' | 'hospitals' | 'pharmacies' | 'tests' | 'reviews'
  | 'error' | 'noResults' | 'family' | 'products' | 'notifications'
  | 'offline' | 'custom';

interface VariantConfig {
  icon: LucideIcon;
  emoji: string;
  defaultTitle: string;
  defaultDescription: string;
  color: string;
  bgColor: string;
}

const VARIANTS: Record<EmptyVariant, VariantConfig> = {
  inbox:         { icon: Inbox,        emoji: '📭', defaultTitle: 'لا يوجد شيء هنا',         defaultDescription: 'هذه المنطقة فارغة حالياً',           color: 'var(--ink-3)',  bgColor: 'var(--paper-3)' },
  search:        { icon: Search,       emoji: '🔍', defaultTitle: 'لا توجد نتائج',           defaultDescription: 'جرّب كلمات بحث مختلفة',              color: 'var(--amber)',  bgColor: 'var(--amber-soft)' },
  appointments:  { icon: Calendar,     emoji: '📅', defaultTitle: 'لا توجد حجوزات',          defaultDescription: 'احجز أول خدمة طبية لك',              color: 'var(--emerald)', bgColor: 'var(--emerald-soft)' },
  messages:      { icon: MessageCircle, emoji: '💬', defaultTitle: 'لا توجد رسائل',           defaultDescription: 'ابدأ استشارة لرؤية الرسائل هنا',     color: 'var(--emerald)', bgColor: 'var(--emerald-soft)' },
  favorites:     { icon: Heart,        emoji: '⭐', defaultTitle: 'لا توجد مفضّلات',          defaultDescription: 'احفظ أطبائك والمستشفيات للوصول السريع', color: 'var(--rose)',    bgColor: 'var(--rose-soft)' },
  doctors:       { icon: Stethoscope,  emoji: '👨‍⚕️', defaultTitle: 'لا يوجد أطباء',           defaultDescription: 'سنُضيف أطباء قريباً',                 color: 'var(--emerald)', bgColor: 'var(--emerald-soft)' },
  hospitals:     { icon: Building2,    emoji: '🏥', defaultTitle: 'لا توجد مستشفيات',         defaultDescription: 'لم نجد مستشفيات تطابق بحثك',         color: 'var(--amber)',  bgColor: 'var(--amber-soft)' },
  pharmacies:    { icon: Pill,         emoji: '💊', defaultTitle: 'لا توجد صيدليات',          defaultDescription: 'لم نجد صيدليات في منطقتك',           color: 'var(--emerald)', bgColor: 'var(--emerald-soft)' },
  tests:         { icon: FlaskConical, emoji: '🧪', defaultTitle: 'لا توجد فحوصات',           defaultDescription: 'احجز فحصاً مخبرياً',                  color: 'var(--rose)',    bgColor: 'var(--rose-soft)' },
  reviews:       { icon: Star,         emoji: '⭐', defaultTitle: 'لا توجد تقييمات',          defaultDescription: 'كن أول من يُقيّم هذه الخدمة',         color: 'var(--amber)',  bgColor: 'var(--amber-soft)' },
  error:         { icon: AlertCircle,  emoji: '⚠️', defaultTitle: 'حدث خطأ',                defaultDescription: 'لم نتمكّن من تحميل المحتوى',         color: 'var(--rose)',    bgColor: 'var(--rose-soft)' },
  noResults:     { icon: FileX,        emoji: '🗂️', defaultTitle: 'لا توجد نتائج',           defaultDescription: 'جرّب فلاتر مختلفة',                  color: 'var(--ink-3)',  bgColor: 'var(--paper-3)' },
  family:        { icon: Users,        emoji: '👨‍👩‍👧‍👦', defaultTitle: 'لم تُضف أفراد العائلة بعد', defaultDescription: 'أضف أبناءك ووالديك لإدارة صحّتهم',   color: 'var(--emerald)', bgColor: 'var(--emerald-soft)' },
  products:      { icon: ShoppingBag,  emoji: '🛍️', defaultTitle: 'لا توجد منتجات',           defaultDescription: 'لم نجد منتجات تطابق فلترك',          color: 'var(--amber)',  bgColor: 'var(--amber-soft)' },
  notifications: { icon: Bell,         emoji: '🔔', defaultTitle: 'لا توجد إشعارات',          defaultDescription: 'سنُعلمك عند وجود تحديثات',           color: 'var(--ink-3)',  bgColor: 'var(--paper-3)' },
  offline:       { icon: Wifi,         emoji: '📡', defaultTitle: 'لا يوجد اتصال',            defaultDescription: 'تحقّق من اتصال الإنترنت وحاول مجدّداً', color: 'var(--rose)',    bgColor: 'var(--rose-soft)' },
  custom:        { icon: Sparkles,     emoji: '✨', defaultTitle: '',                       defaultDescription: '',                                    color: 'var(--emerald)', bgColor: 'var(--emerald-soft)' },
};

interface CTAProps {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface Props {
  variant?: EmptyVariant;
  title?: string;
  description?: string;
  emoji?: string;
  cta?: CTAProps;
  secondaryCta?: CTAProps;
  size?: 'sm' | 'md' | 'lg';
}

export default function EmptyStateV2({
  variant = 'inbox',
  title,
  description,
  emoji,
  cta,
  secondaryCta,
  size = 'md',
}: Props) {
  const config = VARIANTS[variant];
  const Icon = config.icon;

  const finalTitle = title ?? config.defaultTitle;
  const finalDescription = description ?? config.defaultDescription;
  const finalEmoji = emoji ?? config.emoji;

  const sizeConfig = {
    sm: { iconWrap: 56, iconSize: 26, paddingY: 24, titleSize: 13, descSize: 11, badgeSize: 22 },
    md: { iconWrap: 80, iconSize: 36, paddingY: 36, titleSize: 15, descSize: 12, badgeSize: 28 },
    lg: { iconWrap: 100, iconSize: 44, paddingY: 48, titleSize: 17, descSize: 13, badgeSize: 34 },
  }[size];

  return (
    <div
      style={{
        textAlign: 'center',
        padding: `${sizeConfig.paddingY}px 20px`,
        animation: 'esv2-fadeIn 0.5s ease',
      }}
    >
      <style>{`
        @keyframes esv2-fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes esv2-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes esv2-pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 0.8; }
        }
      `}</style>

      {/* Icon */}
      <div
        style={{
          width: sizeConfig.iconWrap,
          height: sizeConfig.iconWrap,
          margin: '0 auto 18px',
          position: 'relative',
          animation: 'esv2-float 3s ease-in-out infinite',
        }}
      >
        {/* Pulsing ring */}
        <div
          style={{
            position: 'absolute',
            inset: -8,
            background: config.bgColor,
            borderRadius: '50%',
            animation: 'esv2-pulse 2.5s ease-in-out infinite',
            zIndex: 0,
          }}
        />

        {/* Main circle */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            background: config.bgColor,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          <Icon
            size={sizeConfig.iconSize}
            color={config.color}
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </div>

        {/* Emoji badge */}
        <div
          style={{
            position: 'absolute',
            top: -2,
            insetInlineEnd: -2,
            width: sizeConfig.badgeSize,
            height: sizeConfig.badgeSize,
            background: 'var(--white)',
            border: '2px solid var(--line)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: sizeConfig.badgeSize / 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            zIndex: 2,
          }}
        >
          {finalEmoji}
        </div>
      </div>

      {/* Title */}
      {finalTitle && (
        <h3
          style={{
            fontSize: sizeConfig.titleSize,
            fontWeight: 800,
            margin: '0 0 6px',
            color: 'var(--ink)',
          }}
        >
          {finalTitle}
        </h3>
      )}

      {/* Description */}
      {finalDescription && (
        <p
          style={{
            fontSize: sizeConfig.descSize,
            color: 'var(--ink-3)',
            margin: '0 0 18px',
            lineHeight: 1.7,
            maxWidth: 300,
            marginInline: 'auto',
          }}
        >
          {finalDescription}
        </p>
      )}

      {/* CTAs */}
      {(cta || secondaryCta) && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {cta && <CtaButton {...cta} primary color={config.color} />}
          {secondaryCta && <CtaButton {...secondaryCta} color={config.color} />}
        </div>
      )}
    </div>
  );
}

function CtaButton({
  label,
  href,
  onClick,
  primary,
  color,
}: CTAProps & { primary?: boolean; color: string }) {
  const styles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 18px',
    background: primary ? color : 'var(--white)',
    color: primary ? 'var(--paper-3)' : color,
    border: '1px solid',
    borderColor: color,
    borderRadius: 100,
    textDecoration: 'none',
    fontSize: 12,
    fontWeight: 800,
    fontFamily: 'inherit',
    cursor: 'pointer',
  };

  if (href) {
    return (
      <Link href={href} style={styles}>
        {label}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} style={styles}>
      {label}
    </button>
  );
}
