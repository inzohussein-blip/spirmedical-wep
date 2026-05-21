// ═══════════════════════════════════════════════════════════════
// 🧠 خدمة العلاج النفسي (V25.19)
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
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

  return <MentalHealthClient specialists={specialists || []} />;
}
