// ═══════════════════════════════════════════════════════════════
// 👓 صفحة تفاصيل متجر النظارات (V25.22)
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight, MapPin, Phone, Star, CheckCircle2,
  Clock, MessageCircle, Eye,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: store } = await supabase
    .from('optical_stores')
    .select('name, city, description')
    .eq('id', params.id)
    .single();

  if (!store) return { title: 'متجر غير موجود' };

  return {
    title: `${store.name} - ${store.city} | Spir Medical`,
    description: store.description || `متجر نظارات في ${store.city}`,
  };
}

export default async function OpticalDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: store } = await supabase
    .from('optical_stores')
    .select('*')
    .eq('id', params.id)
    .eq('is_active', true)
    .single();

  if (!store) notFound();

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/services/optical" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} />
          </Link>
          <h1 className="scr-page-title" style={{ fontSize: 14 }}>👓 تفاصيل المتجر</h1>
          <div className="scr-page-spacer" />
        </div>

        {/* Hero */}
        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--line)',
          borderRadius: 16,
          padding: 16,
          marginBottom: 14,
          borderInlineStartWidth: store.is_featured ? 4 : 1,
          borderInlineStartStyle: 'solid',
          borderInlineStartColor: store.is_featured ? 'var(--amber)' : 'var(--line)',
        }}>
          <div style={{ display: 'flex', gap: 14, marginBottom: 12 }}>
            <div style={{
              width: 72, height: 72, borderRadius: 16,
              background: 'var(--amber-soft)',
              fontSize: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>👓</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>{store.name}</h2>
                {store.is_verified && <CheckCircle2 size={16} color="var(--emerald)" />}
              </div>
              {store.is_featured && (
                <span style={{
                  display: 'inline-block', fontSize: 10, fontWeight: 900,
                  background: 'var(--amber)', color: 'var(--paper-3)',
                  padding: '2px 8px', borderRadius: 100, marginBottom: 6,
                }}>⭐ متجر مميّز</span>
              )}
              {store.description && (
                <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: 0, lineHeight: 1.6 }}>
                  {store.description}
                </p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--ink-3)', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <MapPin size={12} />{store.city}{store.district ? ` · ${store.district}` : ''}
            </span>
            {store.rating_count > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Star size={12} fill="var(--amber)" color="var(--amber)" />
                <strong style={{ color: 'var(--amber)' }}>{store.rating_avg.toFixed(1)}</strong>
                ({store.rating_count})
              </span>
            )}
            {store.working_hours && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Clock size={12} />{store.working_hours}
              </span>
            )}
          </div>
        </div>

        {/* Address */}
        {store.address && (
          <div style={{
            background: 'var(--paper-3)', borderRadius: 10, padding: 12,
            marginBottom: 14, fontSize: 12, color: 'var(--ink-2)',
            display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <MapPin size={14} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{store.address}</span>
          </div>
        )}

        {/* Brands */}
        {store.brands && store.brands.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>🏷️ العلامات التجارية</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {store.brands.map((b: string, i: number) => (
                <span key={i} style={{
                  background: 'var(--white)',
                  border: '1px solid var(--line)',
                  borderRadius: 100,
                  padding: '5px 12px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--ink-2)',
                }}>
                  {b}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Services */}
        <div style={{ marginBottom: 14 }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>🔧 الخدمات</h3>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6,
          }}>
            {[
              store.offers_eye_exam && { icon: '👁️', label: `فحص نظر - ${store.exam_price.toLocaleString('ar-IQ')} د.ع` },
              store.offers_prescription_lenses && { icon: '🔍', label: 'عدسات طبية' },
              store.offers_sunglasses && { icon: '🕶️', label: 'نظارات شمسية' },
              store.offers_contact_lenses && { icon: '👁️‍🗨️', label: 'عدسات لاصقة' },
              store.offers_eye_surgery_referral && { icon: '🏥', label: 'إحالة لعمليات' },
            ].filter(Boolean).map((s, i) => (
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
                <span>{(s as { icon: string }).icon}</span>
                {(s as { label: string }).label}
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div style={{
          background: 'var(--amber-soft)',
          borderRadius: 12,
          padding: 14,
          marginBottom: 14,
        }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, marginBottom: 10, color: 'var(--amber)' }}>
            💰 الأسعار
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <span style={{ fontWeight: 600 }}>🖼️ إطارات</span>
              <span style={{ fontWeight: 700, color: 'var(--amber)' }}>
                {store.frame_price_min.toLocaleString('ar-IQ')} - {store.frame_price_max.toLocaleString('ar-IQ')} د.ع
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span style={{ fontWeight: 600 }}>🔍 عدسات</span>
              <span style={{ fontWeight: 700, color: 'var(--amber)' }}>
                {store.lens_price_min.toLocaleString('ar-IQ')} - {store.lens_price_max.toLocaleString('ar-IQ')} د.ع
              </span>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 20 }}>
          <Link
            href={`/services/booking?service=optical&id=${store.id}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '14px 18px',
              background: 'var(--amber)',
              color: 'var(--paper-3)',
              borderRadius: 14,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 900,
              boxShadow: '0 4px 12px rgba(201,121,22,0.3)',
            }}
          >
            📅 احجز زيارة عبر سباير
          </Link>

          {store.phone && (
            <div style={{ display: 'flex', gap: 8 }}>
              <a href={`tel:${store.phone}`} style={ctaSecondary('var(--amber)')}>
                <Phone size={14} />اتصل
              </a>
              <a href={`https://wa.me/${store.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('السلام عليكم - أود الاستفسار عبر Spir Medical')}`}
                target="_blank" rel="noopener noreferrer"
                style={ctaSecondary('var(--ink-2)')}>
                <MessageCircle size={14} />WhatsApp
              </a>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function ctaSecondary(color: string): React.CSSProperties {
  return {
    flex: 1,
    padding: '12px 14px',
    background: 'var(--white)',
    color,
    border: `1px solid ${color}`,
    borderRadius: 12,
    textDecoration: 'none',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  };
}
