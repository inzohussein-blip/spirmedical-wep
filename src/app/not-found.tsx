import Link from 'next/link';

export const metadata = {
  title: 'الصفحة غير موجودة · سباير ميديكال',
};

export default function NotFound() {
  return (
    <main className="app-screen">
      <div className="error-container">
        <div className="error-icon" aria-hidden="true">🔍</div>
        <h1 className="error-title">الصفحة غير موجودة</h1>
        <p className="error-desc">
          الصفحة التي تبحث عنها غير متوفرة.
          <br />
          ربما تم نقلها أو حذفها.
        </p>

        <div className="error-404">
          <span>404</span>
        </div>

        <div className="error-actions">
          <Link href="/" className="error-btn-primary">
            <span aria-hidden="true">🏠</span>
            <span>العودة للرئيسية</span>
          </Link>

          <Link href="/dashboard" className="error-btn-secondary">
            <span aria-hidden="true">📱</span>
            <span>التطبيق</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
