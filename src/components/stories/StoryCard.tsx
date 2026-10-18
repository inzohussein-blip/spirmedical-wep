import Link from 'next/link';
import type { CSSProperties } from 'react';
import { ICON_TONES } from '@/lib/icons';
import { storyTone, type Story } from '@/types/story';
import { StoryIcon } from './StoryIcon';

/**
 * جسمُ القصّة: صورةٌ (أو أيقونتُها على لونها)، عنوان، نصّ، وزرُّ إجراء.
 * يرسمه العارضُ بملء الشاشة، وتعرضه الإدارةُ معاينةً قبل الحفظ — الشكلُ نفسه في الموضعين.
 */
export type StoryContent = Pick<Story, 'title' | 'icon' | 'description' | 'href' | 'color_theme'> & {
  image_url?: string | null;
  cta_label?: string | null;
};

export const DEFAULT_CTA = 'اعرف المزيد';

export function storyStyle(theme: string): CSSProperties {
  const t = ICON_TONES[storyTone(theme)];
  return { '--st-fg': t.fg, '--st-bg': t.bg } as CSSProperties;
}

export default function StoryCard({ story, onAction, preview = false }: {
  story: StoryContent;
  /** يُستدعى قبل الانتقال (يُغلق العارض) */
  onAction?: () => void;
  /** في معاينة الإدارة: الزرُّ لا ينقل */
  preview?: boolean;
}) {
  const external = /^https?:\/\//.test(story.href);
  const cta = story.cta_label?.trim() || DEFAULT_CTA;
  return (
    <div className="sv-card" style={storyStyle(story.color_theme)}>
      <div className="sv-media">
        {story.image_url ? (
          // صورةٌ من حاوية القصص العامّة — next/image لا يلزم لصورةٍ واحدة بملء العرض
          <img src={story.image_url} alt="" className="sv-image" />
        ) : (
          <span className="sv-hero-icon" aria-hidden="true"><StoryIcon icon={story.icon} size={64} /></span>
        )}
      </div>
      <div className="sv-body">
        <h2 className="sv-title">{story.title}</h2>
        {story.description && <p className="sv-text">{story.description}</p>}
        {preview ? (
          <span className="sv-cta">{cta}</span>
        ) : external ? (
          <a href={story.href} target="_blank" rel="noopener noreferrer" className="sv-cta" onClick={onAction}>{cta}</a>
        ) : (
          <Link href={story.href} className="sv-cta" onClick={onAction}>{cta}</Link>
        )}
      </div>
    </div>
  );
}
