// ═══════════════════════════════════════════════════════════════
// 🗺️ صفحة كل الخدمات - مع الخريطة المركزية (V25.37)
// ═══════════════════════════════════════════════════════════════
// نظام موحّد: خريطة + filters + 11 نوع خدمة + 18 محافظة
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import ServicesMapHubWrapper, { type ServiceLocation } from '@/components/maps/ServicesMapHubWrapper';
import type { ServiceMarkerType } from '@/lib/maps/markers';
import {
  IconDroplet, IconVaccine, IconBuildingHospital, IconPill,
  IconDental, IconEye, IconBrain, IconApple, IconStethoscope,
  IconAlertTriangle, IconArrowLeft,
} from '@tabler/icons-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'كل الخدمات الطبية - Spir Medical',
  description: 'استكشف كل الخدمات الطبية على الخريطة: سحب دم، تمريض، أسنان، صيدليات، مستشفيات، وأكثر',
};

interface CategoryCard {
  id: string;
  icon: string;
  title: string;
  desc: string;
  href: string;
  variant: 'emerald' | 'amber';
  badge?: string;
}

// suppress unused
type _UnusedCategoryCard = CategoryCard;


export default async function ServicesPage() {
  const supabase = createClient();

  // جلب كل المواقع من قواعد البيانات (مع graceful fallback)
  const [
    hospitalsRes,
    pharmaciesRes,
    dentalClinicsRes,
    opticalStoresRes,
    mentalHealthSpecialistsRes,
    nutritionistsRes,
    doctorsRes,
  ] = await Promise.all([
    supabase.from('hospitals').select('id, name, city, latitude, longitude, rating_avg').eq('is_active', true).not('latitude', 'is', null).not('longitude', 'is', null),
    supabase.from('pharmacies').select('id, name, city, latitude, longitude').eq('is_active', true).not('latitude', 'is', null).not('longitude', 'is', null),
    supabase.from('dental_clinics').select('id, name, city, latitude, longitude').eq('is_active', true).not('latitude', 'is', null).not('longitude', 'is', null),
    supabase.from('optical_stores').select('id, name, city, latitude, longitude').eq('is_active', true).not('latitude', 'is', null).not('longitude', 'is', null),
    supabase.from('mental_health_specialists').select('id, full_name, city, latitude, longitude').eq('is_active', true).not('latitude', 'is', null).not('longitude', 'is', null),
    supabase.from('nutritionists').select('id, full_name, city, latitude, longitude').eq('is_active', true).not('latitude', 'is', null).not('longitude', 'is', null),
    supabase.from('users').select('id, full_name, governorate, latitude, longitude').eq('role', 'specialist').eq('specialist_type', 'doctor').eq('is_active', true).not('latitude', 'is', null).not('longitude', 'is', null),
  ]);

  // Safely extract data (تجاهل أي errors)
  type RawLoc = { id: string; name?: string; full_name?: string; city?: string | null; governorate?: string | null; latitude: number | null; longitude: number | null; rating_avg?: number | null };
  const hospitals: RawLoc[] = (hospitalsRes.data as unknown as RawLoc[]) || [];
  const pharmacies: RawLoc[] = (pharmaciesRes.data as unknown as RawLoc[]) || [];
  const dentalClinics: RawLoc[] = (dentalClinicsRes.data as unknown as RawLoc[]) || [];
  const opticalStores: RawLoc[] = (opticalStoresRes.data as unknown as RawLoc[]) || [];
  const mentalHealthSpecialists: RawLoc[] = (mentalHealthSpecialistsRes.data as unknown as RawLoc[]) || [];
  const nutritionists: RawLoc[] = (nutritionistsRes.data as unknown as RawLoc[]) || [];
  const doctors: RawLoc[] = (doctorsRes.data as unknown as RawLoc[]) || [];

  // تحويل كل المصادر لـ ServiceLocation موحّد
  const locations: ServiceLocation[] = [
    ...hospitals.map((h): ServiceLocation => ({
      id: `hospital-${h.id}`,
      type: 'hospital' as ServiceMarkerType,
      name: h.name || 'مستشفى',
      latitude: h.latitude!,
      longitude: h.longitude!,
      governorate: h.city ?? null,
      rating: h.rating_avg ?? null,
      href: `/services/hospitals/${h.id}`,
    })),
    ...pharmacies.map((p): ServiceLocation => ({
      id: `pharmacy-${p.id}`,
      type: 'pharmacy' as ServiceMarkerType,
      name: p.name || 'صيدلية',
      latitude: p.latitude!,
      longitude: p.longitude!,
      governorate: p.city ?? null,
      rating: null,
      href: `/services/pharmacies`,
    })),
    ...dentalClinics.map((d): ServiceLocation => ({
      id: `dental-${d.id}`,
      type: 'dental' as ServiceMarkerType,
      name: d.name || 'عيادة أسنان',
      latitude: d.latitude!,
      longitude: d.longitude!,
      governorate: d.city ?? null,
      rating: null,
      href: `/services/dental/${d.id}`,
    })),
    ...opticalStores.map((o): ServiceLocation => ({
      id: `optical-${o.id}`,
      type: 'optical' as ServiceMarkerType,
      name: o.name || 'محل نظارات',
      latitude: o.latitude!,
      longitude: o.longitude!,
      governorate: o.city ?? null,
      rating: null,
      href: `/services/optical/${o.id}`,
    })),
    ...mentalHealthSpecialists.map((m): ServiceLocation => ({
      id: `mental-${m.id}`,
      type: 'mental-health' as ServiceMarkerType,
      name: m.full_name || 'اختصاصي نفسي',
      latitude: m.latitude!,
      longitude: m.longitude!,
      governorate: m.city ?? null,
      rating: null,
      href: `/services/mental-health/${m.id}`,
    })),
    ...nutritionists.map((n): ServiceLocation => ({
      id: `nutrition-${n.id}`,
      type: 'nutrition' as ServiceMarkerType,
      name: n.full_name || 'اختصاصي تغذية',
      latitude: n.latitude!,
      longitude: n.longitude!,
      governorate: n.city ?? null,
      rating: null,
      href: `/services/nutrition/${n.id}`,
    })),
    ...doctors.map((d): ServiceLocation => ({
      id: `doctor-${d.id}`,
      type: 'doctor' as ServiceMarkerType,
      name: d.full_name || 'طبيب',
      latitude: d.latitude!,
      longitude: d.longitude!,
      governorate: d.governorate ?? null,
      rating: null,
      href: `/services/doctors`,
    })),
  ];

  // إحصائيات الفئات
  const counts = {
    hospitals: hospitals.length,
    pharmacies: pharmacies.length,
    dentalClinics: dentalClinics.length,
    opticalStores: opticalStores.length,
    mentalHealthSpecialists: mentalHealthSpecialists.length,
    nutritionists: nutritionists.length,
    doctors: doctors.length,
  };

  // إحصائيات
  const governoratesCount = new Set(locations.map((l) => l.governorate).filter(Boolean)).size;

  return (
    <main className="app-screen">
      <div className="scr-content">
        {/* Header */}
        <div className="scr-page-header">
          <Link href="/dashboard" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} />
          </Link>
          <h1 className="scr-page-title">كل الخدمات</h1>
          <div className="scr-page-spacer" />
        </div>

        <p className="scr-page-subtitle" style={{ marginBottom: 16 }}>
          {locations.length} موقع · {governoratesCount} محافظة · استكشف على الخريطة
        </p>

        {/* 🗺️ الخريطة المركزية */}
        <div style={{ marginBottom: 20 }}>
          <ServicesMapHubWrapper locations={locations} height={500} />
        </div>

        {/* Quick access cards - V26.1 V3 style */}
        <div className="scr-section-head" style={{ marginTop: 8 }}>
          <div className="scr-section-title">الأكثر طلباً</div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 8,
          marginBottom: 20,
        }}>
          {/* سحب الدم - V3 style */}
          <Link
            href="/appointments/new?service=blood-draw"
            style={{
              background: '#FFFFFF',
              border: '0.5px solid #DADCE0',
              borderRadius: 14,
              padding: 14,
              position: 'relative',
              overflow: 'hidden',
              minHeight: 110,
              textDecoration: 'none',
              color: 'inherit',
              display: 'block',
            }}
          >
            <div aria-hidden style={{
              position: 'absolute', width: 70, height: 70, borderRadius: '50%',
              background: '#FCE8E6', opacity: 0.7, top: -12, left: -12,
            }} />
            <span style={{
              position: 'absolute', top: 10, right: 10,
              background: '#FBBC04', color: '#202124',
              fontSize: 10, fontWeight: 700,
              padding: '2px 7px', borderRadius: 9999, zIndex: 2,
            }}>
              الأكثر طلباً
            </span>
            <div style={{ marginBottom: 12, position: 'relative', zIndex: 1 }}>
              <IconDroplet size={26} stroke={1.75} color="#EA4335" />
            </div>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#202124', marginBottom: 3, position: 'relative', zIndex: 1 }}>
              سحب دم + تحاليل
            </div>
            <div style={{ fontSize: 10, color: '#5F6368', lineHeight: 1.4, position: 'relative', zIndex: 1 }}>
              +٢٠٠ فحص · في منزلك
            </div>
            <div style={{ position: 'absolute', bottom: 10, left: 10, color: '#80868B' }}>
              <IconArrowLeft size={14} stroke={2} />
            </div>
          </Link>

          {/* التمريض - V3 style */}
          <Link
            href="/appointments/new?service=home-nursing"
            style={{
              background: '#FFFFFF',
              border: '0.5px solid #DADCE0',
              borderRadius: 14,
              padding: 14,
              position: 'relative',
              overflow: 'hidden',
              minHeight: 110,
              textDecoration: 'none',
              color: 'inherit',
              display: 'block',
            }}
          >
            <div aria-hidden style={{
              position: 'absolute', width: 70, height: 70, borderRadius: '50%',
              background: '#FEF7E0', opacity: 0.7, top: -12, left: -12,
            }} />
            <div style={{ marginBottom: 12, position: 'relative', zIndex: 1 }}>
              <IconVaccine size={26} stroke={1.75} color="#B06000" />
            </div>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#202124', marginBottom: 3, position: 'relative', zIndex: 1 }}>
              تمريض منزلي
            </div>
            <div style={{ fontSize: 10, color: '#5F6368', lineHeight: 1.4, position: 'relative', zIndex: 1 }}>
              إبر · جروح · كانيولا
            </div>
            <div style={{ position: 'absolute', bottom: 10, left: 10, color: '#80868B' }}>
              <IconArrowLeft size={14} stroke={2} />
            </div>
          </Link>
        </div>

        {/* Categories list - V26.1 Tabler icons */}
        <div className="scr-section-head">
          <div className="scr-section-title">استكشف حسب الفئة</div>
        </div>

        <div style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
          {[
            { href: '/services/hospitals', Icon: IconBuildingHospital, color: '#1A73E8', bg: '#E8F0FE', label: 'المستشفيات', count: counts.hospitals },
            { href: '/services/pharmacies', Icon: IconPill, color: '#9334E6', bg: '#F3E8FD', label: 'الصيدليات', count: counts.pharmacies },
            { href: '/services/dental', Icon: IconDental, color: '#00838F', bg: '#E0F7FA', label: 'طب الأسنان', count: counts.dentalClinics },
            { href: '/services/optical', Icon: IconEye, color: '#FF6D00', bg: '#FFF3E0', label: 'النظارات الطبية', count: counts.opticalStores },
            { href: '/services/mental-health', Icon: IconBrain, color: '#7C4DFF', bg: '#EDE7F6', label: 'الصحة النفسية', count: counts.mentalHealthSpecialists },
            { href: '/services/nutrition', Icon: IconApple, color: '#34A853', bg: '#E8F5E9', label: 'التغذية', count: counts.nutritionists },
            { href: '/services/doctors', Icon: IconStethoscope, color: '#01875F', bg: '#E6F3EF', label: 'الأطباء', count: counts.doctors },
          ].map((cat) => {
            const CatIcon = cat.Icon;
            return (
              <Link
                key={cat.href}
                href={cat.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  background: '#FFFFFF',
                  border: '0.5px solid #DADCE0',
                  borderRadius: 14,
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: cat.bg, display: 'inline-flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <CatIcon size={22} stroke={1.75} color={cat.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#202124' }}>{cat.label}</div>
                  <div style={{ fontSize: 11, color: '#5F6368' }}>{cat.count} موقع متاح</div>
                </div>
                <IconArrowLeft size={18} stroke={2} color="#80868B" />
              </Link>
            );
          })}
        </div>

        {/* SOS - V3 emergency style */}
        <Link
          href="/sos"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            background: '#FCE8E6',
            border: '1px solid #8B0000',
            borderRadius: 14,
            textDecoration: 'none',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <IconAlertTriangle size={20} stroke={2.2} color="#8B0000" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#8B0000' }}>
                طوارئ SOS
              </div>
              <div style={{ fontSize: 11, color: '#5F6368', marginTop: 2 }}>
                مساعدة فورية 24/7
              </div>
            </div>
          </div>
          <IconArrowLeft size={18} stroke={2} color="#8B0000" />
        </Link>
      </div>
    </main>
  );
}
