// ═══════════════════════════════════════════════════════════════
// 🦾 خدمة العلاج الفيزيائي (V25.14)
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { toGender } from '@/lib/format/gender';
import PhysioClient from './PhysioClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'العلاج الفيزيائي - Spir Medical' };

export default async function PhysioPage() {
  const supabase = createClient();

  const [{ data: serviceTypes }, { data: specialists }] = await Promise.all([
    supabase
      .from('physio_service_types')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true }),
    supabase
      .from('physio_specialists')
      .select('*')
      .eq('is_active', true)
      .order('rating_avg', { ascending: false })
      .limit(50),
  ]);

  // القوائم الفارغة في القاعدة تصل NULL؛ نُسوّيها هنا عند الحدّ كي لا
  // يتسرّب الفراغ إلى العرض (`.includes` و`.join` تنهار عليه).
  // الأسعار لا تُسوّى: لا قيمة افتراضية صادقة لسعرٍ لم يُدخله مقدّم الخدمة.
  return (
    <PhysioClient
      serviceTypes={(serviceTypes ?? []).map((t) => ({
        ...t,
        icon: t.icon ?? '',
        conditions: t.conditions ?? [],
      }))}
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
