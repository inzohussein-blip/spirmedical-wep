// ═══════════════════════════════════════════════════════════════
// 👓 خدمة النظارات الطبية (V25.19)
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import OpticalClient from './OpticalClient';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'النظارات الطبية - Spir Medical',
  description: 'أفضل متاجر النظارات الطبية في العراق - فحص نظر، نظارات، عدسات لاصقة',
};

export default async function OpticalPage() {
  const supabase = createClient();

  const { data: stores } = await supabase
    .from('optical_stores')
    .select('*')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('rating_avg', { ascending: false })
    .limit(100);

  // قائمة الماركات الفارغة تصل NULL؛ نُسوّيها عند الحدّ (`.length` تنهار عليها)
  return (
    <OpticalClient
      stores={(stores ?? []).map((s) => ({ ...s, brands: s.brands ?? [] }))}
    />
  );
}
