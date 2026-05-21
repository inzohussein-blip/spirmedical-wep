// ═══════════════════════════════════════════════════════════════
// 🥗 خدمة التغذية والحمية (V25.19)
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
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

  return <NutritionClient nutritionists={nutritionists || []} />;
}
