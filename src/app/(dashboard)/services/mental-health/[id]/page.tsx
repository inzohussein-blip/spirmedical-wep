// ═══════════════════════════════════════════════════════════════
// 🧠 صفحة تفاصيل أخصائي الصحة النفسية (V25.22)
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight, MapPin, Star, CheckCircle2,
  Award, Heart, AlertCircle, Globe,
} from 'lucide-react';
import ServiceFavoriteButton from '@/components/services/ServiceFavoriteButton';
import { checkIsFavorite } from '@/components/services/favorites-actions';

export const dynamic = 'force-dynamic';

const TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  psychiatrist:     { label: 'طبيب نفسي',    icon: '⚕️' },
  psychologist:     { label: 'أخصائي نفسي',  icon: '🧠' },
  therapist:        { label: 'معالج نفسي',    icon: '💭' },
  counselor:        { label: 'مرشد نفسي',     icon: '🤝' },
  family_therapist: { label: 'معالج عائلي',   icon: '👨‍👩‍👧' },
};

const SPECIALTY_LABELS: Record<string, string> = {
  anxiety: 'القلق', depression: 'الاكتئاب', ocd: 'الوسواس القهري',
  trauma: 'الصدمات', bipolar: 'ثنائي القطب', couples: 'العلاقات',
  family: 'العائلة', children: 'الأطفال', adolescents: 'المراهقين',
  addiction: 'الإدمان', eating_disorders: 'اضطرابات الأكل',
  women_health: 'صحة المرأة', adhd: 'فرط الحركة', parenting: 'التربية',
};

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: s } = await supabase
    .from('mental_health_specialists')
    .select('full_name, title, bio')
    .eq('id', params.id)
    .single();

  if (!s) return { title: 'أخصائي غير موجود' };

  return {
    title: `${s.title} ${s.full_name} | Spir Medical`,
    description: s.bio || `أخصائي صحة نفسية`,
  };
}

export default async function MentalDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: s } = await supabase
    .from('mental_health_specialists')
    .select('*')
    .eq('id', params.id)
    .eq('is_active', true)
    .single();

  if (!s) notFound();

  const typeMeta = TYPE_LABELS[s.specialist_type];
  const isFavorite = await checkIsFavorite('mental_health', s.id);

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/services/mental-health" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} />
          </Link>
          <h1 className="scr-page-title" style={{ fontSize: 14 }}>🧠 تفاصيل الأخصائي</h1>
          <ServiceFavoriteButton
            serviceType="mental_health"
            serviceId={s.id}
            initialIsFavorite={isFavorite}
            size="sm"
          />
        </div>

        {/* Privacy banner */}
        <div style={{
          background: 'var(--emerald-soft)',
          borderRadius: 10,
          padding: 10,
          marginBottom: 14,
          fontSize: 11,
          color: 'var(--ink-2)',
          display: 'flex',
          gap: 8,
          alignItems: 'flex-start',
        }}>
          <Heart size={14} color="var(--emerald)" style={{ flexShrink: 0, marginTop: 1 }} />
          <span><strong>كل الجلسات سرية 100%</strong> · بدون أي وصمة</span>
        </div>

        {/* Hero */}
        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--line)',
          borderRadius: 16,
          padding: 16,
          marginBottom: 14,
        }}>
          <div style={{ display: 'flex', gap: 14, marginBottom: 12 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'var(--emerald-soft)',
              fontSize: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>{typeMeta.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>
                  {s.title} {s.full_name}
                </h2>
                {s.is_verified && <CheckCircle2 size={16} color="var(--emerald)" />}
              </div>
              <div style={{ fontSize: 12, color: 'var(--emerald)', fontWeight: 700, marginBottom: 6 }}>
                {typeMeta.label}
              </div>
              {s.bio && (
                <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: 0, lineHeight: 1.6 }}>
                  {s.bio}
                </p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--ink-3)', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Award size={12} />{s.years_experience} سنة خبرة
            </span>
            <span>📊 {s.total_sessions.toLocaleString('ar-IQ')} جلسة</span>
            {s.rating_count > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Star size={12} fill="var(--amber)" color="var(--amber)" />
                <strong style={{ color: 'var(--amber)' }}>{s.rating_avg.toFixed(1)}</strong>
                ({s.rating_count})
              </span>
            )}
          </div>
        </div>

        {/* Specialties */}
        {s.specialties && s.specialties.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>🎯 التخصّصات</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {s.specialties.map((sp: string, i: number) => (
                <span key={i} style={{
                  background: 'var(--paper-3)', borderRadius: 100, padding: '5px 12px',
                  fontSize: 11, fontWeight: 700, color: 'var(--ink-2)',
                }}>
                  {SPECIALTY_LABELS[sp] || sp}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {s.certifications && s.certifications.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>📜 الشهادات</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {s.certifications.map((c: string, i: number) => (
                <div key={i} style={{
                  fontSize: 12, color: 'var(--ink-2)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <CheckCircle2 size={12} color="var(--emerald)" />
                  {c}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {s.languages && s.languages.length > 0 && (
          <div style={{
            background: 'var(--paper-3)', borderRadius: 10, padding: 10,
            marginBottom: 14, fontSize: 12, color: 'var(--ink-2)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Globe size={14} />
            <span>اللغات: {s.languages.map((l: string) => l === 'ar' ? 'العربية' : l === 'en' ? 'English' : l).join(' · ')}</span>
          </div>
        )}

        {/* Cities */}
        {s.cities && s.cities.length > 0 && (
          <div style={{
            background: 'var(--paper-3)', borderRadius: 10, padding: 10,
            marginBottom: 14, fontSize: 12, color: 'var(--ink-2)',
            display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <MapPin size={14} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{s.cities.join('، ')}</span>
          </div>
        )}

        {/* Emergency */}
        {s.accepts_emergency && (
          <div style={{
            background: 'var(--rose-soft)', borderRadius: 10, padding: 10,
            marginBottom: 14, fontSize: 12, color: 'var(--ink-2)',
            display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <AlertCircle size={14} color="var(--rose)" style={{ flexShrink: 0, marginTop: 1 }} />
            <span><strong>🚨 يستقبل حالات طوارئ</strong> - يمكن التواصل في أي وقت</span>
          </div>
        )}

        {/* Pricing - 2 packages */}
        <div style={{
          background: 'var(--emerald-soft)',
          borderRadius: 12,
          padding: 14,
          marginBottom: 14,
        }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, marginBottom: 10, color: 'var(--emerald)' }}>
            💰 خيارات الجلسة (مدة: {s.session_duration_minutes} دقيقة)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {s.available_online && (
              <div style={{
                background: 'var(--white)',
                borderRadius: 10,
                padding: 12,
                border: '2px solid var(--emerald)',
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>💻 أونلاين</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--emerald)' }}>
                  {s.online_session_price.toLocaleString('ar-IQ')}
                </div>
                <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>د.ع / جلسة</div>
              </div>
            )}
            {s.available_in_clinic && (
              <div style={{
                background: 'var(--white)',
                borderRadius: 10,
                padding: 12,
                border: '1px solid var(--line)',
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>🏢 عيادة</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--amber)' }}>
                  {s.clinic_session_price.toLocaleString('ar-IQ')}
                </div>
                <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>د.ع / جلسة</div>
              </div>
            )}
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 20 }}>
          {s.available_online && (
            <Link
              href={`/services/booking?service=mental-health&id=${s.id}&package=online`}
              style={primaryButton}
            >
              💻 احجز جلسة أونلاين - {s.online_session_price.toLocaleString('ar-IQ')} د.ع
            </Link>
          )}
          {s.available_in_clinic && (
            <Link
              href={`/services/booking?service=mental-health&id=${s.id}&package=clinic`}
              style={{...primaryButton, background: 'var(--amber)'}}
            >
              🏢 احجز جلسة في العيادة - {s.clinic_session_price.toLocaleString('ar-IQ')} د.ع
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

const primaryButton: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: '14px 18px',
  background: 'var(--emerald)',
  color: 'var(--paper-3)',
  borderRadius: 14,
  textDecoration: 'none',
  fontSize: 13,
  fontWeight: 800,
  boxShadow: '0 4px 12px rgba(15,107,88,0.3)',
};
