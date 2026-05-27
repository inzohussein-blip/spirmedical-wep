// ⚡ V27 Performance: ISR caching (86400s)
export const revalidate = 86400;

// ═══════════════════════════════════════════════════════════════
// 📞 اتصل بنا (V25.12)
// ═══════════════════════════════════════════════════════════════

import Link from 'next/link';
import {
  ArrowRight, Phone, Mail, MessageCircle, MapPin, Clock,
  Send, Headphones, AlertTriangle,
} from 'lucide-react';

export const metadata = {
  title: 'اتصل بنا · سباير ميديكال',
  description: 'تواصل مع فريق سباير ميديكال - دعم فني، استفسارات، شكاوى',
};

export default function ContactPage() {
  return (
    <main className="mkt-screen">
      <div className="mkt-content">
        <div className="mkt-page-header">
          <Link href="/" className="mkt-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} />
          </Link>
          <h1 className="mkt-page-title">اتصل بنا</h1>
          <div className="mkt-page-spacer" />
        </div>

        <p className="mkt-page-subtitle">
          نحن هنا لمساعدتك. اختر الطريقة الأنسب
        </p>

        {/* Emergency banner */}
        <div
          style={{
            background: 'var(--rose-soft)',
            border: '1px solid var(--rose)',
            borderRadius: 12,
            padding: 14,
            marginBottom: 16,
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
          }}
        >
          <AlertTriangle size={18} color="var(--rose)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--rose)', marginBottom: 2 }}>
              للحالات الطارئة فقط
            </div>
            <p style={{ fontSize: 12, color: 'var(--ink-2)', margin: 0, lineHeight: 1.6 }}>
              اتصل بـ <a href="tel:122" style={{ fontWeight: 900, color: 'var(--rose)' }}>122</a> للإسعاف الحكومي،
              أو اضغط <Link href="/dashboard" style={{ color: 'var(--rose)', fontWeight: 800 }}>زر الطوارئ</Link> داخل التطبيق
            </p>
          </div>
        </div>

        {/* Contact methods */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          <ContactCard
            icon={<Phone size={20} />}
            color="var(--emerald)"
            title="اتصال هاتفي"
            subtitle="دعم سريع للحالات العاجلة"
            value="07700000000"
            href="tel:07700000000"
            hours="٩ ص - ٩ م"
          />

          <ContactCard
            icon={<MessageCircle size={20} />}
            color="#25D366"
            title="WhatsApp"
            subtitle="الأسرع للردود - اكتب لنا"
            value="9647700000000"
            href="https://wa.me/9647700000000"
            hours="٩ ص - ١٢ م"
          />

          <ContactCard
            icon={<Mail size={20} />}
            color="var(--amber)"
            title="البريد الإلكتروني"
            subtitle="للاستفسارات الرسمية"
            value="support@spirmedical.iq"
            href="mailto:support@spirmedical.iq"
            hours="رد خلال ٢٤ ساعة"
          />

          <ContactCard
            icon={<Headphones size={20} />}
            color="var(--ink-2)"
            title="مركز المساعدة"
            subtitle="إجابات لأسئلتك الشائعة"
            value="انتقل إلى صفحة الأسئلة"
            href="/faq"
            isLink
          />
        </div>

        {/* Office info */}
        <div
          style={{
            background: 'var(--white)',
            border: '1px solid var(--line)',
            borderRadius: 14,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <h3 style={{
            fontSize: 14,
            fontWeight: 800,
            margin: '0 0 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <MapPin size={16} color="var(--emerald)" />
            مقرّ الشركة
          </h3>

          <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.8 }}>
            <strong>سباير ميديكال</strong>
            <br />
            بغداد، العراق
            <br />
            <span style={{ color: 'var(--ink-3)' }}>(العنوان التفصيلي يُرسل عند الطلب)</span>
          </div>

          <div
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: '1px solid var(--line)',
              fontSize: 11,
              color: 'var(--ink-3)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Clock size={12} />
            <span>أوقات الدوام: الأحد - الخميس | ٩ ص - ٦ م</span>
          </div>
        </div>

        {/* Departments */}
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 10px' }}>
            للتواصل مع قسم معيّن:
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            <DeptCard emoji="💼" label="المبيعات" email="sales@spirmedical.com" />
            <DeptCard emoji="🤝" label="الشراكات" email="partnerships@spirmedical.com" />
            <DeptCard emoji="⚖️" label="قانوني" email="legal@spirmedical.com" />
            <DeptCard emoji="📰" label="صحافة" email="press@spirmedical.com" />
          </div>
        </div>

        {/* Quick links */}
        <div
          style={{
            background: 'var(--paper-3)',
            borderRadius: 10,
            padding: 14,
            fontSize: 12,
            lineHeight: 1.8,
            color: 'var(--ink-2)',
          }}
        >
          <strong>روابط مفيدة:</strong>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
            <Link href="/about" style={linkStyle}>عن سباير</Link>
            <Link href="/faq" style={linkStyle}>الأسئلة الشائعة</Link>
            <Link href="/legal/privacy" style={linkStyle}>الخصوصية</Link>
            <Link href="/legal/terms" style={linkStyle}>الشروط</Link>
            <Link href="/legal/refund" style={linkStyle}>سياسة الاسترداد</Link>
          </div>
        </div>

        <div style={{ height: 60 }} />
      </div>
    </main>
  );
}

function ContactCard({
  icon, color, title, subtitle, value, href, hours, isLink,
}: {
  icon: React.ReactNode;
  color: string;
  title: string;
  subtitle: string;
  value: string;
  href: string;
  hours?: string;
  isLink?: boolean;
}) {
  const Component = isLink ? Link : 'a';
  return (
    <Component
      href={href}
      target={!isLink && href.startsWith('http') ? '_blank' : undefined}
      rel={!isLink && href.startsWith('http') ? 'noopener noreferrer' : undefined}
      style={{
        textDecoration: 'none',
        color: 'inherit',
        background: 'var(--white)',
        border: '1px solid var(--line)',
        borderRadius: 14,
        padding: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        borderInlineStartWidth: 4,
        borderInlineStartStyle: 'solid',
        borderInlineStartColor: color,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: `${color}15`,
          color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800 }}>{title}</div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>{subtitle}</div>
        <div
          style={{
            fontSize: 12,
            color,
            fontWeight: 700,
            marginTop: 4,
            direction: 'ltr',
            textAlign: 'start',
          }}
        >
          {value}
        </div>
        {hours && (
          <div
            style={{
              fontSize: 10,
              color: 'var(--ink-3)',
              marginTop: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <Clock size={9} />
            {hours}
          </div>
        )}
      </div>
      <Send size={14} color={color} />
    </Component>
  );
}

function DeptCard({ emoji, label, email }: { emoji: string; label: string; email: string }) {
  return (
    <a
      href={`mailto:${email}`}
      style={{
        background: 'var(--white)',
        border: '1px solid var(--line)',
        borderRadius: 10,
        padding: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div style={{ fontSize: 20 }}>{emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 800 }}>{label}</div>
        <div
          style={{
            fontSize: 9,
            color: 'var(--ink-3)',
            direction: 'ltr',
            textAlign: 'start',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {email}
        </div>
      </div>
    </a>
  );
}

const linkStyle: React.CSSProperties = {
  padding: '4px 10px',
  background: 'var(--white)',
  borderRadius: 100,
  textDecoration: 'none',
  color: 'var(--ink-2)',
  fontSize: 11,
  fontWeight: 700,
  border: '1px solid var(--line)',
};
