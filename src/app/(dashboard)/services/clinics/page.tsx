// ═══════════════════════════════════════════════════════════════
// 🏛️ صفحة العيادات (V25.11) - يستخدم doctors من DB
// ═══════════════════════════════════════════════════════════════
// تم استبدال البيانات الـ Hardcoded بقاعدة بيانات حقيقية
// العيادات = أطباء يستقبلون في عياداتهم الخاصة
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import ClinicsClient from './ClinicsClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'العيادات - Spir Medical' };

export default async function ClinicsPage() {
  const supabase = createClient();

  // العيادات = الأطباء الذين عندهم clinic_name
  // و available_for_clinic = true
  const { data: doctors } = await supabase
    .from('doctors')
    .select('*')
    .eq('is_active', true)
    .eq('available_for_clinic', true)
    .not('clinic_name', 'is', null)
    .order('rating_avg', { ascending: false })
    .limit(100);

  return <ClinicsClient doctors={doctors || []} />;
}
