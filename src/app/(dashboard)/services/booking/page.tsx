// ═══════════════════════════════════════════════════════════════
// 📅 Universal Booking Page (V25.21)
// ═══════════════════════════════════════════════════════════════
// Booking flow موحّد للخدمات الجديدة:
//   - dental    - عيادات الأسنان
//   - optical   - متاجر النظارات
//   - mental    - الصحة النفسية
//   - nutrition - التغذية
//
// URL: /services/booking?service=dental&id=xxx
//      /services/booking?service=mental&id=xxx&package=online
//      /services/booking?service=nutrition&id=xxx&package=monthly
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import BookingClient from './BookingClient';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'حجز موعد - Spir Medical',
  description: 'احجز موعدك مع أفضل الأخصائيين',
};

type SearchParams = {
  service?: string;
  id?: string;
  package?: string;
};

export default async function BookingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { service, id, package: pkgType } = searchParams;

  if (!service || !id) {
    notFound();
  }

  const { data: profile } = await supabase
    .from('users')
    .select('phone, full_name')
    .eq('id', user.id)
    .single();

  // جلب بيانات الموفّر حسب الخدمة
  let provider: BookingProvider | null = null;
  let serviceLabel = '';

  if (service === 'dental') {
    const { data } = await supabase
      .from('dental_clinics')
      .select('id, name, city, district, address, phone, whatsapp, working_hours, doctor_count, cleaning_price_min, cleaning_price_max, implant_price_min, implant_price_max, offers_implants, offers_orthodontics, offers_pediatric, offers_emergency')
      .eq('id', id)
      .single();

    if (!data) notFound();
    provider = {
      type: 'dental',
      id: data.id,
      name: data.name,
      city: data.city,
      district: data.district,
      address: data.address,
      phone: data.phone,
      whatsapp: data.whatsapp,
      workingHours: data.working_hours,
      meta: {
        doctorCount: data.doctor_count,
        priceRange: `${data.cleaning_price_min.toLocaleString('ar-IQ')} - ${data.cleaning_price_max.toLocaleString('ar-IQ')} د.ع (تنظيف)`,
        services: [
          data.offers_implants && 'زراعة',
          data.offers_orthodontics && 'تقويم',
          data.offers_pediatric && 'أطفال',
          data.offers_emergency && 'طوارئ',
        ].filter(Boolean) as string[],
      },
    };
    serviceLabel = '🦷 طب الأسنان';
  } else if (service === 'optical') {
    const { data } = await supabase
      .from('optical_stores')
      .select('id, name, city, district, address, phone, working_hours, brands, exam_price, frame_price_min, frame_price_max, offers_eye_exam, offers_contact_lenses')
      .eq('id', id)
      .single();

    if (!data) notFound();
    provider = {
      type: 'optical',
      id: data.id,
      name: data.name,
      city: data.city,
      district: data.district,
      address: data.address,
      phone: data.phone,
      whatsapp: data.phone,
      workingHours: data.working_hours,
      meta: {
        brands: data.brands.slice(0, 4),
        priceRange: `${data.frame_price_min.toLocaleString('ar-IQ')} - ${data.frame_price_max.toLocaleString('ar-IQ')} د.ع (إطارات)`,
        services: [
          data.offers_eye_exam && 'فحص نظر',
          data.offers_contact_lenses && 'عدسات لاصقة',
        ].filter(Boolean) as string[],
      },
    };
    serviceLabel = '👓 النظارات الطبية';
  } else if (service === 'mental-health' || service === 'mental') {
    const { data } = await supabase
      .from('mental_health_specialists')
      .select('id, full_name, title, gender, bio, years_experience, specialist_type, specialties, available_online, available_in_clinic, online_session_price, clinic_session_price, session_duration_minutes, clinic_name, clinic_address, clinic_city, clinic_phone')
      .eq('id', id)
      .single();

    if (!data) notFound();
    const isOnline = pkgType === 'online' || (!pkgType && data.available_online);
    provider = {
      type: 'mental-health',
      id: data.id,
      name: `${data.title} ${data.full_name}`,
      city: data.clinic_city || 'بغداد',
      district: null,
      address: data.clinic_address || null,
      phone: data.clinic_phone || null,
      whatsapp: data.clinic_phone || null,
      workingHours: null,
      packageType: isOnline ? 'online' : 'clinic',
      packagePrice: isOnline ? data.online_session_price : data.clinic_session_price,
      packageLabel: isOnline ? '💻 جلسة أونلاين' : '🏢 جلسة في العيادة',
      meta: {
        experience: data.years_experience,
        specialist_type: data.specialist_type,
        bio: data.bio,
        duration: data.session_duration_minutes,
        services: data.specialties.slice(0, 3),
      },
    };
    serviceLabel = '🧠 الصحة النفسية';
  } else if (service === 'nutrition') {
    const { data } = await supabase
      .from('nutritionists')
      .select('id, full_name, title, gender, bio, years_experience, specialties, available_online, available_in_clinic, initial_consultation_price, follow_up_price, monthly_plan_price, success_rate, clinic_name, clinic_address, clinic_city')
      .eq('id', id)
      .single();

    if (!data) notFound();

    let pkgPrice = data.initial_consultation_price;
    let pkgLabel = '💬 استشارة أولى';
    if (pkgType === 'follow-up' || pkgType === 'followup') {
      pkgPrice = data.follow_up_price;
      pkgLabel = '🔄 متابعة';
    } else if (pkgType === 'monthly') {
      pkgPrice = data.monthly_plan_price;
      pkgLabel = '📅 خطة شهرية كاملة';
    }

    provider = {
      type: 'nutrition',
      id: data.id,
      name: `${data.title} ${data.full_name}`,
      city: data.clinic_city || 'بغداد',
      district: null,
      address: data.clinic_address || null,
      phone: null,
      whatsapp: null,
      workingHours: null,
      packageType: pkgType || 'initial',
      packagePrice: pkgPrice,
      packageLabel: pkgLabel,
      meta: {
        experience: data.years_experience,
        bio: data.bio,
        successRate: data.success_rate,
        services: data.specialties.slice(0, 3),
      },
    };
    serviceLabel = '🥗 التغذية والحمية';
  } else {
    notFound();
  }

  if (!provider) notFound();

  return (
    <BookingClient
      provider={provider}
      serviceLabel={serviceLabel}
      userPhone={profile?.phone || ''}
      userName={profile?.full_name || ''}
    />
  );
}

export interface BookingProvider {
  type: 'dental' | 'optical' | 'mental-health' | 'nutrition';
  id: string;
  name: string;
  city: string;
  district: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  workingHours: string | null;
  packageType?: string;
  packagePrice?: number;
  packageLabel?: string;
  meta: {
    doctorCount?: number;
    brands?: string[];
    priceRange?: string;
    services?: string[];
    experience?: number;
    specialist_type?: string;
    bio?: string | null;
    duration?: number;
    successRate?: number;
  };
}
