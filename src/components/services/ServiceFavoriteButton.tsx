'use client';

import { useState, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { toggleServiceFavorite, type ServiceType } from './favorites-actions';

interface Props {
  serviceType: ServiceType;
  serviceId: string;
  initialIsFavorite?: boolean;
  variant?: 'icon' | 'pill';
  size?: 'sm' | 'md';
}

/**
 * ════════════════════════════════════════════════════════════════════
 * ❤️ V25.47: Favorite Button Component
 * ════════════════════════════════════════════════════════════════════
 * يستخدم في detail pages لـ hospital/dental/optical/pharmacy/doctor
 * ════════════════════════════════════════════════════════════════════
 */

export default function ServiceFavoriteButton({ 
  serviceType, 
  serviceId, 
  initialIsFavorite = false,
  variant = 'icon',
  size = 'md',
}: Props) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await toggleServiceFavorite(serviceType, serviceId);
      if (result.ok) {
        setIsFavorite(result.favorited ?? false);
      }
    });
  }

  const iconSize = size === 'sm' ? 14 : 18;

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-label={isFavorite ? 'إزالة من المفضّلة' : 'إضافة للمفضّلة'}
        style={{
          width: size === 'sm' ? 32 : 38,
          height: size === 'sm' ? 32 : 38,
          borderRadius: '50%',
          background: isFavorite ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)',
          border: 0,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isPending ? 0.6 : 1,
          transition: 'all 0.2s',
        }}
      >
        <Heart 
          size={iconSize} 
          strokeWidth={2.2}
          fill={isFavorite ? '#FF6B6B' : 'transparent'}
          stroke={isFavorite ? '#FF6B6B' : 'white'}
        />
      </button>
    );
  }

  // Pill variant
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      style={{
        padding: size === 'sm' ? '6px 12px' : '8px 14px',
        background: isFavorite ? '#FCEBEB' : 'var(--paper-2)',
        color: isFavorite ? '#A32D2D' : 'var(--ink-2)',
        border: 0,
        borderRadius: 8,
        fontSize: size === 'sm' ? 11 : 12,
        fontWeight: 700,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        opacity: isPending ? 0.6 : 1,
      }}
    >
      <Heart 
        size={iconSize - 2}
        strokeWidth={2.4}
        fill={isFavorite ? '#A32D2D' : 'transparent'}
      />
      {isFavorite ? 'مُفضّل' : 'أضف للمفضّلة'}
    </button>
  );
}
