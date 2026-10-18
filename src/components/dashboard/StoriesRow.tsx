/**
 * ═══════════════════════════════════════════════════════════════
 * StoriesRow — قصصٌ تنشرها الإدارة وحدها (قرار المالك، 18 تشرين الأول)
 * ═══════════════════════════════════════════════════════════════
 * يجلب النشطةَ المجدولة عبر getActiveStories() ويسلّمها للشريط (عميل) الذي يفتح العارض.
 * لا قصصَ احتياطيّة مكتوبةً في الكود: كانت روابطَ تكرّر شبكةَ الخدمات، والقصّةُ محتوى
 * تكتبه الإدارة — فإن لم تنشر شيئاً اختفى الشريط.
 * الحارس: tests/stories-viewer.test.tsx
 */
import { getActiveStories } from '@/lib/stories/get-stories';
import StoriesStrip from '@/components/stories/StoriesStrip';

export { StoryIcon } from '@/components/stories/StoryIcon';

export default async function StoriesRow() {
  const stories = await getActiveStories();
  if (stories.length === 0) return null;
  return <StoriesStrip stories={stories} />;
}
