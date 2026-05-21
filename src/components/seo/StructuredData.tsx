import Script from 'next/script';

// ============================================================
// 🏷️ Structured Data (JSON-LD) - Schema.org
// ============================================================
// تساعد الـ AI bots ومحركات البحث في فهم المحتوى بشكل دقيق
// تطبق Schema.org/MedicalBusiness + Organization + WebSite
// ============================================================

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://spirmedical-wep.vercel.app';

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
  telephone: '+9647901234567',
  email: 'support@spirmedical.iq',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'بغداد',
    addressRegion: 'بغداد',
    addressCountry: 'IQ',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 33.3152,
    longitude: 44.3661,
  },
  areaServed: [
    { '@type': 'Country', name: 'العراق' },
    { '@type': 'AdministrativeArea', name: 'بغداد' },
    { '@type': 'AdministrativeArea', name: 'البصرة' },
    { '@type': 'AdministrativeArea', name: 'الموصل' },
    { '@type': 'AdministrativeArea', name: 'النجف' },
    { '@type': 'AdministrativeArea', name: 'كربلاء' },
    { '@type': 'AdministrativeArea', name: 'أربيل' },
    { '@type': 'AdministrativeArea', name: 'السليمانية' },
    { '@type': 'AdministrativeArea', name: 'كركوك' },
    { '@type': 'AdministrativeArea', name: 'دهوك' },
    { '@type': 'AdministrativeArea', name: 'بابل' },
    { '@type': 'AdministrativeArea', name: 'الأنبار' },
    { '@type': 'AdministrativeArea', name: 'ديالى' },
    { '@type': 'AdministrativeArea', name: 'صلاح الدين' },
    { '@type': 'AdministrativeArea', name: 'القادسية' },
    { '@type': 'AdministrativeArea', name: 'ميسان' },
    { '@type': 'AdministrativeArea', name: 'المثنى' },
    { '@type': 'AdministrativeArea', name: 'ذي قار' },
    { '@type': 'AdministrativeArea', name: 'واسط' },
  ],
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
const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'الرئيسية',
      item: SITE_URL,
    },
  ],
};

// 4. FAQ Schema (for AI featured snippets)
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'ما هو تطبيق سباير ميديكال؟',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'سباير ميديكال هي منصة طبية رقمية عراقية تقدم خدمات صحية شاملة: سحب دم منزلي، تحاليل، استشارات طبية، طبيب عائلة، وإدارة سجل طبي.',
      },
    },
    {
      '@type': 'Question',
      name: 'هل التطبيق مجاني؟',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'تصفّح التطبيق وحجز الخدمات مجاني. الخدمات الفعلية (التحاليل، الاستشارات) لها رسوم تظهر قبل التأكيد.',
      },
    },
    {
      '@type': 'Question',
      name: 'هل بياناتي الطبية آمنة؟',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'نعم، كل البيانات الطبية مُشفّرة بأعلى معايير الأمان (AES-256). لن نشاركها مع أي طرف ثالث.',
      },
    },
    {
      '@type': 'Question',
      name: 'في أي مدن يعمل سباير ميديكال؟',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'نعمل في كل المحافظات العراقية: بغداد، البصرة، أربيل، الموصل، النجف، كربلاء، السليمانية، وغيرها.',
      },
    },
    {
      '@type': 'Question',
      name: 'كيف أحجز موعداً؟',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'سجّل في التطبيق برقم هاتفك العراقي، اختر الخدمة المطلوبة، حدد الموقع والوقت، وستصلك رسالة تأكيد.',
      },
    },
  ],
};

export default function StructuredData() {
  return (
    <>
      <Script
        id="ld-organization"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <Script
        id="ld-website"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <Script
        id="ld-breadcrumb"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <Script
        id="ld-faq"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
