import Link from 'next/link';

export default function SpecialistChatsPage() {
  return (
    <main className="app-screen">
      <div className="scr-content">

        <div className="scr-page-header">
          <Link href="/specialist" className="scr-back-btn" aria-label="العودة">
            <span aria-hidden="true">→</span>
          </Link>
          <h1 className="scr-page-title">المحادثات</h1>
          <div className="scr-page-spacer" />
        </div>

        <div className="scr-empty">
          <div className="scr-empty-icon" aria-hidden="true">✉</div>
          <h2 className="scr-empty-title">لا توجد محادثات</h2>
          <p className="scr-empty-desc">
            ستتمكّن من التواصل مع المرضى مباشرةً عبر هذه الواجهة قريباً.
            <br />
            هذه الميزة قيد التطوير.
          </p>
          <Link href="/specialist" className="scr-empty-link">العودة للرئيسية</Link>
        </div>

      </div>
    </main>
  );
}
