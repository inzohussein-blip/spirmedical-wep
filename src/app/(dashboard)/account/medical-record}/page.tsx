import Link from 'next/link';

export const metadata = {
  title: 'سجلي الطبي · سباير ميديكال',
};

export default function MedicalRecordPage() {
  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/account" className="scr-back-btn" aria-label="العودة">
            <span aria-hidden="true">→</span>
          </Link>
          <h1 className="scr-page-title">سجلي الطبي</h1>
          <div className="scr-page-spacer" />
        </div>

        <div className="scr-empty">
          <div className="scr-empty-icon" aria-hidden="true">📋</div>
          <h2 className="scr-empty-title">السجل الطبي قريباً</h2>
          <p className="scr-empty-desc">
            ستتمكّن قريباً من عرض:
            <br />
            • تاريخك الطبي
            <br />
            • نتائج الفحوصات
            <br />
            • المؤشرات الحيوية
            <br />
            • الوصفات الطبية
          </p>
          <Link href="/account" className="scr-empty-link">العودة لحسابي</Link>
        </div>
      </div>
    </main>
  );
}
