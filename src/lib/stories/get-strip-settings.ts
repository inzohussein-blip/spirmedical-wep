import { unstable_cache } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server-service';
import { parseStripSettings, STRIP_SETTINGS_KEY, type StripSettings } from './strip-settings';

/**
 * إعدادُ شريط القصص للخادم. `app_settings` يقرؤه المديرُ وحده (`private.is_admin`)، والمريضُ والزائرُ
 * يحتاجانه — فيُقرأ بعميل الخدمة مفتاحاً واحداً معروفاً، ويُخزَّن مع القصص بالوسم نفسه (`stories`)
 * فيُبطله حفظُ الإدارة فوراً (`updateTag`). أيُّ عطبٍ ← الافتراضيّ (ظاهر) لا الإخفاء.
 */
async function fetchStripSettings(): Promise<StripSettings> {
  try {
    const { data } = await createServiceClient()
      .from('app_settings')
      .select('value')
      .eq('key', STRIP_SETTINGS_KEY)
      .maybeSingle();
    return parseStripSettings(data?.value);
  } catch {
    return parseStripSettings(null);
  }
}

export const getStripSettings = unstable_cache(fetchStripSettings, ['stories-strip-settings-v1'], {
  tags: ['stories'],
  revalidate: 120,
});
