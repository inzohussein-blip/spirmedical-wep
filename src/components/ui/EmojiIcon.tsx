import type { ReactNode } from 'react';
import { EMOJI_ICONS, STATUS_DOTS, normalizeEmoji } from '@/lib/emoji-icons';
import { ICON_STROKE } from '@/lib/icons';

/**
 * يرسم مقابلَ الإيموجي من Lucide بحجم النصّ المحيط ولونه (`1em`، `currentColor`).
 * ما ليس في الجدول يُعاد كما هو — فالمكوّناتُ التي تأخذ «icon» نصّاً تتحوّل دون تغيير مواضع استعمالها.
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
  return <C size={size} strokeWidth={ICON_STROKE} aria-hidden className={`emoji-icon ${className ?? ''}`} />;
}
