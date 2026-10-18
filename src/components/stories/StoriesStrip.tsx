'use client';

import { useState, useSyncExternalStore } from 'react';
import type { Story } from '@/types/story';
import { DEFAULT_STRIP, type StripShape, type StripTheme } from '@/lib/stories/strip-settings';
import { StoryIcon } from './StoryIcon';
import { storyStyle } from './StoryCard';
import StoryViewer from './StoryViewer';
import { getSeenServerSnapshot, getSeenSnapshot, isSeen, parseSeen, subscribeSeen } from './seen-store';

/**
 * شريطُ القصص في رئيسية المريض. كلُّ قصّةٍ دائرةٌ بلون مفهومها (لا بترتيبها)، وحلقتُها ملوّنةٌ
 * ما لم تُشاهَد على هذا الجهاز، ثمّ رماديّة. الضغطُ يفتح العارضَ بملء الشاشة.
 * الشكلُ والثيمُ يختارهما المدير (`lib/stories/strip-settings.ts`) — أصنافٌ على الحاوية، والتنسيقُ في shared.css.
 */
export default function StoriesStrip({ stories, shape = DEFAULT_STRIP.shape, theme = DEFAULT_STRIP.theme }: {
  stories: Story[];
  shape?: StripShape;
  theme?: StripTheme;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const seen = parseSeen(useSyncExternalStore(subscribeSeen, getSeenSnapshot, getSeenServerSnapshot));

  return (
    <>
      <div className={`scr-stories stories-shape-${shape} stories-theme-${theme}`} role="group" aria-label="قصص سباير">
        {stories.map((story, i) => {
          const viewed = isSeen(seen, story);
          return (
            <button
              key={story.id}
              type="button"
              className={`story ${viewed ? 'story-seen' : 'story-new'}`}
              style={storyStyle(story.color_theme)}
              onClick={() => setOpen(i)}
              aria-label={`قصّة: ${story.title}${viewed ? '' : ' (جديدة)'}`}
            >
              <span className="story-circle">
                <span className="story-inner"><StoryIcon icon={story.icon} size={shape === 'chip' ? 18 : 26} /></span>
              </span>
              {!viewed && <span className="story-dot" aria-hidden="true" />}
              <span className="story-label">{story.title}</span>
            </button>
          );
        })}
      </div>
      {open !== null && <StoryViewer stories={stories} start={open} onClose={() => setOpen(null)} />}
    </>
  );
}
