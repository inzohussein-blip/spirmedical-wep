import Link from 'next/link';
import type { OpsHealth } from '@/lib/admin/ops-health';

/**
 * بطاقتا صحّة التشغيل أعلى لوحة الإدارة. تظهران حين يوجد ما يستدعي تدخّلاً،
 * وتصمتان حين يكون كلُّ شيءٍ سليماً — لا ضجيجَ دائم يتعلّم المشرفُ تجاهله.
 */
export default function OpsHealthCards({ health }: { health: OpsHealth }) {
  const uncovered = health.coverage.filter((c) => c.approved === 0);
  const q = health.queue;
  const queueTrouble = q && (q.failed24h > 0 || q.retrying > 0);

  if (uncovered.length === 0 && !queueTrouble) return null;

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
            🚫 خدماتٌ مغلقة: لا مختصَّ معتمَداً
          </div>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '0 0 10px', lineHeight: 1.7 }}>
            المرضى يرون «غير متاحة حالياً» ولا يستطيعون رفعَ طلب لهذه الأنواع.
          </p>
          <ul style={{ margin: '0 0 12px', padding: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
            {uncovered.map((c) => (
              <li key={c.type} style={{ fontSize: 13, color: 'var(--ink-2)', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span>{c.label}</span>
                <span style={{ color: 'var(--ink-3)' }}>
                  {c.waiting > 0 ? `${c.waiting.toLocaleString('ar-IQ')} بانتظار الخدمة` : 'لا منتظرين'}
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

      {q && queueTrouble && (
        <div role="alert" style={card} data-testid="ops-queue-health">
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', marginBottom: 6 }}>
            📨 رسائلُ لا تصل
          </div>
          <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '0 0 8px', lineHeight: 1.7 }}>
            {q.failed24h.toLocaleString('ar-IQ')} فشلت نهائياً خلال ٢٤ ساعة ·{' '}
            {q.retrying.toLocaleString('ar-IQ')} تُعاد محاولتُها
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
