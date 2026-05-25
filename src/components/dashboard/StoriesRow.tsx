/**
 * ═══════════════════════════════════════════════════════════════
 * StoriesRow — V26.8 (Tabler Icons + HTML Design)
 * ═══════════════════════════════════════════════════════════════
 * يجلب من DB عبر getActiveStories()
 * يدعم Tabler Icons (ti-*) و emojis في حقل icon
 */

import Link from 'next/link';
import type { Icon as TablerIcon } from '@tabler/icons-react';
import {
  IconVaccine,
  IconStethoscope,
  IconPill,
  IconApple,
  IconAmbulance,
  IconHeartbeat,
  IconBuildingHospital,
  IconDroplet,
  IconBrain,
  IconEye,
} from '@tabler/icons-react';
import { getActiveStories } from '@/lib/stories/get-stories';
import type { Story } from '@/types/story';

const TABLER_ICON_MAP: Record<string, TablerIcon> = {
  'ti-vaccine': IconVaccine,
  'ti-stethoscope': IconStethoscope,
  'ti-pill': IconPill,
  'ti-apple': IconApple,
  'ti-ambulance': IconAmbulance,
  'ti-heartbeat': IconHeartbeat,
  'ti-building-hospital': IconBuildingHospital,
  'ti-droplet': IconDroplet,
  'ti-brain': IconBrain,
  'ti-eye': IconEye,
};

const FALLBACK_STORIES: Story[] = [
  { id: '1', title: 'لقاحات',   icon: 'ti-vaccine',     description: null, href: '/tools/vaccinations',    color_theme: 'rose',    sort_order: 1, is_active: true, starts_at: null, ends_at: null, created_by: null, created_at: '', updated_at: '' },
  { id: '2', title: 'صحتك',     icon: 'ti-stethoscope', description: null, href: '/account/health',        color_theme: 'emerald', sort_order: 2, is_active: true, starts_at: null, ends_at: null, created_by: null, created_at: '', updated_at: '' },
  { id: '3', title: 'دواء',     icon: 'ti-pill',        description: null, href: '/account/prescriptions', color_theme: 'amber',   sort_order: 3, is_active: true, starts_at: null, ends_at: null, created_by: null, created_at: '', updated_at: '' },
  { id: '4', title: 'تغذية',    icon: 'ti-apple',       description: null, href: '/tools/risk-calculator', color_theme: 'rose',    sort_order: 4, is_active: true, starts_at: null, ends_at: null, created_by: null, created_at: '', updated_at: '' },
  { id: '5', title: 'إسعافات',  icon: 'ti-ambulance',   description: null, href: '/tools/first-aid',       color_theme: 'amber',   sort_order: 5, is_active: true, starts_at: null, ends_at: null, created_by: null, created_at: '', updated_at: '' },
];

function StoryIcon({ icon }: { icon: string }) {
  if (icon.startsWith('ti-') && TABLER_ICON_MAP[icon]) {
    const IconComp = TABLER_ICON_MAP[icon];
    return <IconComp size={26} stroke={1.75} />;
  }
  return <>{icon}</>;
}

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
          <div className="story-circle">
            <div className="story-inner">
              <StoryIcon icon={story.icon} />
            </div>
          </div>
          <div className="story-label">{story.title}</div>
        </Link>
      ))}
    </div>
  );
}
