import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import NewAppointmentClient from './NewAppointmentClient';
import ServiceComingSoon from '@/components/services/ServiceComingSoon';
import { isBookingSoon } from '@/lib/services-v3';

export const metadata = {
  title: 'حجز موعد جديد · سباير ميديكال',
  description: 'احجز موعداً طبياً (سحب دم، تحاليل، استشارة) بسهولة في أي محافظة عراقية',
};

export const dynamic = 'force-dynamic';

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: { service?: string; clinic?: string; type?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // حجزٌ مُغلقٌ مؤقّتاً: لا يُعرض المعالجُ العامّ فيُرفع طلبٌ بلا خدمته
  if (isBookingSoon(searchParams.service)) {
    return (
      <ServiceComingSoon
        title="حجز جلسات العلاج الطبيعي"
        note="نجهّز الحجز الآن وسيكون متاحاً قريباً. يمكنك تصفّح الأخصائيين وخدماتهم في هذه الأثناء."
        backHref="/services/physio"
        backLabel="تصفّح أخصائيي العلاج الطبيعي"
      />
    );
  }

  // نداءاتٌ مستقلّة: لا يعتمد أيٌّ منها على نتيجة سابقه، وكانت تُنتظَر واحداً بعد واحد
  // فتُدفع رحلةٌ شبكيّةٌ لكلٍّ منها قبل أن يُرسم شيء. الآن نافذةُ انتظارٍ واحدة.
  const [{ data: profile }, { data: savedLocationsRaw }] = await Promise.all([
    // جلب رقم الهاتف من حساب المستخدم
    supabase
      .from('users')
      .select('phone, full_name')
      .eq('id', user.id)
      .single(),
    // ✨ V25.1: جلب المواقع المحفوظة (الأكثر استخداماً + المثبّتة)
    supabase
      .from('user_saved_locations')
      .select('id, label, icon, address, lat, lng')
      .eq('user_id', user.id)
      .order('is_pinned', { ascending: false })
      .order('last_used_at', { ascending: false, nullsFirst: false })
      .order('use_count', { ascending: false })
      .limit(6),
  ]);

  const savedLocations = (savedLocationsRaw ?? []).map((l) => ({
    id: l.id,
    label: l.label,
    icon: l.icon ?? '',
    address: l.address,
    lat: Number(l.lat),
    lng: Number(l.lng),
  }));

  return (
    <NewAppointmentClient
      service={searchParams.service || ''}
      userPhone={profile?.phone || ''}
      userAddress=""
      clinicId={searchParams.clinic}
      consultationType={searchParams.type}
      savedLocations={savedLocations}
    />
  );
}
