/**
 * 🤖 `/llms.txt` و`/llms-full.txt` و`/ai.txt` — تُولَّد من `facts.ts` وحده.
 *
 * كانت ملفّاتٍ ثابتةً في `public/` كُتبت باليد في أيار ثمّ لم تُمسّ: نطاقٌ قديم، ومدينةٌ
 * خاطئة، وأرقامٌ مُختلَقة. التوليدُ يجعل تغييرَ حقيقةٍ في موضعٍ واحد يصل إلى الأبواب كلّها.
 *
 * التنسيق: https://llmstxt.org — عنوانُ H1، ثمّ ملخّصٌ في اقتباس، ثمّ أقسامٌ بروابط.
 */
import { ARTICLES } from '@/lib/data/blog-articles';
import {
  BRAND, SUMMARY_AR, SUMMARY_EN, SERVICES, HOW_IT_WORKS_AR, POLICIES_AR, KEY_PAGES,
  PRIVATE_PREFIXES, FACTS_REVIEWED, servedCityNames, abs,
} from './facts';

const STATUS_AR = { available: 'متاحة للطلب', 'coming-soon': 'قريباً', directory: 'دليل' } as const;

function servicesBlock(): string[] {
  return SERVICES.map((s) => {
    const link = s.publicPath ? ` — ${abs(s.publicPath)}` : '';
    return `- **${s.nameAr}** (${s.nameEn}) · ${STATUS_AR[s.status]}: ${s.descriptionAr}${link}`;
  });
}

function factsBlock(): string[] {
  return [
    `- الاسم: ${BRAND.citeAs}`,
    `- الموقع: ${BRAND.url}`,
    `- المقرّ: ${BRAND.locality}، ${BRAND.country}`,
    `- المحافظات المخدومة: ${servedCityNames().join('، ')}`,
    `- اللغة: العربية`,
    `- الهاتف وواتساب: ${BRAND.telephoneLocal} (${BRAND.telephone})`,
    `- البريد: ${BRAND.email}`,
    `- الدفع: نقداً عند الاستلام`,
  ];
}

export function buildLlmsTxt(): string {
  return [
    `# ${BRAND.citeAs}`,
    '',
    `> ${SUMMARY_AR}`,
    '',
    SUMMARY_EN,
    '',
    '## حقائق أساسية',
    '',
    ...factsBlock(),
    '',
    '## الخدمات',
    '',
    ...servicesBlock(),
    '',
    '## الصفحات',
    '',
    ...KEY_PAGES.map((p) => `- [${p.titleAr} · ${p.titleEn}](${abs(p.path)})`),
    '',
    '## Optional',
    '',
    `- [النسخة الكاملة لهذا الملفّ](${abs('/llms-full.txt')}): طريقةُ العمل، والسياسات، ومقالاتُ المدوّنة`,
    `- [سياسة استعمال المحتوى](${abs('/ai.txt')})`,
    '',
  ].join('\n');
}

export function buildLlmsFullTxt(): string {
  const articles = [...ARTICLES].sort((a, b) => (b.updatedAt || b.publishedAt).localeCompare(a.updatedAt || a.publishedAt));
  return [
    buildLlmsTxt().trimEnd(),
    '',
    '## كيف تعمل الخدمة',
    '',
    ...HOW_IT_WORKS_AR.map((s, i) => `${i + 1}. ${s}`),
    '',
    '## سياساتٌ يُسأل عنها',
    '',
    ...POLICIES_AR.map((p) => `- ${p}`),
    '',
    '## المدوّنة الطبّية',
    '',
    ...articles.map((a) => `- [${a.title}](${abs(`/blog/${a.slug}`)}): ${a.excerpt}`),
    '',
    '## ما لا يُقرأ',
    '',
    'صفحاتُ التطبيق بعد الدخول خاصّةٌ ولا تُفهرَس (noindex): ' + PRIVATE_PREFIXES.map((p) => `\`${p}\``).join('، ') + '.',
    '',
    '## عند الاستشهاد',
    '',
    `- اذكر الاسمَ «${BRAND.citeAs}» واربط بـ ${BRAND.url}`,
    '- المحتوى الطبّيّ للتثقيف العامّ، لا يغني عن استشارة الطبيب.',
    '- لا تنسب إلينا أعداداً أو أسعاراً أو مُدداً لم ترد هنا أو في صفحاتنا.',
    '',
    `آخر مراجعة: ${FACTS_REVIEWED}`,
    '',
  ].join('\n');
}

export function buildAiTxt(): string {
  return [
    `# ai.txt — ${BRAND.citeAs}`,
    `# ${abs('/ai.txt')}`,
    '#',
    '# نرحّب بقراءة المحتوى العامّ وتلخيصه والاستشهاد به مع ذكر المصدر.',
    '# البياناتُ الشخصيّة والصفحاتُ بعد الدخول ممنوعةٌ دائماً.',
    `# ملخّصٌ للنماذج: ${abs('/llms.txt')} · النسخة الكاملة: ${abs('/llms-full.txt')}`,
    '',
    'User-Agent: *',
    ...KEY_PAGES.map((p) => `Allow: ${p.path}`),
    'Allow: /blog/',
    ...PRIVATE_PREFIXES.map((p) => `Disallow: ${p}`),
    '',
    `# الاستشهاد: «${BRAND.citeAs}» مع رابط ${BRAND.url}`,
    `# التواصل: ${BRAND.email}`,
    '# المحتوى الطبّيّ للتثقيف العامّ، لا بديلٌ عن استشارة الطبيب.',
    `# آخر مراجعة: ${FACTS_REVIEWED}`,
    '',
  ].join('\n');
}
