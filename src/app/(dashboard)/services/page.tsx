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

const QUICK_ACCESS: CategoryCard[] = [
  { id: 'blood-lab', icon: '🩸', title: 'سحب دم + تحاليل', desc: '+٢٠٠ فحص · في منزلك', href: '/appointments/new?service=blood-draw', variant: 'emerald', badge: 'الأكثر طلباً' },
  { id: 'nursing', icon: '💉', title: 'تمريض منزلي', desc: 'إبر · جروح · كانيولا', href: '/appointments/new?service=home-nursing', variant: 'amber' },
];

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

        {/* Quick access cards */}
        <div className="scr-section-head" style={{ marginTop: 8 }}>
          <div className="scr-section-title">الأكثر طلباً</div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
          marginBottom: 20,
        }}>
          {QUICK_ACCESS.map((service) => (
            <Link
              key={service.id}
              href={service.href}
              className={`service-card service-${service.variant}`}
              aria-label={service.title}
            >
              {service.badge && (
                <span style={{
                  position: 'absolute',
                  top: 8,
                  insetInlineEnd: 8,
                  fontSize: 9,
                  fontWeight: 900,
                  background: service.variant === 'emerald' ? 'var(--amber)' : 'var(--emerald)',
                  color: 'var(--paper-3)',
                  padding: '2px 6px',
                  borderRadius: 100,
                }}>
                  {service.badge}
                </span>
              )}

              <div style={{ fontSize: 32, marginBottom: 8 }}>{service.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 4, color: 'var(--ink)' }}>
                {service.title}
              </div>
              <div style={{ fontSize: 10, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                {service.desc}
              </div>
            </Link>
          ))}
        </div>

        {/* Categories list */}
        <div className="scr-section-head">
          <div className="scr-section-title">استكشف حسب الفئة</div>
        </div>

        <div style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
          {[
            { href: '/services/hospitals', icon: '🏥', label: 'المستشفيات', count: counts.hospitals },
            { href: '/services/pharmacies', icon: '💊', label: 'الصيدليات', count: counts.pharmacies },
            { href: '/services/dental', icon: '🦷', label: 'طب الأسنان', count: counts.dentalClinics },
            { href: '/services/optical', icon: '👓', label: 'النظارات الطبية', count: counts.opticalStores },
            { href: '/services/mental-health', icon: '🧠', label: 'الصحة النفسية', count: counts.mentalHealthSpecialists },
            { href: '/services/nutrition', icon: '🥗', label: 'التغذية', count: counts.nutritionists },
            { href: '/services/doctors', icon: '👨‍⚕️', label: 'الأطباء', count: counts.doctors },
          ].map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className="scr-list-item scr-list-item-clickable"
            >
              <div className="scr-list-item-icon">{cat.icon}</div>
              <div className="scr-list-item-content">
                <div className="scr-list-item-title">{cat.label}</div>
                <div className="scr-list-item-subtitle">{cat.count} موقع متاح</div>
              </div>
              <div style={{ color: 'var(--ink-3)', fontSize: 18 }}>←</div>
            </Link>
          ))}
        </div>

        {/* SOS */}
        <Link
          href="/sos"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            background: 'var(--rose-soft)',
            border: '1px solid var(--rose)',
            borderRadius: 14,
            textDecoration: 'none',
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--rose)' }}>
              🚨 طوارئ SOS
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
              مساعدة فورية 24/7
            </div>
          </div>
          <ArrowRight size={18} color="var(--rose)" style={{ transform: 'scaleX(-1)' }} />
        </Link>
      </div>
    </main>
  );
}
