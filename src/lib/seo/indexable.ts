/**
 * 🔎 ما يُفهرَس وما لا يُفهرَس — قرارٌ واحد يقرؤه `proxy.ts` (ترويسةُ X-Robots-Tag).
 *
 * كان robots.txt يحجب صفحاتِ التطبيق (`/login`، `/register`، `/appointments/`، `/services/`…)،
 * والصفحاتُ العامّة تربط بها (أزرارُ «ادخل التطبيق» و«اطلب سحب دم»). فيكتشفها Google بالروابط
 * ولا يستطيع زحفها، فتمتلئ Search Console بـ«تمّ الحظر باستخدام robots.txt» — بل «مُفهرَسة رغم
 * الحظر» لأنّ الحظرَ يمنعه من رؤية أيّ noindex. وكانت كلُّ صفحةٍ — حتى `/login` — تُرسل
 * `X-Robots-Tag: index, follow` من vercel.json.
 *
 * إرشادُ Google: robots.txt لإدارة الزحف لا لإخفاء الصفحات. الإخفاءُ بـ`noindex` على صفحةٍ يُسمح
 * بزحفها. فهنا قائمةُ سماحٍ صريحة: ما لم يرد فيها يُرسَل بـ`noindex`.
 * الحارس: tests/robots-indexing.test.ts.
 */
import { KEY_PAGES } from './facts';

/** بادئاتٌ كلُّ ما تحتها عامّ (المقالات، التصنيفات، الصفحات القانونية، المساعدة) */
const INDEXABLE_PREFIXES = ['/blog/', '/legal/', '/help/'] as const;

const INDEXABLE_EXACT = new Set<string>([...KEY_PAGES.map((p) => p.path), '/blog']);

export function isIndexablePath(pathname: string): boolean {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return INDEXABLE_EXACT.has(p) || INDEXABLE_PREFIXES.some((pre) => p.startsWith(pre));
}

/** ما يُحجَب زحفُه فعلاً: نقاطُ API (عدا صورة المعاينة) ولوحةُ الإدارة. لا شيءَ تربط به الصفحاتُ العامّة. */
export const CRAWL_BLOCKED = ['/api/', '/admin'] as const;

export const NOINDEX_HEADER = 'noindex, nofollow';
