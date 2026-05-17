'use client';

import Link from 'next/link';

export default function OfflinePage() {
  const handleRetry = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <main className="app-screen">
      <div className="offline-container">
        <div className="offline-icon" aria-hidden="true">📡</div>
        <h1 className="offline-title">لا يوجد اتصال</h1>
        <p className="offline-desc">
          يبدو أنك غير متصل بالإنترنت
          <br />
          تحقق من اتصالك وحاول مرة أخرى
        </p>

        <div className="offline-features">
          <div className="offline-feature">
            <span aria-hidden="true">✓</span>
            <span>سجلك الطبي محفوظ ومتاح</span>
          </div>
          <div className="offline-feature">
            <span aria-hidden="true">✓</span>
            <span>المواعيد السابقة محفوظة</span>
          </div>
          <div className="offline-feature">
            <span aria-hidden="true">✓</span>
            <span>سيتم مزامنة البيانات عند عودة النت</span>
          </div>
        </div>

        <button type="button" onClick={handleRetry} className="offline-retry">
          <span aria-hidden="true">🔄</span>
          <span>المحاولة مرة أخرى</span>
        </button>

        <Link href="/" className="offline-home">
          العودة للرئيسية
        </Link>
      </div>
    </main>
  );
}
