// ═══════════════════════════════════════════════════════════════
// 🥗 خدمة التغذية والحمية (V25.19)
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { toGender } from '@/lib/format/gender';
import NutritionClient from './NutritionClient';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'التغذية والحمية - Spir Medical',
  description: 'أخصائيو تغذية معتمدون - إنقاص الوزن، السكري، التغذية الرياضية، الأطفال',
};

export default async function NutritionPage() {
  const supabase = createClient();

  const { data: nutritionists } = await supabase
    .from('nutritionists')
    .select('*')
    .eq('is_active', true)
    .order('rating_avg', { ascending: false })
    .limit(100);

  // القوائم الفارغة تصل NULL؛ و`gender` نصٌّ حرّ في المخطّط المولَّد رغم
  // حراسة القاعدة له بقيد CHECK — فيُضيَّق هنا بدل تأكيدٍ أعمى
  return (
    <NutritionClient
      nutritionists={(nutritionists ?? []).map((n) => ({
        ...n,
        gender: toGender(n.gender),
        specialties: n.specialties ?? [],
        certifications: n.certifications ?? [],
        languages: n.languages ?? [],
        cities: n.cities ?? [],
      }))}
    />
  );
}
