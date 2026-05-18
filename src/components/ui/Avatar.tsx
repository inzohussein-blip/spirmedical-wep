'use client';

import { forwardRef, useState, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * ═══════════════════════════════════════════════════════════════
 * Avatar Primitive — V25 (Design Tokens Aware)
 * ═══════════════════════════════════════════════════════════════
 *
 * استخدام:
 *   <Avatar src="/path/to/image.jpg" name="حسين أحمد" size="md" />
 *
 *   // بدون صورة (initial fallback)
 *   <Avatar name="حسين أحمد" />
 *
 *   // مع status indicator (active/inactive)
 *   <Avatar name="حسين" status="online" />
 *
 *   // مع badge (للنوع: doctor, patient, etc.)
 *   <Avatar name="د. علي" variant="specialist" />
 * ═══════════════════════════════════════════════════════════════
 */

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type AvatarVariant = 'default' | 'patient' | 'specialist' | 'admin';
type AvatarStatus = 'online' | 'offline' | 'away' | 'busy';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  /** اسم الشخص (للـ fallback initials) */
  name: string;
  /** رابط الصورة */
  src?: string | null;
  /** الحجم */
  size?: AvatarSize;
  /** نوع المستخدم (يحدد لون الخلفية) */
  variant?: AvatarVariant;
  /** حالة النشاط */
  status?: AvatarStatus;
  /** alt text للصورة (default: name) */
  alt?: string;
}

const SIZE_CLASSES: Record<AvatarSize, { box: string; text: string; status: string }> = {
  xs: { box: 'w-6 h-6', text: 'text-2xs', status: 'w-1.5 h-1.5' },
  sm: { box: 'w-8 h-8', text: 'text-xs', status: 'w-2 h-2' },
  md: { box: 'w-10 h-10', text: 'text-sm', status: 'w-2.5 h-2.5' },
  lg: { box: 'w-12 h-12', text: 'text-md', status: 'w-3 h-3' },
  xl: { box: 'w-16 h-16', text: 'text-lg', status: 'w-3.5 h-3.5' },
  '2xl': { box: 'w-20 h-20', text: 'text-xl', status: 'w-4 h-4' },
};

const VARIANT_CLASSES: Record<AvatarVariant, string> = {
  default: 'bg-paper-2 text-ink-2',
  patient: 'bg-rose-soft text-rose',
  specialist: 'bg-emerald-soft text-emerald-deep',
  admin: 'bg-amber-soft text-amber',
};

const STATUS_CLASSES: Record<AvatarStatus, string> = {
  online: 'bg-emerald',
  offline: 'bg-ink-4',
  away: 'bg-amber',
  busy: 'bg-rose',
};

/**
 * استخراج الأحرف الأولى من الاسم
 * "حسين أحمد علي" → "حأ"
 * "د. علي الحسيني" → "عا" (يتجاهل الـ titles)
 */
function getInitials(name: string): string {
  if (!name || name.trim().length === 0) return '?';

  // إزالة الـ titles الشائعة
  const cleaned = name
    .replace(/^(د\.|أ\.|دكتور|دكتورة|أستاذ|مهندس)\s*/i, '')
    .trim();

  const words = cleaned.split(/\s+/).filter(Boolean);

  if (words.length === 0) return '؟';
  if (words.length === 1) return words[0].charAt(0);

  // أخذ أول حرف من الكلمة الأولى والثانية
  return (words[0].charAt(0) + words[1].charAt(0));
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      className,
      name,
      src,
      size = 'md',
      variant = 'default',
      status,
      alt,
      ...props
    },
    ref
  ) => {
    const [imageError, setImageError] = useState(false);
    const sizeClasses = SIZE_CLASSES[size];
    const showImage = src && !imageError;
    const initials = getInitials(name);

    return (
      <div ref={ref} className={cn('relative inline-flex', className)} {...props}>
        <div
          className={cn(
            'flex items-center justify-center rounded-full font-extrabold overflow-hidden flex-shrink-0',
            sizeClasses.box,
            sizeClasses.text,
            VARIANT_CLASSES[variant]
          )}
          aria-label={alt || name}
        >
          {showImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={alt || name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <span aria-hidden="true">{initials}</span>
          )}
        </div>

        {status && (
          <span
            className={cn(
              'absolute -bottom-0.5 -end-0.5 rounded-full ring-2 ring-white',
              sizeClasses.status,
              STATUS_CLASSES[status]
            )}
            aria-label={`status: ${status}`}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

/* ─── AvatarGroup (لعرض مجموعة avatars متراكبة) ─────────── */

export interface AvatarGroupProps {
  /** قائمة الـ avatars */
  avatars: Array<{ name: string; src?: string | null; variant?: AvatarVariant }>;
  /** أقصى عدد يظهر (الباقي يظهر كـ +N) */
  max?: number;
  /** حجم كل avatar */
  size?: AvatarSize;
  className?: string;
}

export function AvatarGroup({
  avatars,
  max = 3,
  size = 'sm',
  className,
}: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className={cn('inline-flex -space-x-2', className)} dir="ltr">
      {visible.map((av, i) => (
        <Avatar
          key={i}
          name={av.name}
          src={av.src}
          variant={av.variant}
          size={size}
          className="ring-2 ring-white"
        />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            'flex items-center justify-center rounded-full font-extrabold bg-ink text-paper-3 ring-2 ring-white',
            SIZE_CLASSES[size].box,
            SIZE_CLASSES[size].text
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
