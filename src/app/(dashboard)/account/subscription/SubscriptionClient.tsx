'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Plan {
  id: 'free' | 'pro' | 'family';
  name: string;
  tagline: string;
  price: number;
  period: string;
  highlight: boolean;
  features: { included: boolean; text: string }[];
  badge?: string;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'مجانية',
    tagline: 'للاستخدام الأساسي',
    price: 0,
    period: 'مجاناً',
    highlight: false,
    features: [
      { included: true, text: 'تصفّح الخدمات والأدلة' },
      { included: true, text: 'حجز المواعيد' },
      { included: true, text: 'البحث في الصيدليات والمستشفيات' },
      { included: true, text: 'استشارة عامة (5,000 د.ع/استشارة)' },
      { included: false, text: 'استشارات غير محدودة' },
      { included: false, text: 'طبيب العائلة المخصص' },
      { included: false, text: 'أولوية المواعيد' },
      { included: false, text: 'حسابات للعائلة' },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'الأكثر شعبية',
    price: 25000,
    period: 'شهرياً',
    highlight: true,
    badge: 'الأكثر اختياراً',
    features: [
      { included: true, text: 'كل ميزات الباقة المجانية' },
      { included: true, text: 'استشارات عامة غير محدودة' },
      { included: true, text: 'استشارة متخصصة (8 شهرياً)' },
      { included: true, text: 'أولوية في المواعيد' },
      { included: true, text: 'خصم 20% على التحاليل' },
      { included: true, text: 'دعم على مدار الساعة' },
      { included: false, text: 'طبيب العائلة المخصص' },
      { included: false, text: 'حسابات للعائلة (حتى 6 أفراد)' },
    ],
  },
  {
    id: 'family',
    name: 'العائلة الذهبية',
    tagline: 'الباقة الكاملة',
    price: 75000,
    period: 'شهرياً',
    highlight: false,
    badge: '⭐ مُميَّز',
    features: [
      { included: true, text: 'كل ميزات Pro' },
      { included: true, text: 'طبيب عائلة مخصص لك ولأهلك' },
      { included: true, text: 'حتى 6 أفراد من العائلة' },
      { included: true, text: 'استشارات بالفيديو غير محدودة' },
      { included: true, text: 'خصم 30% على كل الخدمات' },
      { included: true, text: 'فحوصات مجانية شهرية' },
      { included: true, text: 'سجل طبي عائلي شامل' },
      { included: true, text: 'مدير حساب شخصي' },
    ],
  },
];

const FAQ = [
  {
    q: 'هل يمكنني الإلغاء في أي وقت؟',
    a: 'نعم، يمكنك إلغاء اشتراكك في أي وقت من الإعدادات. ستستمر في الاستفادة من الميزات حتى نهاية الفترة المدفوعة.',
  },
  {
    q: 'هل يوجد فترة تجريبية مجانية؟',
    a: 'نعم! نقدم 7 أيام تجربة مجانية للباقات المدفوعة (Pro والعائلة) دون الحاجة لبطاقة دفع.',
  },
  {
    q: 'كيف يعمل طبيب العائلة المخصص؟',
    a: 'بعد الاشتراك، نعينك طبيباً مع خبرة في طب الأسرة. يتابع حالة كل فرد، يقدم استشارات فورية، ويرافق رحلتك الصحية.',
  },
  {
    q: 'ما الفرق بين الاستشارة العامة والمتخصصة؟',
    a: 'العامة: يرد عليك أول طبيب متاح. المتخصصة: تختار اختصاصاً محدداً (قلب، أعصاب، إلخ) ويرد عليك طبيب بهذا الاختصاص.',
  },
  {
    q: 'هل بياناتي آمنة؟',
    a: 'نعم، كل البيانات مُشفّرة ومحمية وفق أعلى معايير الأمان الطبي. لن نشاركها مع أي طرف ثالث.',
  },
];

export default function SubscriptionClient() {
  const [selectedPlan, setSelectedPlan] = useState<string>('free'); // المستخدم الحالي مجاني
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/account" className="scr-back-btn" aria-label="العودة">
            <span aria-hidden="true">→</span>
          </Link>
          <h1 className="scr-page-title">العضوية والاشتراكات</h1>
          <div className="scr-page-spacer" />
        </div>

        {/* Hero */}
        <div className="scr-info-banner" style={{ background: 'linear-gradient(135deg, #0E5C4D 0%, #073B30 100%)', color: 'var(--white)', borderColor: 'transparent', flexDirection: 'column', alignItems: 'flex-start', padding: 16 }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>💎</div>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>اختر الباقة المناسبة لك</div>
          <div style={{ fontSize: 11, opacity: 0.9 }}>
            ابدأ مجاناً · ترقَّ في أي وقت · ألغِ في أي وقت
          </div>
        </div>

        {/* Toggle شهري/سنوي */}
        <div className="scr-filter-tabs" style={{ marginTop: 12 }}>
          <button
            type="button"
            onClick={() => setBillingPeriod('monthly')}
            className={`scr-filter-tab ${billingPeriod === 'monthly' ? 'active' : ''}`}
          >
            شهري
          </button>
          <button
            type="button"
            onClick={() => setBillingPeriod('yearly')}
            className={`scr-filter-tab ${billingPeriod === 'yearly' ? 'active' : ''}`}
          >
            سنوي (وفّر 20%)
          </button>
        </div>

        {/* الباقات */}
        <div className="scr-section-head" style={{ marginTop: 16 }}>
          <div className="scr-section-title">الباقات المتاحة</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {PLANS.map((plan) => {
            const isCurrentPlan = selectedPlan === plan.id;
            const displayPrice = billingPeriod === 'yearly' && plan.price > 0
              ? Math.round(plan.price * 12 * 0.8)
              : plan.price;
            const displayPeriod = plan.price === 0
              ? 'مجاناً للأبد'
              : billingPeriod === 'yearly'
              ? 'سنوياً'
              : 'شهرياً';

            return (
              <div
                key={plan.id}
                className={`subscription-plan ${plan.highlight ? 'highlighted' : ''} ${isCurrentPlan ? 'current' : ''}`}
              >
                {plan.badge && (
                  <div className="subscription-badge">{plan.badge}</div>
                )}

                <div className="subscription-header">
                  <div>
                    <h3 className="subscription-name">{plan.name}</h3>
                    <p className="subscription-tagline">{plan.tagline}</p>
                  </div>
                  <div className="subscription-price-block">
                    {plan.price === 0 ? (
                      <div className="subscription-price-free">مجاناً</div>
                    ) : (
                      <>
                        <div className="subscription-price">
                          {displayPrice.toLocaleString('ar-IQ')}
                        </div>
                        <div className="subscription-currency">د.ع / {displayPeriod}</div>
                      </>
                    )}
                  </div>
                </div>

                <ul className="subscription-features">
                  {plan.features.map((f, i) => (
                    <li key={i} className={f.included ? 'included' : 'excluded'}>
                      <span aria-hidden="true">{f.included ? '✓' : '✕'}</span>
                      <span>{f.text}</span>
                    </li>
                  ))}
                </ul>

                {isCurrentPlan ? (
                  <button
                    type="button"
                    className="subscription-cta-current"
                    disabled
                  >
                    باقتك الحالية ✓
                  </button>
                ) : (
                  <a
                    href={`https://wa.me/9647700000000?text=${encodeURIComponent(`السلام عليكم، أرغب بالاشتراك في باقة "${plan.name}" بسعر ${plan.price.toLocaleString('ar-IQ')} د.ع ${plan.period}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`subscription-cta ${plan.highlight ? 'primary' : ''}`}
                    style={{ textDecoration: 'none', textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    {plan.price === 0 ? 'متاحة' : <><span>💬</span><span>تواصل عبر واتساب</span></>}
                  </a>
                )}
              </div>
            );
          })}
        </div>

        {/* مزايا إضافية */}
        <div className="scr-section-head" style={{ marginTop: 24 }}>
          <div className="scr-section-title">لماذا الاشتراك؟</div>
        </div>

        <div className="services-grid">
          <div className="service-card service-default">
            <div className="service-icon" aria-hidden="true">⚡</div>
            <div className="service-title">أولوية</div>
            <div className="service-desc">مواعيد أسرع</div>
          </div>
          <div className="service-card service-amber">
            <div className="service-icon" aria-hidden="true">💸</div>
            <div className="service-title">خصومات</div>
            <div className="service-desc">حتى 30%</div>
          </div>
          <div className="service-card service-default">
            <div className="service-icon" aria-hidden="true">⌬</div>
            <div className="service-title">طبيب مخصص</div>
            <div className="service-desc">رعاية شاملة</div>
          </div>
          <div className="service-card service-rose">
            <div className="service-icon" aria-hidden="true">📞</div>
            <div className="service-title">دعم 24/7</div>
            <div className="service-desc">استجابة فورية</div>
          </div>
        </div>

        {/* FAQ */}
        <div className="scr-section-head" style={{ marginTop: 32 }}>
          <div className="scr-section-title">أسئلة شائعة</div>
        </div>

        <div className="scr-list-stack">
          {FAQ.map((item, i) => (
            <details key={i} className="scr-faq-item">
              <summary className="scr-faq-question">
                <span>{item.q}</span>
                <span className="scr-faq-toggle" aria-hidden="true">+</span>
              </summary>
              <p className="scr-faq-answer">{item.a}</p>
            </details>
          ))}
        </div>

        {/* التواصل */}
        <div className="scr-info-banner" style={{ marginTop: 24 }}>
          <span aria-hidden="true">💬</span>
          <span>
            عندك سؤال؟{' '}
            <Link href="/account/help" className="auth-inline-link">
              تواصل مع الدعم
            </Link>
          </span>
        </div>

        <div style={{ height: 80 }} />
      </div>
    </main>
  );
}
