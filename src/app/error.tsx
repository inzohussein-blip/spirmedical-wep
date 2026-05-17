'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Error:', error);
  }, [error]);

  return (
    <main className="app-screen">
      <div className="error-container">
        <div className="error-icon" aria-hidden="true">⚠️</div>
        <h1 className="error-title">حدث خطأ غير متوقع</h1>
        <p className="error-desc">
          عذراً، حدث خطأ أثناء معالجة طلبك.
          <br />
          لا تقلق، يمكنك المحاولة مرة أخرى.
        </p>

        {error.digest && (
          <div className="error-digest">
            <span>رقم الخطأ:</span>
            <code>{error.digest}</code>
          </div>
        )}

        <div className="error-actions">
          <button type="button" onClick={reset} className="error-btn-primary">
            <span aria-hidden="true">🔄</span>
            <span>المحاولة مرة أخرى</span>
          </button>

          <Link href="/" className="error-btn-secondary">
            <span aria-hidden="true">🏠</span>
            <span>العودة للرئيسية</span>
          </Link>
        </div>

        <div className="error-help">
          <p>إذا استمر الخطأ:</p>
          <ul>
            <li>تحقق من اتصالك بالإنترنت</li>
            <li>أعد تحميل الصفحة</li>
            <li>تواصل مع الدعم الفني</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
