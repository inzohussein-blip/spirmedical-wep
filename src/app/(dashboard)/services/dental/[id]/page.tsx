// ═══════════════════════════════════════════════════════════════
// 🦷 صفحة تفاصيل عيادة الأسنان (V25.22)
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight, MapPin, Phone, Star, CheckCircle2,
  Users, Clock, MessageCircle,
} from 'lucide-react';
import ServiceFavoriteButton from '@/components/services/ServiceFavoriteButton';
import { checkIsFavorite } from '@/components/services/favorites-actions';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: clinic } = await supabase
    .from('dental_clinics')
    .select('name, city, description')
    .eq('id', params.id)
    .single();

  if (!clinic) return { title: 'عيادة غير موجودة' };

  return {
    title: `${clinic.name} - ${clinic.city} | Spir Medical`,
    description: clinic.description || `عيادة أسنان في ${clinic.city}`,
  };
}

export default async function DentalDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: clinic } = await supabase
    .from('dental_clinics')
    .select('*')
    .eq('id', params.id)
    .eq('is_active', true)
    .single();

  if (!clinic) notFound();

  const isFavorite = await checkIsFavorite('dental', clinic.id);

  const services = [
    clinic.offers_cleaning && { icon: '✨', label: 'تنظيف الأسنان' },
    clinic.offers_fillings && { icon: '🦷', label: 'حشوات' },
    clinic.offers_extraction && { icon: '🔧', label: 'خلع' },
    clinic.offers_implants && { icon: '🔩', label: 'زراعة الأسنان' },
    clinic.offers_orthodontics && { icon: '😬', label: 'تقويم' },
    clinic.offers_whitening && { icon: '✨', label: 'تبييض' },
    clinic.offers_cosmetic && { icon: '💎', label: 'تجميل' },
    clinic.offers_pediatric && { icon: '👶', label: 'طب أسنان الأطفال' },
    clinic.offers_emergency && { icon: '🚨', label: 'طوارئ 24/7' },
  ].filter(Boolean) as { icon: string; label: string }[];

  return (
    <main className="app-screen">
      <div className="scr-content">
        {/* Header */}
        <div className="scr-page-header">
          <Link href="/services/dental" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} />
          </Link>
          <h1 className="scr-page-title" style={{ fontSize: 14 }}>
            🦷 تفاصيل العيادة
          </h1>
          <ServiceFavoriteButton
            serviceType="dental"
            serviceId={clinic.id}
            initialIsFavorite={isFavorite}
            size="sm"
          />
        </div>

        {/* Hero */}
        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--line)',
          borderRadius: 16,
          padding: 16,
          marginBottom: 14,
          borderInlineStartWidth: clinic.is_featured ? 4 : 1,
          borderInlineStartStyle: 'solid',
          borderInlineStartColor: clinic.is_featured ? 'var(--amber)' : 'var(--line)',
        }}>
          <div style={{ display: 'flex', gap: 14, marginBottom: 12 }}>
            <div style={{
              width: 72, height: 72, borderRadius: 16,
              background: 'var(--emerald-soft)',
              fontSize: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              🦷
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>
                  {clinic.name}
                </h2>
                {clinic.is_verified && <CheckCircle2 size={16} color="var(--emerald)" />}
              </div>
              {clinic.is_featured && (
                <span style={{
                  display: 'inline-block',
                  fontSize: 10, fontWeight: 900,
                  background: 'var(--amber)', color: 'var(--paper-3)',
                  padding: '2px 8px', borderRadius: 100,
                  marginBottom: 6,
                }}>
                  ⭐ عيادة مميّزة
                </span>
              )}
              {clinic.description && (
                <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: 0, lineHeight: 1.6 }}>
                  {clinic.description}
                </p>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--ink-3)', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <MapPin size={12} />
              {clinic.city}{clinic.district ? ` · ${clinic.district}` : ''}
            </span>
            {clinic.doctor_count > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Users size={12} />
                {clinic.doctor_count} طبيب
              </span>
            )}
            {clinic.rating_count > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Star size={12} fill="var(--amber)" color="var(--amber)" />
                <strong style={{ color: 'var(--amber)' }}>{clinic.rating_avg.toFixed(1)}</strong>
                ({clinic.rating_count} تقييم)
              </span>
            )}
            {clinic.working_hours && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Clock size={12} />
                {clinic.working_hours}
              </span>
            )}
          </div>
        </div>

        {/* Address */}
        {clinic.address && (
          <div style={{
            background: 'var(--paper-3)',
            borderRadius: 10,
            padding: 12,
            marginBottom: 14,
            fontSize: 12,
            color: 'var(--ink-2)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
          }}>
            <MapPin size={14} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{clinic.address}</span>
          </div>
        )}

        {/* Doctors */}
        {clinic.doctor_names && clinic.doctor_names.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
              👨‍⚕️ الأطباء
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {clinic.doctor_names.map((name: string, i: number) => (
                <div key={i} style={{
                  background: 'var(--white)',
                  border: '1px solid var(--line)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: 12,
                  color: 'var(--ink-2)',
                }}>
                  {name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services */}
        {services.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
              🦷 الخدمات المتوفّرة
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 6,
            }}>
              {services.map((s, i) => (
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
                  <span>{s.icon}</span>
                  {s.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pricing */}
        <div style={{
          background: 'var(--emerald-soft)',
          borderRadius: 12,
          padding: 14,
          marginBottom: 14,
        }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, marginBottom: 10, color: 'var(--emerald)' }}>
            💰 الأسعار
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
            <PriceRow
              label="تنظيف الأسنان"
              min={clinic.cleaning_price_min}
              max={clinic.cleaning_price_max}
              show={clinic.offers_cleaning}
            />
            <PriceRow
              label="حشوة"
              min={clinic.filling_price_min}
              max={clinic.filling_price_max}
              show={clinic.offers_fillings}
            />
            <PriceRow
              label="خلع سن"
              min={clinic.extraction_price_min}
              max={clinic.extraction_price_max}
              show={clinic.offers_extraction}
            />
            <PriceRow
              label="زراعة سن"
              min={clinic.implant_price_min}
              max={clinic.implant_price_max}
              show={clinic.offers_implants}
            />
          </div>
          <p style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 10, marginBottom: 0, lineHeight: 1.5 }}>
            💡 الأسعار تقريبية وتتوقّف على الحالة. تأكّد من العيادة قبل الزيارة.
          </p>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 20 }}>
          <Link
            href={`/services/booking?service=dental&id=${clinic.id}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '14px 18px',
              background: 'var(--emerald)',
              color: 'var(--paper-3)',
              borderRadius: 14,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 900,
              boxShadow: '0 4px 12px rgba(15,107,88,0.3)',
            }}
          >
            📅 احجز موعد عبر سباير
          </Link>

          <div style={{ display: 'flex', gap: 8 }}>
            {clinic.phone && (
              <a
                href={`tel:${clinic.phone}`}
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  background: 'var(--white)',
                  color: 'var(--emerald)',
                  border: '1px solid var(--emerald)',
                  borderRadius: 12,
                  textDecoration: 'none',
                  textAlign: 'center',
                  fontSize: 12,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}
              >
                <Phone size={14} />
                اتصل
              </a>
            )}
            {(clinic.whatsapp || clinic.phone) && (
              <a
                href={`https://wa.me/${(clinic.whatsapp || clinic.phone)!.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('السلام عليكم - أود الاستفسار عبر Spir Medical')}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  background: 'var(--white)',
                  color: 'var(--ink-2)',
                  border: '1px solid var(--line)',
                  borderRadius: 12,
                  textDecoration: 'none',
                  textAlign: 'center',
                  fontSize: 12,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}
              >
                <MessageCircle size={14} />
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function PriceRow({ label, min, max, show }: { label: string; min: number; max: number; show: boolean }) {
  if (!show || (!min && !max)) return null;
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '6px 0',
      borderBottom: '1px solid rgba(0,0,0,0.05)',
    }}>
      <span style={{ fontWeight: 600 }}>{label}</span>
      <span style={{ fontWeight: 700, color: 'var(--emerald)' }}>
        {min.toLocaleString('ar-IQ')} - {max.toLocaleString('ar-IQ')} د.ع
      </span>
    </div>
  );
}
