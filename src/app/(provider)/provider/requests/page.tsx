import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { isProviderType } from '@/lib/providers';
import { listingKindFor } from '@/lib/provider-listings';
import { getOwnedListings } from '@/lib/provider-listings-server';
import { DISPLAY_LOCALE } from '@/lib/format/locale';
import RequestActions from './RequestActions';

export const metadata = { title: 'الطلبات · نافذة الخدمة' };
export const dynamic = 'force-dynamic';

/**
 * 🏥 طلباتُ المنشأة (الدفعة 3): حجوزاتُ الصيدلية، أو مواعيدُ العيادة/المستشفى. بعميل الخدمة مقيّدةً بمنشآت
 * الحساب. ويرى المنشأةُ اسمَ المريض وهاتفَه — هو من يستلم الدواء أو يحضر الموعد.
 */
const RES_STATUS: Record<string, { label: string; tone: string }> = {
  pending: { label: 'جديد', tone: 'amber' },
  confirmed: { label: 'مؤكَّد', tone: 'blue' },
  partially_available: { label: 'متوفّرٌ جزئياً', tone: 'blue' },
  ready_for_pickup: { label: 'جاهزٌ للاستلام', tone: 'green' },
  picked_up: { label: 'استُلم', tone: 'green' },
  cancelled: { label: 'ملغى', tone: 'rose' },
  expired: { label: 'منتهٍ', tone: 'rose' },
};
const APPT_STATUS: Record<string, { label: string; tone: string }> = {
  pending: { label: 'جديد', tone: 'amber' },
  confirmed: { label: 'مؤكَّد', tone: 'blue' },
  in_progress: { label: 'جارٍ', tone: 'blue' },
  completed: { label: 'تمّ', tone: 'green' },
  cancelled: { label: 'ملغى', tone: 'rose' },
};
const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString(DISPLAY_LOCALE, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Baghdad' }) : '—';

type Item = { name?: string; qty?: number; quantity?: number };

export default async function ProviderRequests() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: me } = await supabase.from('users').select('provider_type').eq('id', user.id).single();
  const kind = isProviderType(me?.provider_type) ? listingKindFor(me.provider_type) : null;

  if (!kind) {
    return (
      <main className="app-screen"><div className="scr-content pv">
        <h1 className="pv-title">الطلبات</h1>
        <p className="pv-note">طلباتُ المختبر عيّنات — تجدها في <Link href="/provider/samples">العيّنات</Link>.</p>
      </div></main>
    );
  }

  const owned = await getOwnedListings(user.id, kind);
  if (owned.length === 0) {
    return (
      <main className="app-screen"><div className="scr-content pv">
        <h1 className="pv-title">الطلبات</h1>
        <section className="pv-card">
          <p className="pv-note">تصلك الطلباتُ بعد ربط حسابك بمنشأتك في الدليل واعتماد الإدارة للربط.</p>
          <Link href="/provider/listing" className="pv-btn">اربط منشأتك</Link>
        </section>
      </div></main>
    );
  }
  const ids = owned.map((l) => l.id);
  const db = createAdminClient();

  type Row = { id: string; user_id: string; status: string; title: string; when: string; lines: string[] };
  let rows: Row[] = [];
  if (kind === 'pharmacy') {
    const { data } = await db
      .from('pharmacy_reservations')
      .select('id, user_id, status, items, customer_notes, total_estimated_price, created_at, expected_pickup_at')
      .in('pharmacy_id', ids)
      .order('created_at', { ascending: false })
      .limit(100);
    rows = (data ?? []).map((r) => {
      const items = (Array.isArray(r.items) ? r.items : []) as Item[];
      return {
        id: r.id, user_id: r.user_id, status: r.status ?? 'pending',
        title: items.map((i) => `${i.name ?? 'صنف'} × ${i.qty ?? i.quantity ?? 1}`).join('، ') || 'حجزُ دواء',
        when: fmt(r.created_at),
        lines: [r.customer_notes ? `ملاحظةُ المريض: ${r.customer_notes}` : '', r.expected_pickup_at ? `الاستلام: ${fmt(r.expected_pickup_at)}` : ''].filter(Boolean),
      };
    });
  } else {
    const { data } = await db
      .from('appointments')
      .select('id, user_id, status, service_type, scheduled_at, hospital_department, chief_complaint, doctor_appointment_type')
      .in(kind === 'doctor' ? 'doctor_id' : 'hospital_id', ids)
      .order('scheduled_at', { ascending: false })
      .limit(100);
    rows = (data ?? []).map((r) => ({
      id: r.id, user_id: r.user_id, status: r.status ?? 'pending',
      title: r.hospital_department || r.doctor_appointment_type || r.service_type || 'موعد',
      when: fmt(r.scheduled_at),
      lines: [r.chief_complaint ? `الشكوى: ${r.chief_complaint}` : ''].filter(Boolean),
    }));
  }

  const patientIds = [...new Set(rows.map((r) => r.user_id))];
  const { data: patients } = patientIds.length
    ? await db.from('users').select('id, full_name, phone').in('id', patientIds)
    : { data: [] as { id: string; full_name: string | null; phone: string | null }[] };
  const who = new Map((patients ?? []).map((p) => [p.id, p]));
  const statusMap = kind === 'pharmacy' ? RES_STATUS : APPT_STATUS;
  const open = rows.filter((r) => !['picked_up', 'completed', 'cancelled', 'expired'].includes(r.status));
  const closed = rows.filter((r) => !open.includes(r));

  const card = (r: Row) => {
    const s = statusMap[r.status] ?? statusMap.pending;
    const p = who.get(r.user_id);
    return (
      <li key={r.id} className="pv-sample">
        <span className="pv-sample-head">
          <span className="pv-sample-code">{r.title}</span>
          <span className={`pv-pill pv-pill-${s.tone}`}>{s.label}</span>
        </span>
        <span className="pv-sample-meta">
          {p?.full_name ?? 'مريض'}{p?.phone ? <> · <bdi dir="ltr">{p.phone}</bdi></> : null} · {r.when}
        </span>
        {r.lines.map((l) => <span key={l} className="pv-sample-tests">{l}</span>)}
        <RequestActions kind={kind === 'pharmacy' ? 'reservation' : 'booking'} id={r.id} status={r.status} />
      </li>
    );
  };

  return (
    <main className="app-screen">
      <div className="scr-content pv">
        <h1 className="pv-title">الطلبات</h1>
        <section className="pv-card" aria-label="بانتظار ردّك">
          <h2 className="pv-card-title">بانتظار ردّك ({open.length})</h2>
          {open.length ? <ul className="pv-samples">{open.map(card)}</ul>
            : <p className="pv-note">لا طلباتٍ مفتوحة. حين يحجز مريضٌ في {owned[0].name} يظهر الطلبُ هنا ويصلك إشعار.</p>}
        </section>
        {closed.length > 0 && (
          <section className="pv-card" aria-label="المنتهية">
            <h2 className="pv-card-title">المنتهية ({closed.length})</h2>
            <ul className="pv-samples">{closed.map(card)}</ul>
          </section>
        )}
      </div>
    </main>
  );
}
