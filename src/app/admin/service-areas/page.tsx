import { Metadata } from 'next';
import Link from 'next/link';
import { getServiceAreas } from './actions';
import ServiceAreasClient from './ServiceAreasClient';

export const metadata: Metadata = {
  title: 'مناطق الخدمة · لوحة التحكّم',
};

export const dynamic = 'force-dynamic';

export default async function ServiceAreasPage() {
  const { ok, areas, error } = await getServiceAreas();

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <Link
          href="/admin"
          style={{
            padding: '8px 12px', background: 'var(--white, #fff)',
            border: '1px solid var(--line, #DADCE0)', borderRadius: 8,
            textDecoration: 'none', color: 'var(--ink-2, #3C4043)', fontSize: 13,
          }}
        >
          ← العودة
        </Link>
        <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>
          🧭 مناطق الخدمة
        </h1>
      </div>
      <p style={{ fontSize: 13, color: '#888780', margin: '0 0 18px' }}>
        ارسم على الخريطة المناطق التي تصلها الخدمة. المناطق المفعّلة يقرؤها
        التطبيق ليُخبر المريض قبل الحجز لا بعده.
      </p>

      {!ok ? (
        <div
          style={{
            padding: 20, background: '#FCEBEB', border: '1px solid #F5B4B4',
            borderRadius: 12, color: '#791F1F',
          }}
        >
          ⚠️ تعذّر تحميل المناطق: {error || 'خطأ غير معروف'}
        </div>
      ) : (
        <ServiceAreasClient initialAreas={areas} />
      )}
    </div>
  );
}
