// ═══════════════════════════════════════════════════════════════
// 🔗 Share Target (V25.15)
// ═══════════════════════════════════════════════════════════════
// عندما يُشارك المستخدم محتوى من تطبيق آخر مع Spir Medical
// (مثلاً: صورة فحص طبي من Camera أو ملف PDF)
// تُفتح هذه الصفحة وتسمح بإضافته للسجل الطبي
// ═══════════════════════════════════════════════════════════════

import Link from 'next/link';
import { ArrowRight, FileText, Image as ImageIcon, ExternalLink } from 'lucide-react';

export const metadata = {
  title: 'مشاركة محتوى · Spir Medical',
};

export default function ShareTargetPage({
  searchParams,
}: {
  searchParams: { title?: string; text?: string; url?: string };
}) {
  const hasContent = !!(searchParams.title || searchParams.text || searchParams.url);

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/dashboard" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} />
          </Link>
          <h1 className="scr-page-title">مشاركة محتوى</h1>
          <div className="scr-page-spacer" />
        </div>

        <p className="scr-page-subtitle">
          استقبلنا المحتوى - أين تريد حفظه؟
        </p>

        {!hasContent ? (
          <div className="scr-empty" style={{ marginTop: 32 }}>
            <div className="scr-empty-icon">
              <FileText size={42} strokeWidth={1.5} />
            </div>
            <h2 className="scr-empty-title">لا يوجد محتوى</h2>
            <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8 }}>
              لم نستلم أي محتوى للمشاركة
            </p>
            <Link
              href="/dashboard"
              style={{
                display: 'inline-block',
                marginTop: 16,
                padding: '10px 20px',
                background: 'var(--emerald)',
                color: 'var(--paper-3)',
                borderRadius: 100,
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              العودة للرئيسية
            </Link>
          </div>
        ) : (
          <>
            {/* Preview المحتوى المُستلَم */}
            <div
              style={{
                background: 'var(--paper-3)',
                border: '1px solid var(--line)',
                borderRadius: 14,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <h3 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 8px' }}>
                المحتوى المُستلَم:
              </h3>
              {searchParams.title && (
                <div style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 2 }}>
                    العنوان
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{searchParams.title}</div>
                </div>
              )}
              {searchParams.text && (
                <div style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 2 }}>
                    النص
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.6 }}>
                    {searchParams.text}
                  </div>
                </div>
              )}
              {searchParams.url && (
                <div>
                  <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 2 }}>
                    الرابط
                  </div>
                  <a
                    href={searchParams.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 12,
                      color: 'var(--emerald)',
                      fontWeight: 700,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {searchParams.url}
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>

            {/* خيارات الحفظ */}
            <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 10px' }}>
              احفظ في:
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <SaveOption
                icon="📋"
                title="السجل الطبي"
                description="احفظ كملف في سجلك الطبي"
                href="/account/records?from=share"
              />
              <SaveOption
                icon="💬"
                title="استشارة جديدة"
                description="ابدأ استشارة مع طبيب وأرفق المحتوى"
                href="/services/consultations?from=share"
              />
              <SaveOption
                icon="📅"
                title="حجز جديد"
                description="استخدمه كمرجع لحجز موعد"
                href="/services?from=share"
              />
            </div>
          </>
        )}

        <div style={{ height: 60 }} />
      </div>
    </main>
  );
}

function SaveOption({
  icon, title, description, href,
}: {
  icon: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        background: 'var(--white)',
        border: '1px solid var(--line)',
        borderRadius: 12,
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          background: 'var(--emerald-soft)',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800 }}>{title}</div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{description}</div>
      </div>
      <span aria-hidden="true" style={{ color: 'var(--ink-3)' }}>←</span>
    </Link>
  );
}
