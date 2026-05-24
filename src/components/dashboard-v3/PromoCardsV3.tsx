/**
 * ════════════════════════════════════════════════════════════════════
 * 📦 PromoCardsV3 - V26.2
 * ════════════════════════════════════════════════════════════════════
 * بطاقات إعلانية بين السيرش وستوريز
 * ════════════════════════════════════════════════════════════════════
 */

import Link from 'next/link';
import { IconArrowLeft } from '@tabler/icons-react';
import { PROMO_CARDS } from '@/lib/services-v3';

export default function PromoCardsV3() {
  if (PROMO_CARDS.length === 0) return null;
  
  return (
    <div style={{ padding: '0 14px 14px' }}>
      {PROMO_CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <Link
            key={card.id}
            href={card.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 14,
              background: '#FFFFFF',
              border: '0.5px solid #DADCE0',
              borderRadius: 14,
              textDecoration: 'none',
              color: 'inherit',
              marginBottom: PROMO_CARDS.length > 1 ? 8 : 0,
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: card.bg, color: card.color,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Icon size={24} stroke={1.75} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ 
                display: 'inline-block',
                fontSize: 9, fontWeight: 700,
                background: '#FBBC04', color: '#202124',
                padding: '2px 8px', borderRadius: 9999,
                marginBottom: 4,
              }}>
                {card.tag}
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#202124', marginBottom: 2 }}>
                {card.title}
              </div>
              <div style={{ fontSize: 11, color: '#5F6368', lineHeight: 1.4 }}>
                {card.subtitle}
              </div>
            </div>
            <IconArrowLeft size={18} stroke={2} color="#80868B" />
          </Link>
        );
      })}
    </div>
  );
}
