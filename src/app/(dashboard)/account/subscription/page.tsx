import Link from 'next/link';

export const metadata = {
  title: 'العضوية · سباير ميديكال',
};

export default function SubscriptionPage() {
  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/account" className="scr-back-btn" aria-label="العودة">
            <span aria-hidden="true">→</span>
          </Link>
          <h1 className="scr-page-title">العضوية</h1>
          <div className="scr-page-spacer" />
        </div>

        <div className="scr-empty">
          <div className="scr-empty-icon" aria-hidden="true">💎</div>
          <h2 className="scr-empty-title">باقات العضوية قريباً</h2>
          <p className="scr-empty-desc">
            ستحصل قريباً على ميزات حصرية:
            <br />
            • طبيب العائلة المخصص
            <br />
            • خصومات على الخدمات
            <br />
            • أولويّة في المواعيد
          </p>
          <Link href="/account" className="scr-empty-link">العودة لحسابي</Link>
        </div>
      </div>
    </main>
  );
}
