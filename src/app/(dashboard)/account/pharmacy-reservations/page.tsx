// ═══════════════════════════════════════════════════════════════
// 💊 V25.46: Pharmacy Reservations List
// ═══════════════════════════════════════════════════════════════

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  ArrowRight, Pill, Clock, CheckCircle2, XCircle, AlertCircle, 
  Building2, Calendar, Package,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'حجوزات الأدوية · سباير ميديكال' };

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending: { label: 'قيد المراجعة', color: '#A57100', bg: '#FAEEDA', icon: Clock },
  confirmed: { label: 'مؤكّد', color: '#0F6E56', bg: '#E1F5EE', icon: CheckCircle2 },
  partially_available: { label: 'متوفّر جزئياً', color: '#A57100', bg: '#FAEEDA', icon: AlertCircle },
  ready_for_pickup: { label: 'جاهز للاستلام', color: '#0F6E56', bg: '#E1F5EE', icon: Package },
  picked_up: { label: 'تمّ الاستلام', color: '#04342C', bg: '#E1F5EE', icon: CheckCircle2 },
  cancelled: { label: 'ملغى', color: '#A32D2D', bg: '#FCEBEB', icon: XCircle },
  expired: { label: 'منتهي', color: '#6B7280', bg: '#F3F4F6', icon: XCircle },
};

interface Reservation {
  id: string;
  pharmacy_id: string;
  items: Array<{ name: string; quantity: number; notes?: string }>;
  status: string;
  total_estimated_price: number | null;
  total_final_price: number | null;
  expected_pickup_at: string | null;
  expires_at: string | null;
  created_at: string;
  pharmacies?: { name: string; district: string; city: string; phone: string };
}

export default async function PharmacyReservationsPage() {
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
      pharmacies (name, district, city, phone)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const reservations = (result.data as Reservation[]) ?? [];

  // إحصاءات
  const active = reservations.filter(r => 
    ['pending', 'confirmed', 'partially_available', 'ready_for_pickup'].includes(r.status)
  ).length;
  const completed = reservations.filter(r => r.status === 'picked_up').length;
  const cancelled = reservations.filter(r => ['cancelled', 'expired'].includes(r.status)).length;

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/account" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} aria-hidden />
          </Link>
          <h1 className="scr-page-title">حجوزات الأدوية</h1>
          <div className="scr-page-spacer" />
        </div>
        <p className="scr-page-subtitle">طلباتك من الصيدليات</p>

        {/* Stats */}
        {reservations.length > 0 && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: 8,
            marginTop: 8,
          }}>
            <div className="service-card service-amber">
              <div className="service-icon"><Clock size={22} strokeWidth={2} /></div>
              <div className="service-title">{active}</div>
              <div className="service-desc">قيد التنفيذ</div>
            </div>
            <div className="service-card service-emerald">
              <div className="service-icon"><CheckCircle2 size={22} strokeWidth={2} /></div>
              <div className="service-title">{completed}</div>
              <div className="service-desc">مكتمل</div>
            </div>
            <div className="service-card service-default">
              <div className="service-icon"><XCircle size={22} strokeWidth={2} /></div>
              <div className="service-title">{cancelled}</div>
              <div className="service-desc">ملغى</div>
            </div>
          </div>
        )}

        {reservations.length === 0 ? (
          <div className="scr-empty" style={{ marginTop: 40 }}>
            <div className="scr-empty-icon"><Pill size={42} strokeWidth={1.5} /></div>
            <h2 className="scr-empty-title">لا توجد حجوزات بعد</h2>
            <p className="scr-empty-desc">
              ابحث عن الصيدليات واحجز أدويتك بسهولة.
            </p>
            <Link href="/services/pharmacies" className="scr-empty-cta">
              ابحث عن صيدلية ←
            </Link>
          </div>
        ) : (
          <>
            <div className="scr-section-head" style={{ marginTop: 16 }}>
              <div className="scr-section-title">السجل ({reservations.length})</div>
            </div>
            <div className="scr-list-stack">
              {reservations.map((r) => {
                const status = STATUS_META[r.status] ?? STATUS_META.pending;
                const StatusIcon = status.icon;
                const date = new Date(r.created_at).toLocaleDateString('ar-IQ', {
                  day: 'numeric', month: 'short', year: 'numeric',
                });
                
                return (
                  <Link
                    key={r.id}
                    href={`/account/pharmacy-reservations/${r.id}`}
                    className="scr-list-item scr-list-item-clickable"
                  >
                    <div className="scr-list-item-icon" aria-hidden="true">
                      <Pill size={22} strokeWidth={2} />
                    </div>
                    <div className="scr-list-item-content">
                      <div className="scr-list-item-title">
                        {r.items.length} دواء
                        {r.total_final_price && ` · ${r.total_final_price.toLocaleString('ar-IQ')} د.ع`}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                        {r.items.slice(0, 2).map(it => it.name).join('، ')}
                        {r.items.length > 2 && ` +${r.items.length - 2}`}
                      </div>
                      <div className="scr-list-item-meta">
                        <Building2 size={11} strokeWidth={2.2} aria-hidden style={{ verticalAlign: '-2px', marginLeft: 2 }} />
                        {r.pharmacies?.name || 'صيدلية'}
                        {' · '}
                        <Calendar size={11} strokeWidth={2.2} aria-hidden style={{ verticalAlign: '-2px', marginLeft: 2 }} />
                        {date}
                      </div>
                      <div className="scr-list-item-tags" style={{ marginTop: 6 }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontSize: 10,
                          fontWeight: 700,
                          background: status.bg,
                          color: status.color,
                        }}>
                          <StatusIcon size={11} strokeWidth={2.5} />
                          {status.label}
                        </span>
                      </div>
                    </div>
                    <div style={{ color: 'var(--ink-3)', fontSize: 18 }} aria-hidden="true">←</div>
                  </Link>
                );
              })}
            </div>
            
            <Link
              href="/services/pharmacies"
              className="scr-empty-cta"
              style={{ marginTop: 16, display: 'block', textAlign: 'center' }}
            >
              ابحث عن صيدلية أخرى ←
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
