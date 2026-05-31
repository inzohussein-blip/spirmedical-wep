import { Metadata } from 'next';
import Link from 'next/link';
import { getAllLocations } from './actions';
import LocationsAdminClient from './LocationsAdminClient';

export const metadata: Metadata = {
  title: 'إدارة المواقع · لوحة التحكّم',
};

export const dynamic = 'force-dynamic';

export default async function LocationsAdminPage() {
  const { ok, locations, error } = await getAllLocations();

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <Link
          href="/admin44"
          style={{
            padding: '8px 12px', background: 'var(--white, #fff)',
            border: '1px solid var(--line, #E8E6DE)', borderRadius: 8,
            textDecoration: 'none', color: 'var(--ink-2, #5F5E5A)', fontSize: 13,
          }}
        >
          ← العودة
        </Link>
        <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>
          🗺️ إدارة المواقع الموحّدة
        </h1>
      </div>
      <p style={{ fontSize: 13, color: '#888780', margin: '0 0 18px' }}>
        كل مقدّمي الخدمات على خريطة واحدة — أضف، أظهر، أخفِ، أو احذف أي موقع.
      </p>

      {!ok ? (
        <div style={{ padding: 20, background: '#FCEBEB', border: '1px solid #F5B4B4', borderRadius: 12, color: '#791F1F' }}>
          ⚠️ تعذّر تحميل المواقع: {error || 'خطأ غير معروف'}
        </div>
      ) : (
        <LocationsAdminClient initialLocations={locations} />
      )}
    </div>
  );
}
