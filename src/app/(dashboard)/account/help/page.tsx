import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight, Phone, Mail, MessageCircle, MapPin,
} from 'lucide-react';

export const metadata = {
  title: 'مساعدة والدعم · سباير ميديكال',
};

const FAQ_ITEMS = [
  { q: 'كيف أحجز موعداً؟', a: 'من الصفحة الرئيسية، اختر الخدمة المطلوبة (سحب دم، تحاليل، عيادات...) ثم املأ النموذج.' },
  { q: 'هل خدمات التطبيق مجانية؟', a: 'التصفح مجاني. بعض الخدمات (الحجوزات، الاستشارات) لها رسوم تظهر قبل التأكيد.' },
  { q: 'كيف ألغي حجزاً؟', a: 'من قسم "طلباتي"، افتح الحجز واضغط على "إلغاء". يمكن الإلغاء قبل ساعتين من الموعد.' },
  { q: 'هل تطلبون وصفة طبية؟', a: 'بعض الأدوية تتطلب وصفة. سنُعلمك أثناء الطلب.' },
  { q: 'ماذا أفعل في حالة طوارئ؟', a: 'اضغط فوراً على زر SOS في الصفحة الرئيسية أو اتصل بالإسعاف على 122.' },
];

interface ContactMethod {
  icon: LucideIcon;
  label: string;
  value: string;
  href: string | null;
}

const CONTACT_METHODS: ContactMethod[] = [
  { icon: Phone,         label: 'الاتصال الهاتفي',   value: '07803993585',         href: 'tel:+9647803993585' },
  { icon: Mail,          label: 'البريد الإلكتروني', value: 'support@spir-medical.com', href: 'mailto:support@spir-medical.com' },
  { icon: MessageCircle, label: 'واتساب',            value: '07803993585',         href: 'https://wa.me/9647803993585' },
  { icon: MapPin,        label: 'العنوان',           value: 'النجف · العراق',       href: null },
];

export default function HelpPage() {
  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/account" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} aria-hidden />
          </Link>
          <h1 className="scr-page-title">مساعدة والدعم</h1>
          <div className="scr-page-spacer" />
        </div>

        <p className="scr-page-subtitle">نحن هنا لمساعدتك</p>

        {/* طرق التواصل */}
        <div className="scr-section-head" style={{ marginTop: 8 }}>
          <div className="scr-section-title">تواصل معنا</div>
        </div>

        <div className="scr-list-stack">
          {CONTACT_METHODS.map((c) => {
            const Icon = c.icon;
            return c.href ? (
              <a key={c.label} href={c.href} className="scr-list-item scr-list-item-clickable">
                <div className="scr-list-item-icon" aria-hidden="true">
                  <Icon size={22} strokeWidth={2} />
                </div>
                <div className="scr-list-item-content">
                  <div className="scr-list-item-title">{c.label}</div>
                  <div className="scr-list-item-subtitle">{c.value}</div>
                </div>
                <div style={{ color: 'var(--ink-3)', fontSize: 18 }} aria-hidden="true">←</div>
              </a>
            ) : (
              <div key={c.label} className="scr-list-item">
                <div className="scr-list-item-icon" aria-hidden="true">
                  <Icon size={22} strokeWidth={2} />
                </div>
                <div className="scr-list-item-content">
                  <div className="scr-list-item-title">{c.label}</div>
                  <div className="scr-list-item-subtitle">{c.value}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* الأسئلة الشائعة */}
        <div className="scr-section-head" style={{ marginTop: 24 }}>
          <div className="scr-section-title">الأسئلة الشائعة</div>
        </div>

        <div className="scr-list-stack">
          {FAQ_ITEMS.map((item, i) => (
            <details key={i} className="scr-faq-item">
              <summary className="scr-faq-question">
                <span>{item.q}</span>
                <span className="scr-faq-toggle" aria-hidden="true">+</span>
              </summary>
              <p className="scr-faq-answer">{item.a}</p>
            </details>
          ))}
        </div>

        <div style={{ height: 80 }} />
      </div>
    </main>
  );
}
