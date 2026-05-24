// ═══════════════════════════════════════════════════════════════
// 🏃 صفحة تفاصيل أخصائي العلاج الطبيعي (V25.48)
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight, MapPin, Phone, Star, CheckCircle2,
  Home, Building2, Award, Activity, Clock,
} from 'lucide-react';
import ServiceFavoriteButton from '@/components/services/ServiceFavoriteButton';
import { checkIsFavorite } from '@/components/services/favorites-actions';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: specialist } = await supabase
    .from('physio_specialists')
    .select('full_name, title, bio')
    .eq('id', params.id)
    .single();

  if (!specialist) return { title: 'أخصائي غير موجود' };

  return {
    title: `${specialist.title} ${specialist.full_name} - علاج طبيعي | Spir Medical`,
    description: specialist.bio || 'أخصائي علاج طبيعي معتمد',
  };
}

const SPECIALTIES_LABELS: Record<string, string> = {
  sports: 'إصابات رياضية',
  orthopedic: 'عظام',
  neurological: 'أعصاب',
  pediatric: 'أطفال',
  geriatric: 'كبار السن',
  post_surgery: 'ما بعد العمليات',
  back_pain: 'آلام الظهر',
  joint_pain: 'آلام المفاصل',
};

interface ServiceType {
  id: string;
  slug: string;
  name_ar: string;
  description: string | null;
  icon: string;
  base_price: number;
}

export default async function PhysioSpecialistPage({ 
  params,
}: { 
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: specialist } = await supabase
    .from('physio_specialists')
    .select('*')
    .eq('id', params.id)
    .eq('is_active', true)
    .single();

  if (!specialist) notFound();

  // جلب أنواع الخدمات
  
  const supabaseAny = supabase as unknown as {
    from: (t: string) => {
      select: (cols: string) => {
        eq: (col: string, val: boolean) => Promise<{ data: ServiceType[] | null }>;
      };
    };
  };

  const { data: serviceTypes } = await supabaseAny
    .from('physio_service_types')
    .select('id, slug, name_ar, description, icon, base_price')
    .eq('is_active', true);

  const types = serviceTypes ?? [];
  const isFavorite = await checkIsFavorite('physio' as never, specialist.id);

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/services/physio" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} />
          </Link>
          <h1 className="scr-page-title" style={{ fontSize: 14 }}>🏃 تفاصيل الأخصائي</h1>
          <ServiceFavoriteButton
            serviceType={'physio' as never}
            serviceId={specialist.id}
            initialIsFavorite={isFavorite}
            size="sm"
          />
        </div>

        {/* Hero */}
        <div style={{
          background: 'linear-gradient(135deg, #0F6E56 0%, #04342C 100%)',
          color: 'white',
          borderRadius: 16,
          padding: 20,
          marginBottom: 14,
        }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 12 }}>
            <div style={{
              width: 70,
              height: 70,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
            }}>
              {specialist.gender === 'female' ? '👩‍⚕️' : '👨‍⚕️'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, opacity: 0.85, marginBottom: 2 }}>
                أخصائي علاج طبيعي
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>
                {specialist.title} {specialist.full_name}
              </h2>
              {specialist.is_verified && (
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: 4, 
                  fontSize: 11, 
                  marginTop: 4,
                  background: 'rgba(255,255,255,0.15)',
                  padding: '2px 8px',
                  borderRadius: 10,
                }}>
                  <CheckCircle2 size={11} fill="currentColor" />
                  معتمد
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: 8,
            marginTop: 14,
            paddingTop: 14,
            borderTop: '1px solid rgba(255,255,255,0.15)',
          }}>
            <Stat 
              icon={<Award size={14} />} 
              value={`${specialist.years_experience}+`} 
              label="سنوات خبرة" 
            />
            <Stat 
              icon={<Star size={14} fill="currentColor" />} 
              value={specialist.rating_avg > 0 ? specialist.rating_avg.toFixed(1) : '—'} 
              label={`${specialist.rating_count} تقييم`} 
            />
            <Stat 
              icon={<Activity size={14} />} 
              value={specialist.total_sessions?.toString() || '0'} 
              label="جلسة" 
            />
          </div>
        </div>

        {/* Bio */}
        {specialist.bio && (
          <div style={{
            background: 'var(--white)',
            border: '1px solid var(--line)',
            borderRadius: 12,
            padding: 14,
            marginBottom: 14,
          }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-2)', marginBottom: 6 }}>
              نبذة عن الأخصائي
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink)', margin: 0, lineHeight: 1.7 }}>
              {specialist.bio}
            </p>
          </div>
        )}

        {/* Specialties */}
        {specialist.specialties && specialist.specialties.length > 0 && (
          <div style={{
            background: 'var(--white)',
            border: '1px solid var(--line)',
            borderRadius: 12,
            padding: 14,
            marginBottom: 14,
          }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-2)', marginBottom: 8 }}>
              التخصصات
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {specialist.specialties.map((s: string) => (
                <span 
                  key={s}
                  style={{
                    padding: '4px 10px',
                    background: 'var(--paper-2)',
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--ink-2)',
                  }}
                >
                  {SPECIALTIES_LABELS[s] || s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* خيارات الحجز */}
        <div style={{ marginBottom: 14 }}>
          <div className="scr-section-head">
            <div className="scr-section-title">خيارات الحجز</div>
          </div>

          {specialist.available_for_home && (
            <Link
              href={`/appointments/new?service=physio&specialist=${specialist.id}&type=home`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 14,
                background: 'var(--white)',
                border: '1px solid var(--line)',
                borderRadius: 12,
                textDecoration: 'none',
                color: 'inherit',
                marginBottom: 8,
              }}
            >
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: '#E1F5EE',
                color: '#0F6E56',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Home size={22} strokeWidth={2.2} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800 }}>زيارة منزلية</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                  الأخصائي يأتي لمنزلك · 45-60 دقيقة
                </div>
              </div>
              <div style={{ textAlign: 'end' }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--emerald)' }}>
                  {specialist.home_visit_price.toLocaleString('ar-IQ')}
                </div>
                <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>د.ع · كاش</div>
              </div>
            </Link>
          )}

          {specialist.available_for_clinic && (
            <Link
              href={`/appointments/new?service=physio&specialist=${specialist.id}&type=clinic`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 14,
                background: 'var(--white)',
                border: '1px solid var(--line)',
                borderRadius: 12,
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: '#FAEEDA',
                color: '#A57100',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Building2 size={22} strokeWidth={2.2} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800 }}>زيارة العيادة</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                  تزور الأخصائي في عيادته · 30-45 دقيقة
                </div>
              </div>
              <div style={{ textAlign: 'end' }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#A57100' }}>
                  {specialist.clinic_visit_price.toLocaleString('ar-IQ')}
                </div>
                <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>د.ع · كاش</div>
              </div>
            </Link>
          )}

          {specialist.package_discount_pct > 0 && (
            <div style={{
              marginTop: 8,
              padding: 10,
              background: '#FAEEDA',
              border: '1px solid #F0D7A4',
              borderRadius: 10,
              fontSize: 11,
              color: '#412402',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <Award size={14} strokeWidth={2.2} aria-hidden />
              <span>
                خصم {specialist.package_discount_pct}% عند حجز باقة جلسات
              </span>
            </div>
          )}
        </div>

        {/* Available service types */}
        {types.length > 0 && (
          <div style={{
            background: 'var(--white)',
            border: '1px solid var(--line)',
            borderRadius: 12,
            padding: 14,
            marginBottom: 14,
          }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-2)', marginBottom: 8 }}>
              الخدمات المتاحة
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {types.slice(0, 5).map((t) => (
                <div 
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: 8,
                    background: 'var(--paper-2)',
                    borderRadius: 8,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{t.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{t.name_ar}</div>
                    {t.description && (
                      <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>{t.description}</div>
                    )}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--emerald)' }}>
                    {t.base_price.toLocaleString('ar-IQ')} د.ع
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cities */}
        {specialist.cities && specialist.cities.length > 0 && (
          <div style={{
            background: 'var(--white)',
            border: '1px solid var(--line)',
            borderRadius: 12,
            padding: 14,
            marginBottom: 14,
          }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-2)', marginBottom: 8 }}>
              <MapPin size={12} strokeWidth={2.2} style={{ verticalAlign: -2, marginLeft: 4 }} aria-hidden />
              المدن المتاحة
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {specialist.cities.map((c: string) => (
                <span 
                  key={c}
                  style={{
                    padding: '4px 10px',
                    background: 'var(--paper-2)',
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{ height: 60 }} />
      </div>
    </main>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div style={{
      padding: 6,
      textAlign: 'center',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 2, opacity: 0.85 }}>
        {icon}
      </div>
      <div style={{ fontSize: 14, fontWeight: 900 }}>{value}</div>
      <div style={{ fontSize: 9, opacity: 0.75, marginTop: 1 }}>{label}</div>
    </div>
  );
}
