'use client';

import { useState } from 'react';
import { Share2, Copy, Check, Loader2 } from 'lucide-react';
import { haptic } from '@/lib/haptic';
import { toast } from '@/components/ui/Toaster';

/**
 * ═══════════════════════════════════════════════════════════════
 * 🔗 Share Button (V25.17)
 * ═══════════════════════════════════════════════════════════════
 *
 * استخدام Web Share API الأصلي عند الدعم،
 * أو fallback لـ copy-to-clipboard
 *
 * Browser support:
 *   ✓ Safari iOS/macOS
 *   ✓ Chrome Android
 *   ✓ Edge
 *   ✗ Firefox desktop (fallback)
 *
 * Usage:
 *   <ShareButton
 *     title="د. أحمد - طبيب باطنية"
 *     text="جرّب الحجز عبر Spir Medical"
 *     url="/services/doctors/123"
 *   />
 *
 *   <ShareButton variant="icon" {...props} />     // فقط أيقونة
 *   <ShareButton variant="text" {...props} />     // فقط نص
 *   <ShareButton variant="full" {...props} />     // أيقونة + نص
 * ═══════════════════════════════════════════════════════════════
 */

interface Props {
  /** عنوان المشاركة */
  title: string;
  /** نص المشاركة */
  text?: string;
  /** URL (لو نسبي، يُحوَّل لـ absolute) */
  url?: string;
  /** نص الزر */
  label?: string;
  /** نوع العرض */
  variant?: 'icon' | 'text' | 'full';
  /** حجم */
  size?: 'sm' | 'md' | 'lg';
  /** style إضافي */
  className?: string;
}

export default function ShareButton({
  title,
  text,
  url,
  label = 'مشاركة',
  variant = 'full',
  size = 'md',
}: Props) {
  const [isSharing, setIsSharing] = useState(false);
  const [justCopied, setJustCopied] = useState(false);

  const handleShare = async () => {
    haptic.light();

    // ─── إعداد البيانات ───
    const fullUrl = url
      ? (url.startsWith('http') ? url : `${window.location.origin}${url}`)
      : window.location.href;

    const shareData: ShareData = {
      title,
      ...(text && { text }),
      url: fullUrl,
    };

    setIsSharing(true);

    try {
      // ─── Native Share API ───
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        haptic.success();
      } else {
        // ─── Fallback: copy to clipboard ───
        const textToCopy = `${title}${text ? '\n\n' + text : ''}\n\n${fullUrl}`;
        await navigator.clipboard.writeText(textToCopy);
        setJustCopied(true);
        haptic.success();
        toast.success('تم النسخ - الصقه أينما تريد');
        setTimeout(() => setJustCopied(false), 2000);
      }
    } catch (e) {
      const error = e as Error;
      // المستخدم ألغى - ليس خطأ
      if (error.name === 'AbortError') return;
      console.error('Share error:', e);
      toast.error('فشلت المشاركة');
    } finally {
      setIsSharing(false);
    }
  };

  // ─── Size config ───
  const sizeConfig = {
    sm: { padding: '6px 10px', fontSize: 11, iconSize: 14 },
    md: { padding: '8px 14px', fontSize: 12, iconSize: 16 },
    lg: { padding: '10px 18px', fontSize: 13, iconSize: 18 },
  }[size];

  const iconOnly = variant === 'icon';
  const Icon = justCopied ? Check : Share2;

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={isSharing}
      aria-label={label}
      style={{
        padding: iconOnly ? sizeConfig.padding.split(' ')[0] : sizeConfig.padding,
        width: iconOnly ? 'auto' : undefined,
        aspectRatio: iconOnly ? '1' : undefined,
        background: justCopied ? 'var(--emerald)' : 'var(--white)',
        color: justCopied ? 'var(--paper-3)' : 'var(--emerald)',
        border: '1px solid',
        borderColor: justCopied ? 'var(--emerald)' : 'var(--line)',
        borderRadius: iconOnly ? '50%' : 100,
        cursor: isSharing ? 'wait' : 'pointer',
        fontFamily: 'inherit',
        fontSize: sizeConfig.fontSize,
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        transition: 'all 0.2s ease',
      }}
    >
      {isSharing ? (
        <Loader2 size={sizeConfig.iconSize} className="animate-spin" />
      ) : (
        <Icon size={sizeConfig.iconSize} />
      )}
      {variant !== 'icon' && (
        <span>{justCopied ? 'تم النسخ' : label}</span>
      )}
    </button>
  );
}
