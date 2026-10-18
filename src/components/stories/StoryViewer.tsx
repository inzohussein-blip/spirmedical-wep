'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconX } from '@tabler/icons-react';
import { useModalDialog } from '@/lib/hooks/useModalDialog';
import type { Story } from '@/types/story';
import StoryCard from './StoryCard';
import { markSeen } from './seen-store';

/** مدّةُ القصّة قبل الانتقال وحدها */
export const STORY_MS = 6000;

/**
 * عارضُ القصص بملء الشاشة (قرار المالك: قصصٌ حقيقيّة تنشرها الإدارة وحدها).
 *
 * - أشرطةُ التقدّم في الأعلى، والانتقالُ وحده بعد 6 ث بنهاية حركة CSS (`onAnimationEnd`) — لا مؤقّت.
 *   والضغطُ المطوَّل يوقفه. ومع «تقليل الحركة» لا انتقالَ وحده: يتقدّم المستخدمُ بنفسه.
 * - الاتّجاه عربيّ: «التالية» في الجهة اليسرى من الشاشة، والسهمُ الأيسر يتقدّم.
 * - Escape وقفلُ التمرير ونقلُ التركيز من useModalDialog، كسائر النوافذ.
 * - يُرسم في body (createPortal): غلافُ التطبيق يحمل تحويلاً يجعل `position: fixed` نسبيّاً إليه،
 *   فكانت الصفحةُ تظهر من حوله. ويعلو شريطَ الكوكيز (z-index 10000).
 */
export default function StoryViewer({ stories, start, onClose }: {
  stories: Story[];
  start: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(start);
  const [paused, setPaused] = useState(false);
  const ref = useModalDialog<HTMLDivElement>(true, onClose);
  const story = stories[index];

  useEffect(() => {
    if (story) markSeen(story);
  }, [story]);

  const next = () => (index < stories.length - 1 ? setIndex(index + 1) : onClose());
  const prev = () => setIndex(Math.max(0, index - 1));

  if (!story) return null;

  return createPortal(
    <div className="sv-backdrop">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={`قصّة: ${story.title}`}
        className="sv-panel"
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') next();
          if (e.key === 'ArrowRight') prev();
        }}
      >
        <div className="sv-progress" aria-hidden="true">
          {stories.map((s, i) => (
            <span key={s.id} className="sv-seg">
              <span
                key={i === index ? `run-${index}` : undefined}
                className={`sv-fill ${i < index ? 'sv-done' : i === index ? 'sv-run' : ''} ${paused ? 'sv-paused' : ''}`}
                style={i === index ? { animationDuration: `${STORY_MS}ms` } : undefined}
                onAnimationEnd={i === index ? next : undefined}
              />
            </span>
          ))}
        </div>

        <button type="button" className="sv-close" onClick={onClose} aria-label="إغلاق القصص">
          <IconX size={22} stroke={2} />
        </button>

        <div
          className="sv-stage"
          onPointerDown={() => setPaused(true)}
          onPointerUp={() => setPaused(false)}
          onPointerLeave={() => setPaused(false)}
        >
          <StoryCard story={story} onAction={onClose} />
          {/* مناطقُ اللمس: يسارُ الشاشة للتالية (اتّجاهُ القراءة العربيّ) */}
          <button type="button" className="sv-tap sv-tap-next" onClick={next} aria-label="القصّة التالية" />
          <button type="button" className="sv-tap sv-tap-prev" onClick={prev} aria-label="القصّة السابقة" />
        </div>
      </div>
    </div>,
    document.body,
  );
}
