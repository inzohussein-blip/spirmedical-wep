// ═══════════════════════════════════════════════════════════════
// 🥗 صفحة تفاصيل أخصائي التغذية (V25.22)
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight, MapPin, Star, CheckCircle2,
  Award, TrendingUp, Globe, Users,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const SPECIALTY_LABELS: Record<string, { label: string; icon: string }> = {
  weight_loss:      { label: 'إنقاص الوزن',      icon: '⚖️' },
  weight_gain:      { label: 'زيادة الوزن',     icon: '💪' },
  sports_nutrition: { label: 'تغذية رياضية',     icon: '🏋️' },
  diabetes:         { label: 'السكري',          icon: '🩺' },
  pcos:             { label: 'تكيّس المبايض',   icon: '🌸' },
  pregnancy:        { label: 'الحمل',           icon: '🤰' },
  pediatric:        { label: 'الأطفال',         icon: '👶' },
  eating_disorders: { label: 'اضطرابات الأكل',  icon: '🍽️' },
  muscle_building:  { label: 'بناء العضلات',    icon: '💪' },
  cardiovascular:   { label: 'صحة القلب',       icon: '❤️' },
  breastfeeding:    { label: 'الرضاعة',         icon: '🤱' },
  women_health:     { label: 'صحة المرأة',      icon: '👩' },
};

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: n } = await supabase
    .from('nutritionists')
    .select('full_name, title, bio')
    .eq('id', params.id)
    .single();

  if (!n) return { title: 'أخصائي غير موجود' };

  return {
    title: `${n.title} ${n.full_name} | Spir Medical`,
    description: n.bio || `أخصائي تغذية`,
  };
}

export default async function NutritionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: n } = await supabase
    .from('nutritionists')
    .select('*')
    .eq('id', params.id)
    .eq('is_active', true)
    .single();

  if (!n) notFound();

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/services/nutrition" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} />
          </Link>
          <h1 className="scr-page-title" style={{ fontSize: 14 }}>🥗 تفاصيل الأخصائي</h1>
          <div className="scr-page-spacer" />
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
            }}>🥗</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>
                  {n.title} {n.full_name}
                </h2>
                {n.is_verified && <CheckCircle2 size={16} color="var(--emerald)" />}
              </div>
              {n.bio && (
                <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: 0, lineHeight: 1.6 }}>
                  {n.bio}
                </p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--ink-3)', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Award size={12} />{n.years_experience} سنة
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Users size={12} />{n.total_clients.toLocaleString('ar-IQ')} عميل
            </span>
            {n.success_rate > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--emerald)', fontWeight: 700 }}>
                <TrendingUp size={12} />{n.success_rate}% نجاح
              </span>
            )}
            {n.rating_count > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Star size={12} fill="var(--amber)" color="var(--amber)" />
                <strong style={{ color: 'var(--amber)' }}>{n.rating_avg.toFixed(1)}</strong>
                ({n.rating_count})
              </span>
            )}
          </div>
        </div>

        {/* Specialties */}
        {n.specialties && n.specialties.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>🎯 التخصّصات</h3>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6,
            }}>
              {n.specialties.map((sp: string, i: number) => {
                const meta = SPECIALTY_LABELS[sp];
                return (
                  <div key={i} style={{
                    background: 'var(--white)',
                    border: '1px solid var(--line)',
                    borderRadius: 8,
                    padding: '8px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--ink-2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}>
                    <span>{meta?.icon || '✓'}</span>
                    {meta?.label || sp}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Certifications */}
        {n.certifications && n.certifications.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>📜 الشهادات</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {n.certifications.map((c: string, i: number) => (
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

        {/* Languages & Cities */}
        {n.languages && n.languages.length > 0 && (
          <div style={{
            background: 'var(--paper-3)', borderRadius: 10, padding: 10,
            marginBottom: 10, fontSize: 12, color: 'var(--ink-2)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Globe size={14} />
            <span>{n.languages.map((l: string) => l === 'ar' ? 'العربية' : l === 'en' ? 'English' : l).join(' · ')}</span>
          </div>
        )}

        {n.cities && n.cities.length > 0 && (
          <div style={{
            background: 'var(--paper-3)', borderRadius: 10, padding: 10,
            marginBottom: 14, fontSize: 12, color: 'var(--ink-2)',
            display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <MapPin size={14} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{n.cities.join('، ')}</span>
          </div>
        )}

        {/* 3 Packages */}
        <div style={{
          background: 'var(--emerald-soft)',
          borderRadius: 12,
          padding: 14,
          marginBottom: 14,
        }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, marginBottom: 10, color: 'var(--emerald)' }}>
            💰 الباقات المتوفّرة
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <PackageCard
              icon="💬"
              title="استشارة"
              subtitle="لقاء أول"
              price={n.initial_consultation_price}
              color="var(--ink-2)"
            />
            <PackageCard
              icon="🔄"
              title="متابعة"
              subtitle="جلسة قصيرة"
              price={n.follow_up_price}
              color="var(--amber)"
            />
            <PackageCard
              icon="📅"
              title="شهرية"
              subtitle="خطة كاملة"
              price={n.monthly_plan_price}
              color="var(--emerald)"
              highlight
            />
          </div>
        </div>

        {/* CTAs - 3 packages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 20 }}>
          <Link
            href={`/services/booking?service=nutrition&id=${n.id}&package=monthly`}
            style={{
              ...primaryButton,
              background: 'var(--emerald)',
            }}
          >
            📅 احجز خطة شهرية - {n.monthly_plan_price.toLocaleString('ar-IQ')} د.ع
          </Link>
          <Link
            href={`/services/booking?service=nutrition&id=${n.id}&package=initial`}
            style={{...primaryButton, background: 'var(--white)', color: 'var(--emerald)', border: '1px solid var(--emerald)', boxShadow: 'none'}}
          >
            💬 استشارة أولى - {n.initial_consultation_price.toLocaleString('ar-IQ')} د.ع
          </Link>
        </div>
      </div>
    </main>
  );
}

function PackageCard({ icon, title, subtitle, price, color, highlight }: {
  icon: string; title: string; subtitle: string; price: number; color: string; highlight?: boolean;
}) {
  return (
    <div style={{
      padding: '10px 8px',
      background: highlight ? 'var(--white)' : 'var(--paper-3)',
      borderRadius: 10,
      border: highlight ? '2px solid var(--emerald)' : '1px solid var(--line)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 8, color: 'var(--ink-3)', marginBottom: 4 }}>{subtitle}</div>
      <div style={{ fontSize: 13, fontWeight: 900, color }}>
        {price.toLocaleString('ar-IQ')}
      </div>
      <div style={{ fontSize: 8, color: 'var(--ink-3)' }}>د.ع</div>
    </div>
  );
}

const primaryButton: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: '14px 18px',
  color: 'var(--paper-3)',
  borderRadius: 14,
  textDecoration: 'none',
  fontSize: 13,
  fontWeight: 800,
  boxShadow: '0 4px 12px rgba(15,107,88,0.3)',
};
