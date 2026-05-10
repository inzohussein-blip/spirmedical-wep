import Link from 'next/link';

export const metadata = {
  title: 'الإعدادات · سباير ميديكال',
};

export default function SettingsPage() {
  return (
    <main className="app-screen">
      <div className="scr-content">

        <div className="scr-page-header">
          <Link href="/account" className="scr-back-btn" aria-label="العودة">
            <span aria-hidden="true">→</span>
          </Link>
          <h1 className="scr-page-title">الإعدادات</h1>
          <div className="scr-page-spacer" />
        </div>

        <div className="scr-empty">
          <div className="scr-empty-icon" aria-hidden="true">⚙</div>
          <h2 className="scr-empty-title">الإعدادات قيد التطوير</h2>
          <p className="scr-empty-desc">
            ستتمكّن قريباً من تخصيص:
            <br />
            • اللغة والمنطقة
            <br />
            • الإشعارات
            <br />
            • الخصوصية والأمان
          </p>
          <Link href="/account" className="scr-empty-link">العودة لحسابي</Link>
        </div>

      </div>
    </main>
  );
}
