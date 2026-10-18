import { createAdminClient } from '@/lib/supabase/server';
import { BLOOD_TESTS } from '@/lib/services/blood-tests-data';
import { logger } from '@/lib/logger';
import type { LabOffer } from './lab-match';

const KNOWN_TESTS = new Set(BLOOD_TESTS.map((t) => t.id));

/**
 * شبكةُ المختبرات الحقيقيّة: حساباتُ «الخدمة» من نوع مختبر (0060) — معتمَدةٌ غيرُ موقوفة — ممّن حدّدوا
 * تحاليلَهم. (كانت مختصّي التحاليل حتى فُصلت الخدمةُ عن المختصّ: المحلّلُ يسحب، والمختبرُ يُحلّل.)
 * بعميل الخدمة: المريضُ لا يقرأ صفوفَ غيره (RLS)، ولا يخرج منها إلّا الاسمُ والمدينة.
 * عطبٌ ← قائمةٌ فارغة (يبقى «لا يهم — اختاروا الأنسب»).
 */
export async function getLabNetwork(): Promise<LabOffer[]> {
  try {
    return await fetchLabNetwork();
  } catch (e) {
    logger.warn('getLabNetwork threw', { error: e instanceof Error ? e.message : String(e) });
    return [];
  }
}

/** المختبراتُ المستلمة للطلبات: حسابُ خدمةٍ من نوع مختبر، معتمَد، غيرُ موقوف */
export async function eligibleLabIds(limit = 500): Promise<string[] | null> {
  const { data, error } = await createAdminClient()
    .from('users')
    .select('id')
    .eq('role', 'provider')
    .eq('provider_type', 'lab')
    .eq('approval_status', 'approved')
    .or('is_suspended.is.null,is_suspended.eq.false')
    .limit(limit);
  if (error) {
    logger.warn('eligibleLabIds failed', { error: error.message });
    return null;
  }
  return (data ?? []).map((r) => r.id);
}

async function fetchLabNetwork(): Promise<LabOffer[]> {
  const ids = await eligibleLabIds();
  if (!ids || ids.length === 0) return [];
  const supabase = createAdminClient();
  const [{ data: people, error: e1 }, { data: rows, error: e2 }] = await Promise.all([
    supabase.from('users').select('id, full_name, clinic_name, clinic_city, governorate').in('id', ids),
    supabase.from('specialist_lab_tests').select('specialist_id, test_id').in('specialist_id', ids),
  ]);
  if (e1 || e2) {
    logger.warn('getLabNetwork failed', { error: (e1 ?? e2)?.message });
    return [];
  }
  const tests = new Map<string, string[]>();
  for (const r of rows ?? []) {
    if (!KNOWN_TESTS.has(r.test_id)) continue;
    tests.set(r.specialist_id, [...(tests.get(r.specialist_id) ?? []), r.test_id]);
  }
  return (people ?? [])
    .filter((p) => (tests.get(p.id)?.length ?? 0) > 0)
    .map((p) => ({
      id: p.id,
      name: p.clinic_name?.trim() || p.full_name?.trim() || 'مختبر',
      city: p.clinic_city?.trim() || p.governorate?.trim() || null,
      tests: tests.get(p.id)!,
    }));
}

/** للخادم عند رفع الطلب: المختبرُ المختار مؤهَّلٌ فعلاً؟ يعيد اسمَه أو null */
export async function resolveChosenLab(labId: string | null | undefined): Promise<LabOffer | null> {
  if (!labId || labId === 'any') return null;
  const labs = await getLabNetwork();
  return labs.find((l) => l.id === labId) ?? null;
}
