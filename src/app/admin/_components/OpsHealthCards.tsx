import Link from 'next/link';
import type { OpsHealth } from '@/lib/admin/ops-health';

import EmojiIcon from '@/components/ui/EmojiIcon';
/**
 * بطاقتا صحّة التشغيل أعلى لوحة الإدارة. تظهران حين يوجد ما يستدعي تدخّلاً،
 * وتصمتان حين يكون كلُّ شيءٍ سليماً — لا ضجيجَ دائم يتعلّم المشرفُ تجاهله.
 */
export default function OpsHealthCards({ health }: { health: OpsHealth }) {
  const uncovered = health.coverage.filter((c) => c.approved === 0);
  const q = health.queue;
  const queueTrouble = q && (q.failed24h > 0 || q.retrying > 0);
  const wa = health.waGateway;
  const waDown = !!wa && !wa.connected;
  const errs = health.errors;
  const errTrouble = !!errs && (errs.last24h > 0 || errs.fatal > 0);

  if (uncovered.length === 0 && !queueTrouble && !waDown && !errTrouble) return null;

  const card: React.CSSProperties = {
    background: 'var(--white)',
    borderRadius: 14,
    padding: '16px 18px',
    marginBottom: 16,
    borderRight: '4px solid var(--rose, #C71C56)',
  };

  return (
    <section aria-label="صحّة التشغيل">
      {uncovered.length > 0 && (
        <div role="alert" style={card} data-testid="ops-no-specialists">
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', marginBottom: 6 }}>
            <EmojiIcon e="🚫" /> خدماتٌ مغلقة: لا مختصَّ معتمَداً
          </div>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '0 0 10px', lineHeight: 1.7 }}>
            المرضى يرون «غير متاحة حالياً» ولا يستطيعون رفعَ طلب لهذه الأنواع.
          </p>
          <ul style={{ margin: '0 0 12px', padding: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
            {uncovered.map((c) => (
              <li key={c.type} style={{ fontSize: 13, color: 'var(--ink-2)', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span>{c.label}</span>
                <span style={{ color: 'var(--ink-3)' }}>
                  {c.waiting > 0 ? `${c.waiting.toLocaleString('ar-IQ-u-nu-latn')} بانتظار الخدمة` : 'لا منتظرين'}
                </span>
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Link href="/admin/specialists/pending" style={linkBtn}>مراجعة طلبات التسجيل</Link>
            <Link href="/admin/users/create" style={linkBtn}>إنشاء حساب مختصّ</Link>
          </div>
        </div>
      )}

      {errs && errTrouble && (
        <div role="alert" style={card} data-testid="ops-system-errors">
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', marginBottom: 6 }}>
            <EmojiIcon e="🚨" /> أخطاءٌ في النظام
          </div>
          <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '0 0 10px', lineHeight: 1.7 }}>
            {errs.last24h.toLocaleString('ar-IQ-u-nu-latn')} ظهر أو تكرّر في 24 ساعة ·{' '}
            {errs.open.toLocaleString('ar-IQ-u-nu-latn')} مفتوحاً
            {errs.fatal > 0 && <> · <b style={{ color: 'var(--rose)' }}>{errs.fatal.toLocaleString('ar-IQ-u-nu-latn')} حرِج</b></>}
          </p>
          <Link href="/admin/errors" style={linkBtn}>رصد الأخطاء</Link>
        </div>
      )}

      {q && queueTrouble && (
        <div role="alert" style={card} data-testid="ops-queue-health">
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', marginBottom: 6 }}>
            <EmojiIcon e="📨" /> رسائلُ لا تصل
          </div>
          <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '0 0 8px', lineHeight: 1.7 }}>
            {q.failed24h.toLocaleString('ar-IQ-u-nu-latn')} فشلت نهائياً خلال 24 ساعة ·{' '}
            {q.retrying.toLocaleString('ar-IQ-u-nu-latn')} تُعاد محاولتُها
          </p>
          {q.lastError && (
            <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '0 0 10px', lineHeight: 1.7 }}>
              آخر خطأ{q.lastErrorChannel ? ` (${q.lastErrorChannel})` : ''}:{' '}
              <code dir="ltr" style={{ fontSize: 12, background: 'var(--paper-2, #F1F3F4)', padding: '1px 6px', borderRadius: 6 }}>
                {q.lastError.slice(0, 160)}
              </code>
            </p>
          )}
          <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '0 0 10px' }}>
            المرضى يجدون نسخةً في صندوق الإشعارات داخل التطبيق.
          </p>
          <Link href="/admin/notifications" style={linkBtn}>سجلّ الإشعارات</Link>
        </div>
      )}
      {wa && waDown && (
        <div role="alert" style={card} data-testid="ops-wa-gateway">
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', marginBottom: 6 }}>
            <EmojiIcon e="📲" /> بوّابة واتساب منقطعة
          </div>
          <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '0 0 8px', lineHeight: 1.7 }}>
            زرُّ «تحقّق عبر واتساب» مخفيٌّ عن العملاء الآن — رمزُ الدخول والرمزُ المؤقّت من الإدارة يعملان.
          </p>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: 0, lineHeight: 1.7 }}>
            {wa.lastSeenAt
              ? `آخر نبضة: ${new Date(wa.lastSeenAt).toLocaleString('ar-IQ-u-nu-latn')}`
              : 'لم تصل أيُّ نبضةٍ بعد'}{' '}
            · افتح صفحةَ <code dir="ltr">/qr</code> في خدمة Railway وأعد ربطَ الرقم إن طُلب.
          </p>
          <div style={{ marginTop: 10 }}>
            <Link href="/admin/whatsapp" style={linkBtn}>حالة واتساب</Link>
          </div>
        </div>
      )}
    </section>
  );
}

const linkBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 40,
  padding: '0 14px',
  borderRadius: 10,
  background: 'var(--paper-2, #F1F3F4)',
  color: 'var(--ink)',
  fontSize: 13,
  fontWeight: 700,
  textDecoration: 'none',
};
