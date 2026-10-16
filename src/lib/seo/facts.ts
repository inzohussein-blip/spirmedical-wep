/**
 * 📇 حقائقُ سباير ميديكال — المصدرُ الواحد لما يُقال عنّا للآلات
 *
 * محرّكاتُ البحث ونماذجُ الذكاء الاصطناعي تقرأ الموقعَ من أكثر من باب: البياناتُ المنظَّمة
 * (JSON-LD)، و`/llms.txt`، و`/ai.txt`، ووصفُ الصفحات. وكانت هذه الأبواب تتناقض
 * (16 تشرين الأول):
 *
 *   llms.txt ...... «بغداد»، و«40+ مستشفى»، و«AI-assisted»، و`spirmedical-wep.vercel.app`،
 *                   وهاتفٌ مُختلَق (07901234567)، وبريدٌ على نطاقٍ لا نملكه (spirmedical.iq)
 *   JSON-LD ....... «النجف»، و«15 خدمة · 18 محافظة · 24/7»
 *   coverage.ts ... ثماني محافظات
 *
 * والنموذجُ الذي يجد ادّعاءين متعارضين يختار أحدَهما — أو يخترع ثالثاً. فهذا الملفّ هو
 * المرجع: `llms.txt` و`llms-full.txt` و`ai.txt` تُولَّد منه، والبياناتُ المنظَّمة تقرؤه،
 * والحارسُ (`tests/seo-facts.test.ts`) يمنع عودةَ الادّعاءات القديمة.
 *
 * ⚠️ لا تكتب هنا عدداً أو وعداً لا يُحسب من مصدر: لا «+5000 مستخدم»، ولا «24/7»، ولا
 * مدّةَ وصولٍ مضمونة، ولا «بالذكاء الاصطناعي» — أدواتُ التطبيق قواعدُ ثابتة لا نماذج.
 */
import { SERVED_CITIES } from './coverage';
import { SITE_ORIGIN } from './origin';

export const BRAND = {
  name: 'Spir Medical',
  nameAr: 'سباير ميديكال',
  /** الصيغةُ التي نطلب أن يُستشهَد بها */
  citeAs: 'Spir Medical · سباير ميديكال',
  url: SITE_ORIGIN,
  country: 'العراق',
  /** المقرّ — ما تقوله صفحةُ التواصل والبياناتُ المنظَّمة */
  locality: 'النجف',
  telephone: '+9647803993585',
  telephoneLocal: '07803993585',
  whatsapp: '9647803993585',
  email: 'support@spir-medical.com',
  language: 'ar-IQ',
} as const;

/** وصفٌ واحد بجملتين — يصلح للبيانات المنظَّمة ولرأس llms.txt */
export const SUMMARY_AR =
  'سباير ميديكال تطبيقٌ عراقيّ للخدمات الطبّية المنزلية: تطلب سحبَ الدم والتحاليل المختبرية أو التمريضَ المنزليّ من هاتفك، ' +
  'فيصلك مختصٌّ معتمَد إلى منزلك، وتتابع الطلبَ ونتائجه في التطبيق. الدفعُ نقداً عند الاستلام.';

export const SUMMARY_EN =
  'Spir Medical is an Iraqi app for home medical services: patients request a home blood draw and lab tests, or home nursing, ' +
  'from their phone; a verified specialist comes to their home, and the order and results are tracked in the app. Payment is cash on delivery.';

export type ServiceStatus = 'available' | 'coming-soon' | 'directory';

export interface ServiceFact {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  status: ServiceStatus;
  /** صفحةٌ عامّة قابلةٌ للفهرسة تشرحها، إن وُجدت */
  publicPath?: string;
}

/**
 * ما يُطلَب فعلاً من التطبيق اليوم. يطابق `CORE_SERVICES` في `lib/services-v3.ts`:
 * العلاجُ الطبيعيّ `bookingSoon` هناك ← `coming-soon` هنا.
 */
export const SERVICES: readonly ServiceFact[] = [
  {
    id: 'blood-draw',
    nameAr: 'سحب الدم المنزلي والتحاليل المختبرية',
    nameEn: 'Home blood draw and lab tests',
    descriptionAr: 'يسحب مختصٌّ مدرَّب العيّنةَ في منزلك بأدواتٍ معقّمة للاستعمال مرّةً واحدة، وتصلك النتائج في التطبيق.',
    status: 'available',
    publicPath: '/home-blood-draw',
  },
  {
    id: 'home-nursing',
    nameAr: 'التمريض المنزلي',
    nameEn: 'Home nursing',
    descriptionAr: 'زرقُ الإبر، والعنايةُ بالجروح وتضميدها، وتركيبُ الكانيولا — في منزلك.',
    status: 'available',
  },
  {
    id: 'physio',
    nameAr: 'العلاج الطبيعي المنزلي',
    nameEn: 'Home physiotherapy',
    descriptionAr: 'جلساتٌ منزلية. صفحاتُه مفتوحةٌ للتصفّح، والحجزُ لم يُفتح بعد.',
    status: 'coming-soon',
  },
  {
    id: 'hospitals',
    nameAr: 'دليل المستشفيات',
    nameEn: 'Hospitals directory',
    descriptionAr: 'دليلٌ بالمستشفيات داخل التطبيق.',
    status: 'directory',
  },
  {
    id: 'pharmacies',
    nameAr: 'دليل الصيدليات',
    nameEn: 'Pharmacies directory',
    descriptionAr: 'دليلٌ إرشاديّ بالصيدليات — لا نبيع الأدوية.',
    status: 'directory',
  },
];

/** كيف تعمل الخدمة — بالترتيب، كما تصفه صفحةُ سحب الدم */
export const HOW_IT_WORKS_AR = [
  'سجّل برقم هاتفك العراقيّ واختر رمزَ دخولٍ من ستّة أرقام.',
  'اختر الخدمة، وحدّد موقعك والوقتَ المناسب.',
  'يستلم طلبَك مختصٌّ معتمَد، ويصلك إشعارٌ بذلك.',
  'يصلك المختصّ إلى المنزل، وتتابع الحالةَ والنتائج في التطبيق.',
] as const;

/** حقائقُ يسأل عنها الناسُ والنماذج — كلٌّ منها ممّا يقوله الموقع أو يفرضه الكود */
export const POLICIES_AR = [
  'الدفعُ نقداً عند الاستلام — لا بوّابةَ دفعٍ إلكترونيّ في التطبيق.',
  'لا يُقبَل طلبٌ لخدمةٍ ليس لها مختصٌّ معتمَد متاح؛ يُعرض بدلاً منه «أعلِمني حين تتوفّر».',
  'الطلبُ الذي لا يستلمه مختصٌّ خلال مدّةٍ تحدّدها الإدارة يُلغى، ويُخطَر المريضُ بذلك.',
  'المختصّون يُعتمَدون من الإدارة بعد مراجعة هويّتهم.',
  'الأسعارُ تُحدَّد حسب الخدمة والتحاليل المطلوبة، ولا تُنشر قائمةُ أسعارٍ ثابتة.',
  'التطبيقُ لا يشخّص ولا يصف علاجاً، ولا يغني عن الطبيب. في الطوارئ اتّصل بالإسعاف على 122.',
] as const;

/** الصفحاتُ العامّة التي نريد أن تُقرأ — كلُّها في sitemap.ts ومسموحةٌ في robots.ts */
export const KEY_PAGES = [
  { path: '/', titleAr: 'الرئيسية', titleEn: 'Home' },
  { path: '/home-blood-draw', titleAr: 'سحب الدم المنزلي', titleEn: 'Home blood draw' },
  { path: '/about', titleAr: 'عن التطبيق', titleEn: 'About the app' },
  { path: '/faq', titleAr: 'الأسئلة الشائعة', titleEn: 'FAQ' },
  { path: '/contact', titleAr: 'تواصل معنا', titleEn: 'Contact' },
  { path: '/blog', titleAr: 'المدوّنة الطبّية', titleEn: 'Medical blog' },
  { path: '/help/install', titleAr: 'تثبيت التطبيق', titleEn: 'Install the app' },
  { path: '/legal/terms', titleAr: 'الشروط', titleEn: 'Terms' },
  { path: '/legal/privacy', titleAr: 'الخصوصية', titleEn: 'Privacy' },
  { path: '/legal/disclaimer', titleAr: 'إخلاء المسؤولية الطبّية', titleEn: 'Medical disclaimer' },
  { path: '/legal/refund', titleAr: 'الاسترداد والإلغاء', titleEn: 'Refunds and cancellation' },
  { path: '/legal/cookies', titleAr: 'ملفّات الارتباط', titleEn: 'Cookies' },
] as const;

/** مساراتُ التطبيق التي لا تُقرأ — تطابق `privatePaths` في robots.ts (يحرسه الاختبار) */
export const PRIVATE_PREFIXES = [
  '/dashboard/', '/specialist/', '/admin/', '/appointments/', '/account/', '/services/',
  '/tools/', '/sos/', '/login', '/register', '/api/',
] as const;

export const servedCityNames = (): string[] => SERVED_CITIES.map((c) => c.name);

export const abs = (path: string): string => new URL(path, SITE_ORIGIN).toString();

/** تاريخُ آخر مراجعةٍ لهذه الحقائق — يُكتب في الملفّات المولَّدة. حدِّثه حين تُعدّلها. */
export const FACTS_REVIEWED = '2026-10-16';
