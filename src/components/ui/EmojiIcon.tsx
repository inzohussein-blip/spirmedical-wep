import type { CSSProperties, ReactNode } from 'react';
import { EMOJI_ICONS, EMOJI_TONE, STATUS_DOTS, normalizeEmoji } from '@/lib/emoji-icons';
import { ICON_STROKE, ICON_TONES } from '@/lib/icons';

/**
 * يرسم مقابلَ الإيموجي من Tabler بحجم النصّ المحيط (`1em`) — بأسلوب تطبيق المريض.
 *
 * اللون: يحمل لونَ مفهومه (`EMOJI_TONE`) في `--icon-tone`، ويُطبَّق حين تقف الأيقونةُ وحدها في عنصرها
 * (بلاطة، رأسُ قسم، حالةٌ فارغة) — وداخلَ الأزرار يبقى لونَ النصّ (`shared.css`). ما ليس في الجدول
 * يُعاد كما هو، فالمكوّناتُ التي تأخذ «icon» نصّاً تتحوّل دون تغيير مواضع استعمالها.
 */
export default function EmojiIcon({ e, size = '1.1em', className }: { e: ReactNode; size?: number | string; className?: string }) {
  if (typeof e !== 'string') return <>{e}</>;
  const key = normalizeEmoji(e.trim());
  const dot = STATUS_DOTS[key];
  if (dot) {
    return <span aria-hidden className={`emoji-dot ${className ?? ''}`} style={{ background: dot }} />;
  }
  const C = EMOJI_ICONS[key];
  if (!C) return <>{e}</>;
  const tone = EMOJI_TONE[key];
  return (
    <C
      size={size}
      strokeWidth={ICON_STROKE}
      aria-hidden
      className={`emoji-icon ${className ?? ''}`}
      data-tone={tone}
      style={tone ? ({ '--icon-tone': ICON_TONES[tone].fg } as CSSProperties) : undefined}
    />
  );
}
