/**
 * ═══════════════════════════════════════════════════════════════
 * StoriesRow — صف القصص في dashboard
 * ═══════════════════════════════════════════════════════════════
 * يستبدل الـ hardcoded array في dashboard/page.tsx
 * يجلب من DB عبر getActiveStories()
 */

import Link from 'next/link';
import { getActiveStories } from '@/lib/stories/get-stories';
import type { Story, StoryColorTheme } from '@/types/story';

/**
 * Gradient لكل theme
 */
const COLOR_GRADIENTS: Record<StoryColorTheme, string> = {
  emerald: 'linear-gradient(135deg, var(--emerald), #534AB7)',
  amber: 'linear-gradient(135deg, var(--amber), var(--rose))',
  rose: 'linear-gradient(135deg, var(--rose), var(--amber))',
  paper: 'linear-gradient(135deg, var(--paper-2), var(--paper))',
  ink: 'linear-gradient(135deg, var(--ink), var(--ink-3))',
};

/**
 * Fallback stories (إذا كان الجدول فارغاً أو حدث خطأ)
 */
const FALLBACK_STORIES: Story[] = [
  { id: '1', title: 'لقاحات', icon: '💉', description: null, href: '/tools/vaccinations', color_theme: 'rose', sort_order: 1, is_active: true, starts_at: null, ends_at: null, created_by: null, created_at: '', updated_at: '' },
  { id: '2', title: 'صحتك', icon: '🩺', description: null, href: '/account/health', color_theme: 'emerald', sort_order: 2, is_active: true, starts_at: null, ends_at: null, created_by: null, created_at: '', updated_at: '' },
  { id: '3', title: 'دواء', icon: '💊', description: null, href: '/account/prescriptions', color_theme: 'amber', sort_order: 3, is_active: true, starts_at: null, ends_at: null, created_by: null, created_at: '', updated_at: '' },
  { id: '4', title: 'تغذية', icon: '🍎', description: null, href: '/tools/risk-calculator', color_theme: 'rose', sort_order: 4, is_active: true, starts_at: null, ends_at: null, created_by: null, created_at: '', updated_at: '' },
  { id: '5', title: 'إسعافات', icon: '🚑', description: null, href: '/tools/first-aid', color_theme: 'amber', sort_order: 5, is_active: true, starts_at: null, ends_at: null, created_by: null, created_at: '', updated_at: '' },
];

export default async function StoriesRow() {
  const stories = await getActiveStories();
  const displayStories = stories.length > 0 ? stories : FALLBACK_STORIES;

  if (displayStories.length === 0) return null;

  return (
    <div className="scr-stories" aria-label="القصص الطبية">
      {displayStories.map((story) => (
        <Link
          key={story.id}
          href={story.href}
          className="story"
          aria-label={`قصة: ${story.title}`}
        >
          <div
            className="story-circle"
            style={{
              background: COLOR_GRADIENTS[story.color_theme],
            }}
          >
            <div className="story-inner">{story.icon}</div>
          </div>
          <div className="story-label">{story.title}</div>
        </Link>
      ))}
    </div>
  );
}
