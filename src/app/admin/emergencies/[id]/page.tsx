// ═══════════════════════════════════════════════════════════════
// 🚨 Admin Emergency Detail (V27)
// ═══════════════════════════════════════════════════════════════
// صفحة تفاصيل بلاغ طوارئ واحد — الوجهة التي يشير إليها push الطوارئ
// (`/admin/emergencies/[id]`) والتي كانت مفقودة (404).
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import EmergencyActions from './EmergencyActions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'تفاصيل بلاغ طوارئ - Spir Medical' };

type Status = 'open' | 'responding' | 'resolved' | 'false_alarm';

const REASON_LABELS: Record<string, { label: string; emoji: string }> = {
  attack: { label: 'اعتداء جسدي', emoji: '🚨' },
  threat: { label: 'تهديد', emoji: '⚠️' },
  harassment: { label: 'مضايقة', emoji: '😨' },
  medical: { label: 'حالة طبية طارئة', emoji: '🏥' },
  other: { label: 'أخرى', emoji: '❓' },
};

const STATUS_CONFIG: Record<Status, { label: string; bg: string }> = {
  open: { label: 'مفتوحة', bg: 'var(--rose)' },
  responding: { label: 'يُستجاب لها', bg: 'var(--amber)' },
  resolved: { label: 'تم الحل', bg: 'var(--emerald)' },
  false_alarm: { label: 'إنذار كاذب', bg: 'var(--ink-3)' },
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
      <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 700 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 700, textAlign: 'left' }}>{children}</span>
    </div>
  );
}

export default async function EmergencyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/dashboard');
  }

  const { data: emergency } = await supabase
    .from('nurse_emergency_logs')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!emergency) notFound();

  const { data: specialist } = await supabase
    .from('users')
    .select('full_name, phone')
    .eq('id', emergency.specialist_id)
    .single();

  const status = (emergency.status as Status) ?? 'open';
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.open;
  const reason = REASON_LABELS[emergency.trigger_reason ?? 'other'] ?? REASON_LABELS.other;
  const hasGps = emergency.latitude != null && emergency.longitude != null;
  const mapsUrl = hasGps
    ? `https://www.google.com/maps?q=${emergency.latitude},${emergency.longitude}`
    : null;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          {reason.emoji} تفاصيل البلاغ
        </h1>
        <Link
          href="/admin/emergencies"
          style={{
            padding: '8px 16px', background: 'var(--paper-3)', border: '1px solid var(--line)',
            borderRadius: 10, fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', textDecoration: 'none',
          }}
        >
          ← كل البلاغات
        </Link>
      </div>

      {/* Status banner */}
      <div style={{
        background: statusCfg.bg, color: 'var(--paper-3)', borderRadius: 14,
        padding: 16, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 11, opacity: 0.9 }}>الحالة</div>
          <div style={{ fontSize: 18, fontWeight: 900 }}>{statusCfg.label}</div>
        </div>
        <div style={{ fontSize: 28 }}>{reason.emoji}</div>
      </div>

      {/* Details card */}
      <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 14, padding: '4px 16px', marginBottom: 16 }}>
        <Row label="سبب البلاغ">{reason.label}</Row>
        <Row label="الممرض">{specialist?.full_name || '—'}</Row>
        <Row label="الهاتف">
          {specialist?.phone ? (
            <a href={`tel:${specialist.phone}`} style={{ color: 'var(--emerald)', fontWeight: 800 }} dir="ltr">
              {specialist.phone}
            </a>
          ) : '—'}
        </Row>
        {emergency.description && <Row label="الوصف">{emergency.description}</Row>}
        <Row label="الموقع">
          {mapsUrl ? (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--emerald)', fontWeight: 800 }}>
              فتح الخريطة ↗{emergency.accuracy_m ? ` (±${Math.round(emergency.accuracy_m)}م)` : ''}
            </a>
          ) : 'غير متوفّر'}
        </Row>
        <Row label="أُبلغ مركز الاتصال">{emergency.call_center_notified ? 'نعم' : 'لا'}</Row>
        <Row label="اتصال 911">{emergency.contacted_911 ? 'نعم' : 'لا'}</Row>
        <Row label="وقت البلاغ">
          {new Date(emergency.created_at).toLocaleString('ar-IQ')}
        </Row>
        {emergency.resolved_at && (
          <Row label="وقت الحل">{new Date(emergency.resolved_at).toLocaleString('ar-IQ')}</Row>
        )}
      </div>

      {/* Quick actions */}
      {specialist?.phone && (
        <a
          href={`tel:${specialist.phone}`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: 'var(--emerald)', color: 'var(--paper-3)', borderRadius: 12,
            padding: 14, fontSize: 14, fontWeight: 800, textDecoration: 'none',
          }}
        >
          📞 اتصل بالممرض الآن
        </a>
      )}

      <EmergencyActions id={emergency.id} status={status} />
    </div>
  );
}
