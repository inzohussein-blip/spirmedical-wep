// ═══════════════════════════════════════════════════════════════
// ✨ منتجات التجميل والعناية (V25.11)
// ═══════════════════════════════════════════════════════════════
// تم استبدال البيانات الـ Hardcoded بقاعدة بيانات حقيقية
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import CosmeticClient from './CosmeticClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'العناية والتجميل - Spir Medical' };

export default async function CosmeticPage() {
  const supabase = createClient();

  const { data: products } = await supabase
    .from('cosmetic_products')
    .select('*')
    .eq('is_active', true)
    .order('is_recommended', { ascending: false })
    .order('rating_avg', { ascending: false })
    .limit(100);

  return <CosmeticClient products={products || []} />;
}
