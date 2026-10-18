// ═══════════════════════════════════════════════════════════════
// 📸 Admin: إدارة القصص الترويجية (V25.11)
// ═══════════════════════════════════════════════════════════════
// كان فارغاً - تم بناؤه كاملاً
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isSuperAdmin } from '@/lib/admin-types';
import StoriesManager from './StoriesManager';
import StripSettingsPanel from './StripSettingsPanel';
import { parseStripSettings, STRIP_SETTINGS_KEY } from '@/lib/stories/strip-settings';
import type { Story } from '@/types/story';

import EmojiIcon from '@/components/ui/EmojiIcon';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'القصص الترويجية - Admin' };

export default async function AdminStoriesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  // ─── السوبر أدمن أو الأدمن يمكنه إدارة القصص ───
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return (
      <div style={{
        background: 'var(--white)',
        borderRadius: 14,
        padding: 64,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}><EmojiIcon e="🚫" /></div>
        <h1 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px' }}>غير مصرّح</h1>
        <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>
          هذه الصفحة للمديرين فقط
        </p>
      </div>
    );
  }

  // ─── جلب كل القصص ───
  // ─── القصص وإعدادُ الشريط معاً (لا شلّالَ انتظار) ───
  const [{ data: stories }, { data: setting }] = await Promise.all([
    supabase.from('stories').select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false }),
    supabase.from('app_settings').select('value').eq('key', STRIP_SETTINGS_KEY).maybeSingle(),
  ]);

  // «الآن» من الخادم مرّةً: حالةُ كلّ قصّة (منشورة/مجدولة/منتهية) تُحسب منه في العميل بلا Date.now() في الرسم
  const now = Date.now();
  const all = (stories as Story[]) || [];
  const published = all.filter((s) =>
    s.is_active && (!s.starts_at || Date.parse(s.starts_at) <= now) && (!s.ends_at || Date.parse(s.ends_at) > now));

  return (
    <>
      {/* العنوانُ والشرحُ في StoriesManager — كانا هنا مكرَّرَين («مثل Instagram»، «circles»، «href») */}
      <StripSettingsPanel initial={parseStripSettings(setting?.value)} stories={published} />
      <div style={{ height: 16 }} />
      <StoriesManager initialStories={all} now={now} />
    </>
  );
}
