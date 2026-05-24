/**
 * ════════════════════════════════════════════════════════════════════
 * ⭐ FeaturedServiceCardV3 - V26.0
 * ════════════════════════════════════════════════════════════════════
 * 
 * بطاقة الخدمة المميّزة (سحب الدم) - أبرز من Bento Cards
 * - أيقونة كبيرة 76×76 بخلفية ناعمة
 * - Badge "الأكثر طلباً"
 * - عنوان كبير + وصف + meta
 * ════════════════════════════════════════════════════════════════════
 */

import Link from 'next/link';
import { IconClock, IconCash, IconArrowLeft } from '@tabler/icons-react';
import { FEATURED_SERVICE } from '@/lib/services-v3';

interface Props {
  duration?: string;     // e.g. "30 دقيقة"
  priceFrom?: number;    // e.g. 15
}

export default function FeaturedServiceCardV3({
  duration = '30 دقيقة',
  priceFrom = 15,
}: Props) {
  const service = FEATURED_SERVICE;
  const Icon = service.icon;
  
  return (
    <Link
      href={service.route}
      style={{
        display: 'block',
        margin: '0 14px 14px',
        background: '#FFFFFF',
        border: '0.5px solid #DADCE0',
        borderRadius: 18,
        padding: 14,
        textDecoration: 'none',
        color: 'inherit',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative circle */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: service.softBg,
          opacity: 0.5,
          top: -40,
          left: -40,
        }}
      />
      
      <div style={{ display: 'flex', gap: 12, position: 'relative' }}>
        {/* Icon box */}
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: 16,
            background: service.softBg,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={36} stroke={1.75} color={service.color} />
        </div>
        
        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Badge */}
          {service.badge && (
            <span
              style={{
                display: 'inline-block',
                background: '#FBBC04',
                color: '#202124',
                fontSize: 9,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 9999,
                marginBottom: 6,
              }}
            >
              {service.badge}
            </span>
          )}
          
          {/* Title */}
          <h3
            style={{
              fontSize: 15,
              fontWeight: 700,
              margin: '0 0 4px',
              color: '#202124',
              lineHeight: 1.3,
            }}
          >
            {service.title}
          </h3>
          
          {/* Description */}
          <p
            style={{
              fontSize: 11,
              color: '#5F6368',
              margin: '0 0 8px',
              lineHeight: 1.5,
            }}
          >
            {service.description} · نتائج رقمية
          </p>
          
          {/* Meta */}
          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                fontSize: 11,
                color: '#5F6368',
                fontWeight: 500,
              }}
            >
              <IconClock size={12} stroke={2.2} />
              {duration}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                fontSize: 11,
                color: '#01875F',
                fontWeight: 700,
              }}
            >
              <IconCash size={12} stroke={2.2} />
              من ${priceFrom}
            </span>
          </div>
        </div>
        
        {/* Arrow */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            color: '#5F6368',
          }}
        >
          <IconArrowLeft size={16} stroke={2.2} />
        </div>
      </div>
    </Link>
  );
}
