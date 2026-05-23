// ═══════════════════════════════════════════════════════════════
// 💊 V25.46: Pharmacy Reservation Detail
// ═══════════════════════════════════════════════════════════════

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import {
  ArrowRight, Pill, Clock, Building2, Phone, MapPin, MessageCircle,
  Calendar, AlertTriangle, CheckCircle2, X, Package,
} from 'lucide-react';
import CancelReservationButton from './CancelReservationButton';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'تفاصيل الحجز · سباير ميديكال' };

const STATUS_META: Record<string, { 
  label: string; color: string; bg: string; description: string;
}> = {
  pending: { 
    label: 'قيد المراجعة', 
    color: '#A57100', bg: '#FAEEDA',
    description: 'الصيدلية تراجع طلبك',
  },
  confirmed: { 
    label: 'مؤكّد ✓', 
    color: '#0F6E56', bg: '#E1F5EE',
    description: 'الأدوية متوفّرة - يمكنك المرور لاستلامها',
  },
  partially_available: { 
    label: 'متوفّر جزئياً ⚠️', 
    color: '#A57100', bg: '#FAEEDA',
    description: 'بعض الأدوية متوفّرة فقط - راجع التفاصيل',
  },
  ready_for_pickup: { 
    label: 'جاهز للاستلام 🎉', 
    color: '#0F6E56', bg: '#E1F5EE',
    description: 'الدواء جاهز - يمكنك المرور الآن',
  },
  picked_up: { 
    label: 'تمّ الاستلام ✓', 
    color: '#04342C', bg: '#E1F5EE',
    description: 'استلمت الأدوية بنجاح',
  },
  cancelled: { 
    label: 'ملغى', 
    color: '#A32D2D', bg: '#FCEBEB',
    description: 'تمّ إلغاء الحجز',
  },
  expired: { 
    label: 'منتهي', 
    color: '#6B7280', bg: '#F3F4F6',
    description: 'انتهت صلاحية الحجز',
  },
};

interface PageProps {
  params: { id: string };
}

export default async function ReservationDetailPage({ params }: PageProps) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  
  const supabaseAny = supabase as unknown as {
    from: (t: string) => {
            select: (cols: string) => any;
    };
  };

  
  const result = await supabaseAny
    .from('pharmacy_reservations')
    .select(`
      *,
      pharmacies (id, name, district, city, address, phone, whatsapp, latitude, longitude)
    `)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (!result.data) {
    notFound();
  }

  
  const reservation = result.data as {
    id: string;
    items: Array<{ name: string; quantity: number; notes?: string }>;
    status: string;
    customer_notes: string | null;
    pharmacy_notes: string | null;
    total_estimated_price: number | null;
    total_final_price: number | null;
    expected_pickup_at: string | null;
    expires_at: string | null;
    confirmed_at: string | null;
    picked_up_at: string | null;
    cancelled_at: string | null;
    cancellation_reason: string | null;
    created_at: string;
    pharmacies: {
      id: string;
      name: string;
      district: string;
      city: string;
      address: string | null;
      phone: string;
      whatsapp: string | null;
      latitude: number | null;
      longitude: number | null;
    };
  };

  const status = STATUS_META[reservation.status] ?? STATUS_META.pending;
  const createdDate = new Date(reservation.created_at).toLocaleDateString('ar-IQ', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const expectedDate = reservation.expected_pickup_at 
    ? new Date(reservation.expected_pickup_at).toLocaleDateString('ar-IQ', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
      })
    : null;

  const canCancel = ['pending', 'confirmed', 'partially_available', 'ready_for_pickup'].includes(reservation.status);
  const mapsUrl = reservation.pharmacies.latitude && reservation.pharmacies.longitude
    ? `https://www.google.com/maps?q=${reservation.pharmacies.latitude},${reservation.pharmacies.longitude}`
    : null;

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/account/pharmacy-reservations" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} aria-hidden />
          </Link>
          <h1 className="scr-page-title">تفاصيل الحجز</h1>
          <div className="scr-page-spacer" />
        </div>

        {/* Status Card */}
        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--line)',
          borderRadius: 14,
          padding: 16,
          marginTop: 12,
          marginBottom: 12,
        }}>
          <div style={{
            display: 'inline-block',
            padding: '4px 12px',
            background: status.bg,
            color: status.color,
            borderRadius: 16,
            fontSize: 12,
            fontWeight: 800,
            marginBottom: 8,
          }}>
            {status.label}
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>
            {status.description}
          </div>
          
          {reservation.cancellation_reason && (
            <div style={{ 
              marginTop: 8, 
              padding: 8, 
              background: 'var(--paper-2)', 
              borderRadius: 8, 
              fontSize: 11, 
              color: 'var(--ink-3)' 
            }}>
              <strong>السبب:</strong> {reservation.cancellation_reason}
            </div>
          )}
          
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--line)' }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>
              <Calendar size={11} strokeWidth={2.2} style={{ verticalAlign: -2, marginLeft: 4 }} aria-hidden />
              تاريخ الطلب: {createdDate}
            </div>
            {expectedDate && (
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                <Clock size={11} strokeWidth={2.2} style={{ verticalAlign: -2, marginLeft: 4 }} aria-hidden />
                وقت الاستلام: {expectedDate}
              </div>
            )}
          </div>
        </div>

        {/* الصيدلية */}
        <div className="scr-section-head" style={{ marginTop: 16 }}>
          <div className="scr-section-title">
            <Building2 size={16} strokeWidth={2} style={{ verticalAlign: -3, marginLeft: 4 }} aria-hidden />
            الصيدلية
          </div>
        </div>
        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          padding: 14,
          marginBottom: 12,
        }}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>
            {reservation.pharmacies.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 8 }}>
            <MapPin size={11} strokeWidth={2.2} style={{ verticalAlign: -2, marginLeft: 4 }} aria-hidden />
            {reservation.pharmacies.city} - {reservation.pharmacies.district}
            {reservation.pharmacies.address && ` - ${reservation.pharmacies.address}`}
          </div>
          
          {/* أزرار التواصل */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <a 
              href={`tel:${reservation.pharmacies.phone}`}
              style={{
                padding: '6px 12px',
                background: '#E1F5EE',
                color: '#04342C',
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Phone size={12} strokeWidth={2.2} aria-hidden />
              اتصال
            </a>
            {reservation.pharmacies.whatsapp && (
              <a 
                href={`https://wa.me/${reservation.pharmacies.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '6px 12px',
                  background: '#E1F5EE',
                  color: '#04342C',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <MessageCircle size={12} strokeWidth={2.2} aria-hidden />
                واتساب
              </a>
            )}
            {mapsUrl && (
              <a 
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '6px 12px',
                  background: 'var(--paper-2)',
                  color: 'var(--ink-2)',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <MapPin size={12} strokeWidth={2.2} aria-hidden />
                خرائط
              </a>
            )}
          </div>
        </div>

        {/* الأدوية */}
        <div className="scr-section-head" style={{ marginTop: 16 }}>
          <div className="scr-section-title">
            <Pill size={16} strokeWidth={2} style={{ verticalAlign: -3, marginLeft: 4 }} aria-hidden />
            الأدوية ({reservation.items.length})
          </div>
        </div>
        <div className="scr-list-stack">
          {reservation.items.map((item, i) => (
            <div key={i} className="scr-list-item">
              <div className="scr-list-item-icon" aria-hidden="true">
                <Pill size={18} strokeWidth={2} />
              </div>
              <div className="scr-list-item-content">
                <div className="scr-list-item-title">{item.name}</div>
                {item.notes && (
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{item.notes}</div>
                )}
              </div>
              <div style={{
                padding: '4px 10px',
                background: 'var(--paper-2)',
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 700,
              }}>
                ×{item.quantity}
              </div>
            </div>
          ))}
        </div>

        {/* ملاحظاتك */}
        {reservation.customer_notes && (
          <>
            <div className="scr-section-head" style={{ marginTop: 16 }}>
              <div className="scr-section-title">ملاحظاتك</div>
            </div>
            <div style={{
              background: 'var(--white)',
              border: '1px solid var(--line)',
              borderRadius: 10,
              padding: 12,
              fontSize: 12,
              color: 'var(--ink-2)',
              marginBottom: 12,
            }}>
              {reservation.customer_notes}
            </div>
          </>
        )}

        {/* ملاحظات الصيدلية */}
        {reservation.pharmacy_notes && (
          <>
            <div className="scr-section-head" style={{ marginTop: 16 }}>
              <div className="scr-section-title">ملاحظات الصيدلية</div>
            </div>
            <div style={{
              background: '#FAEEDA',
              border: '1px solid #F0D7A4',
              borderRadius: 10,
              padding: 12,
              fontSize: 12,
              color: '#412402',
              marginBottom: 12,
            }}>
              {reservation.pharmacy_notes}
            </div>
          </>
        )}

        {/* الفاتورة */}
        {(reservation.total_estimated_price || reservation.total_final_price) && (
          <>
            <div className="scr-section-head" style={{ marginTop: 16 }}>
              <div className="scr-section-title">الفاتورة</div>
            </div>
            <div style={{
              background: 'var(--white)',
              border: '1px solid var(--line)',
              borderRadius: 12,
              padding: 14,
              marginBottom: 12,
            }}>
              {reservation.total_estimated_price && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: 'var(--ink-2)' }}>السعر التقديري</span>
                  <span>{reservation.total_estimated_price.toLocaleString('ar-IQ')} د.ع</span>
                </div>
              )}
              {reservation.total_final_price && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontSize: 16, 
                  fontWeight: 800,
                  paddingTop: 8,
                  borderTop: '1px solid var(--line)',
                  marginTop: 8,
                }}>
                  <span>الإجمالي</span>
                  <span style={{ color: '#0F6E56' }}>{reservation.total_final_price.toLocaleString('ar-IQ')} د.ع</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Cancel button */}
        {canCancel && (
          <CancelReservationButton reservationId={reservation.id} />
        )}

        <div className="scr-info-banner" style={{ marginTop: 16 }}>
          <CheckCircle2 size={14} strokeWidth={2.2} aria-hidden />
          <span>الدفع كاش عند الاستلام في الصيدلية</span>
        </div>
      </div>
    </main>
  );
}
