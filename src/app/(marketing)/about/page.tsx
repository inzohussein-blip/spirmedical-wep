// ⚡ ISR: نصٌّ ثابت يُبنى من lib/seo/facts.ts
export const revalidate = 86400;

import Link from 'next/link';
import AboutApp from '@/components/landing/AboutApp';
import JsonLd from '@/components/seo/JsonLd';
import { BRAND, SUMMARY_AR } from '@/lib/seo/facts';
import { absoluteUrl } from '@/lib/seo/coverage';

/**
 * ℹ️ عن التطبيق — صفحةٌ تسويقيّة قابلةٌ للفهرسة.
 *
 * كانت شاشةً من التطبيق: زرُّ رجوعٍ إلى `/account` (يطلب الدخولَ من الزائر)، و«الإصدار 1.0.0»،
 * و«+200 نوع فحص» و«استجابة فورية» بلا مصدر، وبلا وصفٍ في metadata. الآن جسمُها `AboutApp`
 * نفسُه الذي في الرئيسية، ومادّتُه من `lib/seo/facts.ts`.
 */
const PATH = '/about';

export const metadata = {
  alternates: { canonical: '/about' },
  title: 'عن التطبيق — سحب دم وخدمات طبية منزلية',
  description: SUMMARY_AR,
  openGraph: {
    title: 'عن تطبيق سباير ميديكال',
    description: SUMMARY_AR,
    url: PATH,
    type: 'website',
  },
};

const LEGAL = [
  { href: '/legal/terms', label: 'الشروط والأحكام' },
  { href: '/legal/privacy', label: 'سياسة الخصوصية' },
  { href: '/legal/disclaimer', label: 'إخلاء المسؤولية الطبية' },
  { href: '/legal/refund', label: 'الإلغاء والاسترداد' },
  { href: '/legal/cookies', label: 'سياسة الكوكيز' },
];

export default function AboutPage() {
  return (
    <main className="mkt-screen">
      <div className="mkt-content ab-page-content">
        <div className="mkt-page-header">
          <Link href="/" className="mkt-back-btn" aria-label="الرئيسية"><span aria-hidden="true">→</span></Link>
          <div className="mkt-page-title" aria-hidden="true">عن التطبيق</div>
          <div className="mkt-page-spacer" />
        </div>

        <AboutApp variant="page" />

        <section className="ab-wrap ab-contact" aria-labelledby="ab-contact">
          <h2 id="ab-contact" className="ab-h3">تواصل معنا</h2>
          <div className="ab-contact-row">
            <a href={`tel:${BRAND.telephone}`} className="ab-btn ab-btn-ghost" dir="ltr">{BRAND.telephoneLocal}</a>
            <a href={`https://wa.me/${BRAND.whatsapp}`} className="ab-btn ab-btn-ghost" target="_blank" rel="noopener noreferrer">واتساب</a>
            <a href={`mailto:${BRAND.email}`} className="ab-btn ab-btn-ghost">{BRAND.email}</a>
          </div>
          <nav aria-label="معلومات قانونية" className="ab-legal">
            {LEGAL.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
          </nav>
          <p className="ab-foot">{BRAND.citeAs} · صُنع في {BRAND.locality}، {BRAND.country}</p>
        </section>
      </div>

      <JsonLd
        id="ld-about"
        data={{
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: 'عن تطبيق سباير ميديكال',
          description: SUMMARY_AR,
          url: absoluteUrl(PATH),
          inLanguage: BRAND.language,
          about: { '@id': `${BRAND.url}/#organization` },
          isPartOf: { '@id': `${BRAND.url}/#website` },
        }}
      />
      <JsonLd
        id="ld-breadcrumb"
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: absoluteUrl('/') },
            { '@type': 'ListItem', position: 2, name: 'عن التطبيق', item: absoluteUrl(PATH) },
          ],
        }}
      />
    </main>
  );
}
