import { Metadata } from 'next';
import Link from 'next/link';
import {
  FEATURED_SERVICE,
  CORE_SERVICES,
  SMART_TOOLS,
} from '@/lib/services-v3';
import { getServiceSwitches } from '@/lib/service-switches.server';
import { isEnabled, noteFor, NON_SWITCHABLE } from '@/lib/service-switches';
import ServiceSwitchesClient, { type Row } from './ServiceSwitchesClient';

export const metadata: Metadata = {
  title: 'تشغيل الخدمات · لوحة التحكّم',
};

export const dynamic = 'force-dynamic';

export default async function AdminServicesPage() {
  const switches = await getServiceSwitches();

  // القائمة تُبنى من `services-v3.ts` نفسه لا من الجدول: فخدمةٌ تُضاف إلى
  // الكود تظهر هنا فوراً بلا ترحيلٍ ولا إدخالٍ يدويّ (والغياب = مشتغلة).
  const build = (
    list: typeof CORE_SERVICES,
    group: Row['group']
  ): Row[] =>
    list
      .filter((s) => !NON_SWITCHABLE.has(s.id))
      .map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        route: s.route,
        group,
        isEnabled: isEnabled(switches, s.id),
        note: noteFor(switches, s.id),
      }));

  const rows: Row[] = [
    ...build([FEATURED_SERVICE], 'مميّزة'),
    ...build(CORE_SERVICES, 'خدمة'),
    ...build(SMART_TOOLS, 'أداة'),
  ];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
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
          🔌 تشغيل الخدمات
        </h1>
      </div>
      <p style={{ fontSize: 13, color: '#888780', margin: '0 0 18px' }}>
        أطفئ خدمةً مؤقّتاً فتبقى في مكانها بشارة «قريباً» ولا تُفتح.
        شاشة الطوارئ غير مُدرجةٍ هنا عمداً — لا تُطفأ بنقرة.
      </p>

      <ServiceSwitchesClient initial={rows} />
    </div>
  );
}
