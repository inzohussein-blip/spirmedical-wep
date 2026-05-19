// ═══════════════════════════════════════════════════════════════
// 💊 صفحة الصيدليات (V25.7) - Real DB + Clickable Cards
// ═══════════════════════════════════════════════════════════════
// دليل بحث عن توفر الأدوية (لا توصيل - ممنوع في العراق)
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import PharmaciesClient from './PharmaciesClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'دليل الصيدليات - Spir Medical' };

export default async function PharmaciesPage() {
  const supabase = createClient();

  // جلب الصيدليات المُفعّلة
  const { data: pharmacies } = await supabase
    .from('pharmacies')
    .select('*')
    .eq('is_active', true)
    .order('rating_avg', { ascending: false })
    .limit(100);

  return <PharmaciesClient pharmacies={pharmacies || []} />;
}
