'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { BLOOD_TESTS } from '@/lib/services/blood-tests-data';

/**
 * 🧪 يحفظ تحاليلَ المختبر واسمَه ومدينتَه (قرار المالك، 0055؛ المختبرُ حسابُ «خدمة» منذ 0060).
 *
 * بعميل RLS: سياساتُ `specialist_lab_tests` تحصر الإدراجَ والحذفَ في صفوفه وتشترط حسابَ مختبر؛
 * والحفظُ حذفُ ما أُزيل وإدراجُ ما أُضيف، ثمّ يُعدّ الناتجُ من القاعدة (سياسةٌ ترفض بصمت لا تعطي «تمّ»).
 */
export async function saveLabTests(input: {
  testIds: string[];
  labName: string;
  labCity: string;
}): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'سجّل الدخول أوّلاً' };

  const { data: profile } = await supabase
    .from('users').select('role, provider_type').eq('id', user.id).single();
  if (profile?.role !== 'provider' || profile.provider_type !== 'lab') {
    return { ok: false, message: 'هذه الصفحة لحسابات المختبرات' };
  }

  const known = new Set(BLOOD_TESTS.map((t) => t.id));
  const wanted = [...new Set(input.testIds)].filter((id) => known.has(id));
  const labName = input.labName.trim().slice(0, 80);
  const labCity = input.labCity.trim().slice(0, 40);
  if (!labName) return { ok: false, message: 'اكتب اسمَ المختبر — يراه المريض عند اختيار التحاليل' };

  const { error: profileError } = await supabase
    .from('users').update({ clinic_name: labName, clinic_city: labCity || null }).eq('id', user.id);
  if (profileError) return { ok: false, message: 'تعذّر حفظ اسم المختبر: ' + profileError.message };

  const { data: current, error: readError } = await supabase
    .from('specialist_lab_tests').select('test_id').eq('specialist_id', user.id);
  if (readError) return { ok: false, message: 'تعذّر قراءة تحاليلك: ' + readError.message };

  const have = new Set((current ?? []).map((r) => r.test_id));
  const toRemove = [...have].filter((t) => !wanted.includes(t));
  const toAdd = wanted.filter((t) => !have.has(t));

  if (toRemove.length) {
    const { error } = await supabase
      .from('specialist_lab_tests').delete().eq('specialist_id', user.id).in('test_id', toRemove);
    if (error) return { ok: false, message: 'تعذّر الحفظ: ' + error.message };
  }
  if (toAdd.length) {
    const { error } = await supabase
      .from('specialist_lab_tests').insert(toAdd.map((test_id) => ({ specialist_id: user.id, test_id })));
    if (error) return { ok: false, message: 'تعذّر الحفظ: ' + error.message };
  }

  const { count } = await supabase
    .from('specialist_lab_tests').select('test_id', { count: 'exact', head: true }).eq('specialist_id', user.id);
  if ((count ?? -1) !== wanted.length) {
    return { ok: false, message: 'لم يُحفظ كلُّ شيء — حاول مرّةً أخرى' };
  }

  revalidatePath('/provider/lab-tests');
  revalidatePath('/provider');
  return {
    ok: true,
    message: wanted.length
      ? `حُفظ: ${wanted.length} تحليلاً — يظهر مختبرُك للمرضى الذين يختارونها`
      : 'حُفظ — لا تحاليلَ محدّدة، فلن يظهر مختبرُك للمرضى',
  };
}
