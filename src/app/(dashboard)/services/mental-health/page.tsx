// ═══════════════════════════════════════════════════════════════
// 🧠 خدمة العلاج النفسي (V25.19)
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { toGender } from '@/lib/format/gender';
import MentalHealthClient from './MentalHealthClient';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'الصحة النفسية - Spir Medical',
  description: 'أخصائيون نفسيون معتمدون - علاج القلق، الاكتئاب، العلاقات، الأطفال',
};

export default async function MentalHealthPage() {
  const supabase = createClient();

  const { data: specialists } = await supabase
    .from('mental_health_specialists')
    .select('*')
    .eq('is_active', true)
    .order('rating_avg', { ascending: false })
    .limit(100);

  // القوائم الفارغة تصل NULL؛ نُسوّيها عند الحدّ كي لا تنهار `.includes`/`.join`
  return (
    <MentalHealthClient
      specialists={(specialists ?? []).map((s) => ({
        ...s,
        specialties: s.specialties ?? [],
        gender: toGender(s.gender),
        certifications: s.certifications ?? [],
        languages: s.languages ?? [],
        cities: s.cities ?? [],
      }))}
    />
  );
}
