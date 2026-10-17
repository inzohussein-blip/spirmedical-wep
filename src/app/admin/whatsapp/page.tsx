import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdminRole } from '@/lib/admin-types';
import { getWaOverview, GATEWAY_STALE_MS } from '@/lib/whatsapp/inbound-verify';
import { displayPhone } from '@/lib/whatsapp/share';

import EmojiIcon from '@/components/ui/EmojiIcon';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'واتساب · إدارة' };

/**
 * 📲 /admin/whatsapp — حالةُ التحقّق العكسيّ عبر واتساب (0050) للإدارة.
 * يقرأ فقط: المفتاحُ في Vercel (`WA_VERIFY_MODE`) والبوّابةُ في Railway.
 */
const MODE_AR = { off: 'مطفأ', optional: 'اختياريّ', required: 'إلزاميّ' } as const;

export default async function WhatsAppAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (!isAdminRole(profile?.role)) redirect('/admin');

  const o = await getWaOverview();
  const stale = o.gateway ? Date.now() - new Date(o.gateway.lastSeenAt).getTime() > GATEWAY_STALE_MS : true;
  const stats = (o.gateway?.detail?.stats ?? null) as Record<string, number> | null;

  const status = o.available
    ? { tone: 'var(--emerald)', text: '✓ يعمل — زرُّ «تحقّق عبر واتساب» ظاهرٌ للعملاء' }
    : o.mode === 'off'
      ? { tone: 'var(--ink-3)', text: 'مطفأ — لا يظهر شيءٌ للعملاء (WA_VERIFY_MODE=off)' }
      : { tone: 'var(--rose)', text: '✕ لا يعمل — الزرُّ مخفيّ؛ رمزُ الدخول والرمزُ المؤقّت يعملان' };

  return (
    <>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}><EmojiIcon e="📲" /> التحقّق عبر واتساب</h1>
      <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 20px', lineHeight: 1.7 }}>
        العميلُ يرسل رمزاً من رقمه إلى رقمنا، فيثبت ملكيّته — لاستعادة رمز الدخول وتفعيل الحسابات التي تنشئها الإدارة.
      </p>

      <section style={box} data-testid="wa-status">
        <div style={{ fontSize: 15, fontWeight: 800, color: status.tone }}>{status.text}</div>
      </section>

      <section style={box}>
        <h2 style={h2}>الإعداد</h2>
        <Row label="الوضع">{MODE_AR[o.mode]}</Row>
        <Row label="المصدر">{o.provider === 'meta' ? 'Meta (واجهة رسميّة)' : 'Baileys (بوّابة Railway)'}</Row>
        <Row label="رقم الاستقبال">{o.number ? <bdi dir="ltr">{displayPhone(o.number)}</bdi> : <Missing>WA_VERIFY_NUMBER</Missing>}</Row>
        {o.provider === 'baileys' && (
          <Row label="سرّ البوّابة">{o.secretSet ? 'مضبوط ✓' : <Missing>WA_INBOUND_SECRET</Missing>}</Row>
        )}
      </section>

      {o.provider === 'baileys' && (
        <section style={box}>
          <h2 style={h2}>البوّابة</h2>
          {o.gateway ? (
            <>
              <Row label="الاتصال">{o.gateway.connected && !stale ? 'متّصلة ✓' : 'منقطعة ✕'}</Row>
              <Row label="آخر نبضة">{new Date(o.gateway.lastSeenAt).toLocaleString('ar-IQ-u-nu-latn')}</Row>
              {stats && (
                <Row label="منذ آخر تشغيل">
                  {`${stats.codes ?? 0} رسالة برمز · ${stats.forwarded ?? 0} نُقلت · ${stats.hidden ?? 0} برقمٍ مخفيّ`}
                </Row>
              )}
            </>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>لم تصل أيُّ نبضةٍ بعد — البوّابةُ لم تُنشر أو السرُّ غيرُ متطابق.</p>
          )}
          <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '10px 0 0', lineHeight: 1.7 }}>
            انقطعت؟ افتح <code dir="ltr">/qr?token=…</code> في خدمة Railway وامسح الرمز من «الأجهزة المرتبطة».
          </p>
        </section>
      )}

      <section style={box}>
        <h2 style={h2}>آخر 24 ساعة</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          <Stat label="طُلب" value={o.last24h.started} />
          <Stat label="تحقّق" value={o.last24h.verified + o.last24h.consumed} />
          <Stat label="استُعمل" value={o.last24h.consumed} />
          <Stat label="انتهى/أُبطل" value={o.last24h.expired} />
        </div>
      </section>
    </>
  );
}

const box: React.CSSProperties = { background: 'var(--white)', borderRadius: 14, padding: 20, marginBottom: 16 };
const h2: React.CSSProperties = { fontSize: 14, fontWeight: 800, margin: '0 0 12px' };

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--paper-3)', fontSize: 13 }}>
      <span style={{ color: 'var(--ink-3)' }}>{label}</span>
      <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{children}</span>
    </div>
  );
}

function Missing({ children }: { children: React.ReactNode }) {
  return <span style={{ color: 'var(--rose)' }}>غير مضبوط (<code dir="ltr">{children}</code>)</span>;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ background: 'var(--paper-3)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
      <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--emerald-deep)' }}>{value.toLocaleString('ar-IQ-u-nu-latn')}</div>
      <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 700 }}>{label}</div>
    </div>
  );
}
