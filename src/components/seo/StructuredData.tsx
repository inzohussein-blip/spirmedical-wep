import { areaServedJsonLd } from '@/lib/seo/coverage';
import JsonLd from './JsonLd';
import { SITE_ORIGIN } from '@/lib/seo/origin';
import { BRAND, SERVICES, SUMMARY_AR } from '@/lib/seo/facts';

// ============================================================
// 🏷️ Structured Data (JSON-LD) - Schema.org
// ============================================================
// تساعد الـ AI bots ومحركات البحث في فهم المحتوى بشكل دقيق
// تطبق Schema.org/MedicalBusiness + Organization + WebSite
// ============================================================

const SITE_URL = SITE_ORIGIN;

// 1. Organization Schema — حقائقُه من src/lib/seo/facts.ts (المصدرُ نفسُه لـllms.txt)
// كان الوصف «15 خدمة · 18 محافظة · 24/7»، والتحاليل «أكثر من 200 نوع»، وتخصّصاتٌ تسعة
// بلا مصدر — تعارضُ coverage.ts (ثماني محافظات) وما يُطلب فعلاً من التطبيق.
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  '@id': `${SITE_URL}/#organization`,
  name: BRAND.name,
  alternateName: BRAND.nameAr,
  description: SUMMARY_AR,
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  image: `${SITE_URL}/api/og`,
  telephone: BRAND.telephone,
  email: BRAND.email,
  paymentAccepted: 'Cash',
  currenciesAccepted: 'IQD',
  address: {
    '@type': 'PostalAddress',
    addressLocality: BRAND.locality,
    addressRegion: BRAND.locality,
    addressCountry: 'IQ',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 32.0000,
    longitude: 44.3333,
  },
  // مُشتقّةٌ من المرجع الواحد (src/lib/seo/coverage.ts).
  areaServed: areaServedJsonLd(),
  availableService: SERVICES.filter((s) => s.status === 'available').map((s) => ({
    '@type': 'MedicalProcedure',
    name: s.nameAr,
    description: s.descriptionAr,
    ...(s.publicPath ? { url: `${SITE_URL}${s.publicPath}` } : {}),
  })),
};

// 2. WebSite Schema — بلا SearchAction: الرئيسية لا تقرأ `?q=`، فكان يَعِد Google ببحثٍ غير موجود.
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: BRAND.citeAs,
  url: SITE_URL,
  inLanguage: BRAND.language,
  publisher: { '@id': `${SITE_URL}/#organization` },
};

// 3. BreadcrumbList Schema

// 4. FAQ Schema (for AI featured snippets)

/**
 * ما يُحقن في **كلّ** صفحة: المؤسّسة والموقع وحدهما.
 *
 * كان هنا أيضاً `breadcrumbSchema` ثابتٌ («الرئيسية» وحدها) و`faqSchema` —
 * يُحقنان في كلّ صفحة، حتى صفحات الخصوصية والتطبيق المُسجَّل. وGoogle يشترط
 * أن تكون أسئلةُ FAQPage **مرئيّةً في الصفحة نفسها**، ومسارُ التنقّل أن
 * يصف موضعَ الصفحة فعلاً. بل إنّ الأسئلة الخمسة هنا لم تطابق حتى أسئلة
 * الرئيسية المرئيّة (ثمانية، مختلفة). فنُقلت FAQPage إلى الرئيسية مُشتقّةً
 * من `FAQ_ITEMS` المعروضة، وحُذف مسارُ التنقّل الثابت.
 */
export default function StructuredData() {
  return (
    <>
      <JsonLd id="ld-organization" data={organizationSchema} />
      <JsonLd id="ld-website" data={websiteSchema} />
    </>
  );
}
