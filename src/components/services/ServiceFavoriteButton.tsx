'use client';

import { useState, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { toggleServiceFavorite, type ServiceType } from './favorites-actions';
import { toast } from '@/components/ui/Toaster';

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
 * يستخدم في صفحات التفاصيل الثماني — انظر `ServiceType` في `favorites-actions`.
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

  /**
   * ⚠️ كان الفشل يُبتلع كلّياً: `if (result.ok)` بلا فرعٍ آخر. فحين رفضت
   * القاعدة نوعَي `mental_health` و`nutritionist` (قيدُ CHECK كان يحمل
   * `mental`/`nutrition`) كان المستخدم يضغط القلب فلا يحدث **شيء** — لا
   * تغيّر ولا رسالة. الخطأ نفسه أُصلح في الترحيل 0017، لكنّ ابتلاع
   * الفشل هو ما أخفاه؛ فهذا هو الإصلاح الأهمّ.
   *
   * `toggleServiceFavorite` إجراءُ خادم: يرمي عند انقطاع الشبكة بدل أن
   * يُرجع `{ok:false}` — لذا نلتقط الحالتين معاً.
   */
  function handleClick() {
    startTransition(async () => {
      try {
        const result = await toggleServiceFavorite(serviceType, serviceId);
        if (result.ok) {
          setIsFavorite(result.favorited ?? false);
          return;
        }
        toast.error(
          result.error === 'unauthorized'
            ? 'سجّل دخولك لحفظ المفضّلة'
            : 'تعذّر حفظ المفضّلة — حاول مجدداً'
        );
      } catch {
        toast.error('تعذّر الاتصال — تحقّق من الإنترنت');
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
