'use client';

import { useState, useTransition } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/Toaster';
import { toggleFavorite, type FavoriteType } from '@/app/(dashboard)/favorites/actions';

/**
 * ═══════════════════════════════════════════════════════════════
 * FavoriteButton (V25.11)
 * ═══════════════════════════════════════════════════════════════
 * زر "إضافة للمفضّلة" قابل للاستخدام في كل البطاقات
 * ═══════════════════════════════════════════════════════════════
 */

interface Props {
  type: FavoriteType;
  referenceId: string;
  initialIsFavorite?: boolean;
  displayName: string;
  displaySubtitle?: string;
  displayIcon?: string;
  displayMeta?: Record<string, unknown>;
  variant?: 'icon' | 'pill';
  size?: 'sm' | 'md';
}

export default function FavoriteButton({
  type,
  referenceId,
  initialIsFavorite = false,
  displayName,
  displaySubtitle,
  displayIcon,
  displayMeta,
  variant = 'icon',
  size = 'md',
}: Props) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isPending, startTransition] = useTransition();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      const result = await toggleFavorite({
        type,
        referenceId,
        displayName,
        displaySubtitle,
        displayIcon,
        displayMeta,
      });

      if (result.success) {
        setIsFavorite(result.isFavorite ?? false);
        toast.success(result.isFavorite ? 'أُضيف للمفضّلة ⭐' : 'تمت الإزالة');
      } else {
        toast.error(result.error || 'فشلت العملية');
      }
    });
  };

  const sizePx = size === 'sm' ? 28 : 36;
  const iconSize = size === 'sm' ? 12 : 16;

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '6px 12px',
          background: isFavorite ? 'var(--rose)' : 'var(--white)',
          color: isFavorite ? 'var(--paper-3)' : 'var(--ink-2)',
          border: '1px solid',
          borderColor: isFavorite ? 'var(--rose)' : 'var(--line)',
          borderRadius: 100,
          cursor: isPending ? 'wait' : 'pointer',
          fontFamily: 'inherit',
          fontSize: 11,
          fontWeight: 700,
        }}
        aria-label={isFavorite ? 'إزالة من المفضّلة' : 'إضافة للمفضّلة'}
      >
        {isPending ? (
          <Loader2 size={iconSize} className="animate-spin" />
        ) : (
          <Heart size={iconSize} fill={isFavorite ? 'currentColor' : 'none'} />
        )}
        <span>{isFavorite ? 'محفوظ' : 'حفظ'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      style={{
        width: sizePx,
        height: sizePx,
        background: isFavorite ? 'var(--rose-soft)' : 'var(--paper-3)',
        color: isFavorite ? 'var(--rose)' : 'var(--ink-3)',
        border: 'none',
        borderRadius: '50%',
        cursor: isPending ? 'wait' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
      aria-label={isFavorite ? 'إزالة من المفضّلة' : 'إضافة للمفضّلة'}
    >
      {isPending ? (
        <Loader2 size={iconSize} className="animate-spin" />
      ) : (
        <Heart
          size={iconSize}
          fill={isFavorite ? 'currentColor' : 'none'}
          strokeWidth={isFavorite ? 0 : 2}
        />
      )}
    </button>
  );
}
