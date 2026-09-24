import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { ServiceSwitch } from '@/lib/service-switches';

/**
 * جلب مفاتيح التشغيل من القاعدة — خادميٌّ فقط.
 * المنطق الصافي (القرار والمطابقة) في `service-switches.ts`.
 */

/**
 * حالة كلّ الخدمات. `cache` من React تجعلها نداءً واحداً لكلّ طلبٍ مهما
 * تكرّر استدعاؤها (التخطيط + الشبكة + البحث في الطلب نفسه).
 */
export const getServiceSwitches = cache(async (): Promise<Map<string, ServiceSwitch>> => {
  const map = new Map<string, ServiceSwitch>();
  try {
    const supabase = createClient();
    const { data, error } = await (supabase as any)
      .from('service_switches')
      .select('service_id, is_enabled, note_ar, updated_at');

    if (error || !data) return map; // فشلٌ مفتوح: الخريطة الفارغة = الكلّ مشتغل
    for (const row of data as ServiceSwitch[]) map.set(row.service_id, row);
  } catch {
    // كذلك
  }
  return map;
});

