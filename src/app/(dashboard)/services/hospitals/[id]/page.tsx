// ═══════════════════════════════════════════════════════════════
// 🏥 صفحة تفاصيل المستشفى (V25.9)
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight, MapPin, Phone, Star, Building2, AlertTriangle,
  CheckCircle2, Clock, BedDouble, Activity, Map as MapIcon,
  MessageCircle, Globe, Mail,
} from 'lucide-react';
import { FreeMedicalMapWrapper } from '@/components/ui/FreeMedicalMapWrapper';
import ShareButton from '@/components/pwa/ShareButton';

export const dynamic = 'force-dynamic';

const TYPE_META: Record<string, { label: string; color: string; emoji: string }> = {
  government: { label: 'حكومي', color: '#0E5C4D', emoji: '🏛️' },
  private: { label: 'أهلي', color: '#B8540C', emoji: '🏥' },
  health_center: { label: 'مركز صحي', color: '#5C6BC0', emoji: '🏪' },
  specialized: { label: 'تخصصي', color: '#A82E3D', emoji: '🔬' },
};

const DEPARTMENT_LABELS: Record<string, string> = {
  emergency: 'الطوارئ',
  cardiology: 'قسم القلبية',
  pediatrics: 'قسم الأطفال',
  maternity: 'قسم النسائية والولادة',
  surgery: 'الجراحة العامة',
  orthopedics: 'العظام',
  oncology: 'الأورام',
  icu: 'العناية المركزة',
  lab: 'المختبر',
  radiology: 'الأشعة',
  pharmacy: 'الصيدلية',
  neurology: 'الأعصاب',
  urology: 'البولية',
  dermatology: 'الجلدية',
  psychiatry: 'النفسية',
};

export default async function HospitalDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: hospital } = await supabase
    .from('hospitals')
    .select('*')
    .eq('id', params.id)
    .eq('is_active', true)
    .single();

  if (!hospital) notFound();

  const typeMeta = TYPE_META[hospital.type] || TYPE_META.private;

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/services/hospitals" className="scr-back-btn">
            <ArrowRight size={20} strokeWidth={2.2} />
          </Link>
          <h1 className="scr-page-title" style={{ fontSize: 15 }}>
            {hospital.name}
          </h1>
          <ShareButton
            variant="icon"
            size="sm"
            title={hospital.name}
            text={`مستشفى على Spir Medical${hospital.city ? ` - ${hospital.city}` : ''}`}
            url={`/services/hospitals/${hospital.id}`}
            label="مشاركة المستشفى"
          />
        </div>

        {/* Hero */}
        <div
          style={{
            background: `linear-gradient(135deg, ${typeMeta.color}, ${typeMeta.color}DD)`,
            color: 'var(--paper-3)',
            borderRadius: 18,
            padding: 18,
            marginBottom: 14,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -40,
              insetInlineEnd: -40,
              width: 160,
              height: 160,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: 'rgba(255,255,255,0.18)',
                fontSize: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {typeMeta.emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                {hospital.name}
                {hospital.is_verified && <CheckCircle2 size={16} fill="currentColor" />}
              </h2>
              <div
                style={{
                  display: 'inline-block',
                  marginTop: 4,
                  padding: '2px 10px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: 100,
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                {typeMeta.label}
              </div>
              <p style={{ fontSize: 12, opacity: 0.85, margin: '6px 0 0' }}>
                <MapPin size={11} style={{ display: 'inline', verticalAlign: -2, marginInlineEnd: 2 }} />
                {hospital.city}
                {hospital.district && ` · ${hospital.district}`}
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
              marginTop: 14,
              position: 'relative',
            }}
          >
            {hospital.is_24h && (
              <StatBox icon={<Clock size={14} />} value="٢٤/٧" label="ساعات العمل" />
            )}
            {hospital.beds_count && (
              <StatBox icon={<BedDouble size={14} />} value={String(hospital.beds_count)} label="سرير" />
            )}
            {hospital.icu_beds_count && (
              <StatBox icon={<Activity size={14} />} value={String(hospital.icu_beds_count)} label="عناية" />
            )}
            {hospital.rating_count > 0 && (
              <StatBox
                icon={<Star size={14} fill="currentColor" />}
                value={hospital.rating_avg.toFixed(1)}
                label={`${hospital.rating_count} تقييم`}
              />
            )}
          </div>
        </div>

        {/* Contact actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 14 }}>
          {hospital.phone && (
            <a
              href={`tel:${hospital.phone}`}
              style={contactBtn('var(--emerald)')}
            >
              <Phone size={16} />
              <span>اتصال</span>
            </a>
          )}
          {hospital.phone_emergency && (
            <a
              href={`tel:${hospital.phone_emergency}`}
              style={contactBtn('var(--rose)')}
            >
              <AlertTriangle size={16} />
              <span>طوارئ</span>
            </a>
          )}
          {hospital.whatsapp && (
            <a
              href={`https://wa.me/${hospital.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={contactBtn('#25D366')}
            >
              <MessageCircle size={16} />
              <span>واتساب</span>
            </a>
          )}
        </div>

        {/* Description */}
        {hospital.description && (
          <div
            style={{
              background: 'var(--white)',
              border: '1px solid var(--line)',
              borderRadius: 12,
              padding: 14,
              marginBottom: 14,
            }}
          >
            <p style={{ fontSize: 12, color: 'var(--ink-2)', margin: 0, lineHeight: 1.7 }}>
              {hospital.description}
            </p>
          </div>
        )}

        {/* Departments */}
        {hospital.departments && hospital.departments.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 8px' }}>
              الأقسام والخدمات
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: 6,
              }}
            >
              {hospital.departments.map((d) => (
                <div
                  key={d}
                  style={{
                    padding: '8px 10px',
                    background: 'var(--white)',
                    border: '1px solid var(--line)',
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  {DEPARTMENT_LABELS[d] || d}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        <div style={{ marginBottom: 14 }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 8px' }}>الخدمات</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <Feature has={hospital.has_emergency} label="قسم طوارئ" emoji="🚨" />
            <Feature has={hospital.has_ambulance} label="إسعاف" emoji="🚑" />
            <Feature has={hospital.has_lab} label="مختبر" emoji="🧪" />
            <Feature has={hospital.has_radiology} label="أشعة" emoji="📡" />
            <Feature has={hospital.has_pharmacy} label="صيدلية" emoji="💊" />
          </div>
        </div>

        {/* Visiting hours */}
        {hospital.visiting_hours && (
          <div
            style={{
              background: 'var(--paper-3)',
              padding: 12,
              borderRadius: 10,
              marginBottom: 14,
              fontSize: 12,
            }}
          >
            <strong style={{ fontWeight: 800 }}>
              <Clock size={12} style={{ display: 'inline', verticalAlign: -1, marginInlineEnd: 4 }} />
              أوقات الزيارة:
            </strong>{' '}
            {hospital.visiting_hours}
          </div>
        )}

        {/* Map */}
        {hospital.latitude && hospital.longitude && (
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 8px' }}>
              <MapIcon size={14} style={{ display: 'inline', verticalAlign: -2, marginInlineEnd: 4 }} />
              الموقع
            </h3>
            <FreeMedicalMapWrapper
              marker={{
                id: hospital.id,
                lat: hospital.latitude,
                lng: hospital.longitude,
                title: hospital.name,
                subtitle: hospital.address || `${hospital.city} - ${hospital.district}`,
                variant: hospital.type === 'government' ? 'specialist' : 'pharmacy',
              }}
              height={280}
              showDirections={true}
            />
            {hospital.address && (
              <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8 }}>
                <MapPin size={11} style={{ display: 'inline', verticalAlign: -1, marginInlineEnd: 4 }} />
                {hospital.address}
              </p>
            )}
          </div>
        )}

        {/* External links */}
        {(hospital.website || hospital.email) && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {hospital.website && (
              <a
                href={hospital.website}
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...contactBtn('var(--ink-2)'), flex: 1 }}
              >
                <Globe size={14} />
                <span>الموقع</span>
              </a>
            )}
            {hospital.email && (
              <a
                href={`mailto:${hospital.email}`}
                style={{ ...contactBtn('var(--ink-2)'), flex: 1 }}
              >
                <Mail size={14} />
                <span>بريد</span>
              </a>
            )}
          </div>
        )}

        <div style={{ height: 80 }} />
      </div>
    </main>
  );
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: h } = await supabase
    .from('hospitals')
    .select('name, city')
    .eq('id', params.id)
    .single();
  return { title: h ? `${h.name} - Spir Medical` : 'مستشفى' };
}

function StatBox({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div style={{ padding: 8, background: 'rgba(255,255,255,0.12)', borderRadius: 10, textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 2, opacity: 0.85 }}>{icon}</div>
      <div style={{ fontSize: 13, fontWeight: 900 }}>{value}</div>
      <div style={{ fontSize: 9, opacity: 0.75, marginTop: 1 }}>{label}</div>
    </div>
  );
}

function Feature({ has, label, emoji }: { has: boolean; label: string; emoji: string }) {
  return (
    <div
      style={{
        padding: '6px 10px',
        background: has ? 'var(--emerald-soft)' : 'var(--paper-3)',
        color: has ? 'var(--emerald)' : 'var(--ink-3)',
        borderRadius: 100,
        fontSize: 11,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        opacity: has ? 1 : 0.5,
      }}
    >
      <span>{emoji}</span>
      <span>{label}</span>
      {has && <CheckCircle2 size={10} />}
    </div>
  );
}

function contactBtn(color: string): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    background: color,
    color: 'var(--paper-3)',
    borderRadius: 10,
    textDecoration: 'none',
    fontSize: 12,
    fontWeight: 800,
  };
}
