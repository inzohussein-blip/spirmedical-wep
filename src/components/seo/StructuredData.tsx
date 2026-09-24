import { areaServedJsonLd } from '@/lib/seo/coverage';
import JsonLd from './JsonLd';

// ============================================================
// 🏷️ Structured Data (JSON-LD) - Schema.org
// ============================================================
// تساعد الـ AI bots ومحركات البحث في فهم المحتوى بشكل دقيق
// تطبق Schema.org/MedicalBusiness + Organization + WebSite
// ============================================================

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://spir-medical.com';

// 1. Organization Schema
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  name: 'Spir Medical',
  alternateName: 'سباير ميديكال',
  description:
    'منصة طبية رقمية متكاملة في العراق · 15 خدمة طبية · 18 محافظة · 24/7 · سحب دم منزلي · تحاليل · استشارات · صناعة عراقية',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  image: `${SITE_URL}/api/og`,
  telephone: '+9647803993585',
  email: 'support@spir-medical.com',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'النجف',
    addressRegion: 'النجف',
    addressCountry: 'IQ',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 32.0000,
    longitude: 44.3333,
  },
  // مُشتقّةٌ من المرجع الواحد. كانت هنا ١٧ مُدخلاً مكتوبةً باليد: «بابل»
  // مكرّرة، و«الديوانية» و«القادسية» وهما المحافظةُ نفسها باسمين —
  // وتعارضُ بقيّةَ ادّعاءات الموقع عن التغطية (src/lib/seo/coverage.ts).
  areaServed: areaServedJsonLd(),
  medicalSpecialty: [
    'GeneralPractice',
    'Pediatric',
    'Cardiovascular',
    'Dermatologic',
    'Nutritionist',
    'Dentistry',
    'Ophthalmologic',
    'Psychiatric',
    'Physiotherapy',
  ],
  availableService: [
    {
      '@type': 'MedicalProcedure',
      name: 'سحب دم منزلي',
      description: 'خدمة سحب الدم في منزل المريض',
    },
    {
      '@type': 'MedicalTest',
      name: 'تحاليل مختبرية',
      description: 'أكثر من 200 نوع فحص مختبري',
    },
    {
      '@type': 'MedicalProcedure',
      name: 'تمريض منزلي',
      description: 'زرق إبر، عناية بالجروح، خدمات صحية سريعة',
    },
    {
      '@type': 'MedicalTherapy',
      name: 'استشارة طبية',
      description: 'استشارات طبية فورية مع أطباء متخصصين',
    },
  ],
  sameAs: [
    // 'https://www.facebook.com/spirmedical',
    // 'https://twitter.com/spirmedical',
    // 'https://www.instagram.com/spirmedical',
  ],
};

// 2. WebSite Schema (for SearchAction)
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Spir Medical · سباير ميديكال',
  url: SITE_URL,
  inLanguage: ['ar', 'en', 'ku'],
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
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
