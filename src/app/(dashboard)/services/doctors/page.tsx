// ═══════════════════════════════════════════════════════════════
// 👨‍⚕️ صفحة الأطباء (V25.9) - Family Doctor
// ═══════════════════════════════════════════════════════════════
// قائمة الأطباء مع فلاتر بالتخصص والمدينة
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { toGender } from '@/lib/format/gender';
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

  // قائمة اللغات الفارغة تصل NULL؛ نُسوّيها عند الحدّ
  return (
    <DoctorsClient
      doctors={(doctors ?? []).map((d) => ({
        ...d,
        title: d.title ?? '',
        gender: toGender(d.gender),
        languages: d.languages ?? [],
      }))}
    />
  );
}
