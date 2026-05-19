// ═══════════════════════════════════════════════════════════════
// 👨‍⚕️ صفحة الأطباء (V25.9) - Family Doctor
// ═══════════════════════════════════════════════════════════════
// قائمة الأطباء مع فلاتر بالتخصص والمدينة
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import DoctorsClient from './DoctorsClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'أطباء العائلة - Spir Medical' };

export default async function DoctorsPage() {
  const supabase = createClient();

  const { data: doctors } = await supabase
    .from('doctors')
    .select('*')
    .eq('is_active', true)
    .order('rating_avg', { ascending: false })
    .order('rating_count', { ascending: false })
    .limit(100);

  return <DoctorsClient doctors={doctors || []} />;
}
