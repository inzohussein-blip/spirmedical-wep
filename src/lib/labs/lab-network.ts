import { createAdminClient } from '@/lib/supabase/server';
import { eligibleSpecialistIds } from '@/lib/specialist-availability';
import { BLOOD_TESTS } from '@/lib/services/blood-tests-data';
import { logger } from '@/lib/logger';
import type { LabOffer } from './lab-match';

const KNOWN_TESTS = new Set(BLOOD_TESTS.map((t) => t.id));

/**
 * شبكةُ المختبرات الحقيقيّة: مختصّو التحاليل المستلمون للطلبات (المعيارُ الموحّد `eligibleSpecialistIds`)
 * ممّن حدّدوا تحاليلَ مختبرهم. بعميل الخدمة: المريضُ لا يقرأ صفوفَ المختصّين (RLS)، ولا يخرج منها إلّا
 * الاسمُ والمدينة. عطبٌ ← قائمةٌ فارغة (يبقى «لا يهم — اختاروا الأنسب»).
 */
export async function getLabNetwork(): Promise<LabOffer[]> {
  try {
    return await fetchLabNetwork();
  } catch (e) {
    logger.warn('getLabNetwork threw', { error: e instanceof Error ? e.message : String(e) });
    return [];
  }
}

async function fetchLabNetwork(): Promise<LabOffer[]> {
  const ids = await eligibleSpecialistIds('lab_analyst', 500);
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
