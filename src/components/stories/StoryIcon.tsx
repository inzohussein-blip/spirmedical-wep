/**
 * أيقونةُ القصّة: حقلُ icon اسمُ Tabler (ti-*) أو إيموجي — والإنتاجُ إيموجي (💉🩺💊🍎🚑) تكتبه الإدارة.
 * الإيموجي لا يُرسم نصّاً: يُترجَم إلى أيقونة Tabler المقابلة كي تطابق بقيّةَ الرئيسية،
 * وما ليس في الجدول يمرّ بـ<EmojiIcon> (خطّيّ أيضاً). الحارس: tests/stories-icons.test.tsx
 */
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
  IconDental,
  IconSalad,
  IconFlask,
  IconBabyCarriage,
  IconGift,
  IconSparkles,
} from '@tabler/icons-react';
import EmojiIcon from '@/components/ui/EmojiIcon';
import { normalizeEmoji } from '@/lib/emoji-icons';

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

/** إيموجي القصص ← Tabler (المفتاحُ بلا U+FE0F) */
const EMOJI_TABLER_MAP: Record<string, TablerIcon> = {
  '💉': IconVaccine,
  '🩺': IconStethoscope,
  '💊': IconPill,
  '🍎': IconApple,
  '🚑': IconAmbulance,
  '❤': IconHeartbeat,
  '🏥': IconBuildingHospital,
  '🩸': IconDroplet,
  '🧠': IconBrain,
  '👁': IconEye,
  '🦷': IconDental,
  '🥗': IconSalad,
  '🧪': IconFlask,
  '👶': IconBabyCarriage,
  '🎁': IconGift,
  '✨': IconSparkles,
};

export function StoryIcon({ icon, size = 26 }: { icon: string; size?: number }) {
  const IconComp = TABLER_ICON_MAP[icon] ?? EMOJI_TABLER_MAP[normalizeEmoji(icon.trim())];
  if (IconComp) return <IconComp size={size} stroke={1.75} aria-hidden />;
  return <EmojiIcon e={icon} size={size} />;
}

/** ما تعرضه الإدارةُ للاختيار: كلُّ رمزٍ هنا يُرسم أيقونةَ Tabler */
export const STORY_ICON_CHOICES = Object.keys(EMOJI_TABLER_MAP);
