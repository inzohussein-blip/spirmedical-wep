import Link from 'next/link';
import { IconClockPause, IconArrowRight } from '@tabler/icons-react';

/**
 * شاشة «قريباً» — تحلّ محلّ الخدمة المطفأة.
 *
 * تُعرض بدل الصفحة نفسها لا فوقها: المحتوى لا يُجلب ولا يُرسَل. فإطفاء
 * خدمةٍ يوقف عملها فعلاً، لا يُخفي زرّها وحده.
 */
export default function ServiceComingSoon({
  title,
  note,
}: {
  title: string;
  note?: string | null;
}) {
  return (
    <main
      className="app-screen"
      style={{ display: 'grid', placeItems: 'center', padding: '48px 20px' }}
    >
      <div style={{ maxWidth: 420, textAlign: 'center' }}>
        <div
          aria-hidden="true"
          style={{
            width: 84, height: 84, borderRadius: '50%', margin: '0 auto 18px',
            display: 'grid', placeItems: 'center', background: '#F1F3F4',
          }}
        >
          <IconClockPause size={40} stroke={1.5} color="#5F6368" />
        </div>

        <span
          style={{
            display: 'inline-block', marginBottom: 12, padding: '4px 12px',
            borderRadius: 9999, background: '#F1F3F4', color: '#5F6368',
            fontSize: 12, fontWeight: 800,
          }}
        >
          قريباً
        </span>

        <h1 style={{ fontSize: 20, fontWeight: 900, margin: '0 0 10px', color: '#202124' }}>
          {title}
        </h1>

        <p style={{ fontSize: 14, color: '#5F6368', lineHeight: 1.8, margin: '0 0 24px' }}>
          {note?.trim()
            ? note
            : 'هذه الخدمة غير متاحة حالياً. نعمل على تجهيزها وستكون بين يديك قريباً.'}
        </p>

        <Link
          href="/dashboard"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            minHeight: 44, padding: '0 20px', borderRadius: 12,
            background: 'var(--emerald-deep, var(--emerald-deep, #056559))', color: '#fff',
            fontSize: 14, fontWeight: 800, textDecoration: 'none',
          }}
        >
          <IconArrowRight size={18} stroke={2} />
          العودة إلى الخدمات
        </Link>
      </div>
    </main>
  );
}
