import Link from 'next/link';
import { Share2, Plus, MoreVertical, Download, ChevronRight } from 'lucide-react';

export const metadata = {
  title: 'كيف أُثبّت التطبيق · سباير ميديكال',
  description: 'دليل شامل لتثبيت تطبيق سباير ميديكال على هاتفك',
};

export default function InstallHelpPage() {
  return (
    <main style={{ padding: '20px 16px 60px', maxWidth: 600, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link
          href="/"
          style={{
            fontSize: 12,
            color: 'var(--ink-3)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            marginBottom: 12,
          }}
        >
          ← العودة للرئيسية
        </Link>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 900,
            margin: '0 0 8px',
            color: 'var(--ink)',
          }}
        >
          📱 كيف أُثبّت التطبيق؟
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-3)', margin: 0, lineHeight: 1.6 }}>
          ثبّت سباير ميديكال على هاتفك للحصول على تجربة أسرع وإشعارات فورية
        </p>
      </div>

      {/* Benefits cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 10,
          marginBottom: 28,
        }}
      >
        <Benefit icon="⚡" title="أسرع" desc="فتح فوري بضغطة" />
        <Benefit icon="🔔" title="إشعارات" desc="تذكيرات المواعيد" />
        <Benefit icon="📴" title="بدون نت" desc="يعمل offline" />
        <Benefit icon="🏠" title="على الشاشة" desc="مثل التطبيقات" />
      </div>

      {/* iOS Steps */}
      <section style={{ marginBottom: 32 }}>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 800,
            margin: '0 0 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 24 }}>🍎</span>
          <span>على iPhone (Safari)</span>
        </h2>

        <Step num={1}>
          افتح الموقع{' '}
          <code
            style={{
              background: 'var(--paper-3)',
              padding: '2px 8px',
              borderRadius: 6,
              fontSize: 12,
              direction: 'ltr',
              display: 'inline-block',
            }}
          >
            spir-medical.com
          </code>{' '}
          من Safari
        </Step>

        <Step num={2}>
          اضغط على زر المشاركة{' '}
          <Share2
            size={16}
            strokeWidth={2.2}
            style={{ verticalAlign: 'middle', color: '#007AFF' }}
          />{' '}
          في أسفل المتصفح
        </Step>

        <Step num={3}>
          من القائمة، اختر <strong>&quot;إضافة إلى الشاشة الرئيسية&quot;</strong>
        </Step>

        <Step num={4}>
          اضغط <strong>&quot;إضافة&quot;</strong> في الأعلى{' '}
          <Plus size={14} strokeWidth={2.4} style={{ verticalAlign: 'middle' }} />
        </Step>

        <div
          style={{
            padding: 14,
            background: 'var(--amber-soft)',
            border: '1px solid var(--amber)',
            borderRadius: 12,
            fontSize: 12,
            color: 'var(--amber)',
            fontWeight: 700,
            marginTop: 12,
          }}
        >
          💡 ملاحظة: استخدم Safari فقط — Chrome على iPhone لا يدعم التثبيت
        </div>
      </section>

      {/* Android Steps */}
      <section style={{ marginBottom: 32 }}>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 800,
            margin: '0 0 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 24 }}>🤖</span>
          <span>على Android (Chrome)</span>
        </h2>

        <Step num={1}>
          افتح الموقع من Chrome على هاتفك
        </Step>

        <Step num={2}>
          سيظهر banner تلقائياً في أسفل الشاشة — اضغط <strong>&quot;ثبّت&quot;</strong>
        </Step>

        <Step num={3}>
          إذا لم يظهر، اضغط القائمة{' '}
          <MoreVertical
            size={14}
            strokeWidth={2.4}
            style={{ verticalAlign: 'middle' }}
          />{' '}
          في أعلى Chrome
        </Step>

        <Step num={4}>
          اختر <strong>&quot;تثبيت التطبيق&quot;</strong> أو{' '}
          <strong>&quot;إضافة إلى الشاشة الرئيسية&quot;</strong>
        </Step>
      </section>

      {/* Desktop Steps */}
      <section style={{ marginBottom: 32 }}>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 800,
            margin: '0 0 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 24 }}>💻</span>
          <span>على الكمبيوتر (Chrome / Edge)</span>
        </h2>

        <Step num={1}>افتح الموقع من Chrome أو Edge</Step>

        <Step num={2}>
          ابحث عن أيقونة التثبيت{' '}
          <Download
            size={14}
            strokeWidth={2.4}
            style={{
              verticalAlign: 'middle',
              padding: 2,
              border: '1px solid var(--line)',
              borderRadius: 4,
            }}
          />{' '}
          في يسار شريط العنوان
        </Step>

        <Step num={3}>
          اضغط عليها واختر <strong>&quot;تثبيت&quot;</strong>
        </Step>
      </section>

      {/* FAQ */}
      <section
        style={{
          background: 'var(--paper-3)',
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px' }}>
          ❓ أسئلة شائعة
        </h2>

        <Faq q="هل التطبيق مجاني؟">
          نعم، تحميل التطبيق وتثبيته مجاني تماماً. الدفع فقط مقابل الخدمات الطبية التي تختارها.
        </Faq>

        <Faq q="هل سيأخذ مساحة كبيرة على هاتفي؟">
          لا — يأخذ أقل من 5 MB. أقل بكثير من التطبيقات العادية.
        </Faq>

        <Faq q="هل يحتاج إنترنت دائماً؟">
          لا — معظم الميزات تعمل بدون إنترنت بعد التثبيت. الإنترنت مطلوب فقط للحجز وإرسال الرسائل.
        </Faq>

        <Faq q="هل بياناتي آمنة؟">
          نعم — كل البيانات مشفّرة، ولا نشاركها مع أي طرف ثالث. خصوصيتك أولويتنا.
        </Faq>
      </section>

      {/* CTA */}
      <Link
        href="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: '14px 20px',
          background: 'var(--emerald)',
          color: 'var(--paper-3)',
          borderRadius: 14,
          fontSize: 14,
          fontWeight: 800,
          textDecoration: 'none',
        }}
      >
        <span>ابدأ الآن</span>
        <ChevronRight size={16} strokeWidth={2.4} style={{ transform: 'rotate(180deg)' }} />
      </Link>
    </main>
  );
}

function Benefit({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div
      style={{
        background: 'var(--white)',
        border: '1px solid var(--line)',
        borderRadius: 12,
        padding: 14,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 2 }}>
        {title}
      </div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{desc}</div>
    </div>
  );
}

function Step({
  num,
  children,
}: {
  num: number;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: 14,
        marginBottom: 10,
        background: 'var(--white)',
        border: '1px solid var(--line)',
        borderRadius: 12,
      }}
    >
      <span
        style={{
          flexShrink: 0,
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'var(--emerald)',
          color: 'var(--paper-3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 800,
        }}
      >
        {num}
      </span>
      <div
        style={{
          fontSize: 13,
          color: 'var(--ink-2)',
          lineHeight: 1.7,
          paddingTop: 2,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details
      style={{
        marginBottom: 8,
        padding: 12,
        background: 'var(--white)',
        borderRadius: 10,
        border: '1px solid var(--line)',
      }}
    >
      <summary
        style={{
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          color: 'var(--ink)',
        }}
      >
        {q}
      </summary>
      <p
        style={{
          fontSize: 12,
          color: 'var(--ink-3)',
          margin: '8px 0 0',
          lineHeight: 1.7,
        }}
      >
        {children}
      </p>
    </details>
  );
}
