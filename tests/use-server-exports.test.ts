import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

/**
 * 🧱 حارس صادرات ملفّات `'use server'`
 *
 * ═══ الخلل الذي وُلد منه ═══
 *
 * ملفُّ `'use server'` لا يُصدّر إلّا دوالَّ غير متزامنة. وقد صدّرتُ منه
 * ثابتاً:
 *
 *     export const AUTO_REJECT_KEY = 'pending_auto_reject_hours';
 *
 * فانكسر `next build`:
 *
 *     x Only async functions are allowed to be exported in a "use server" file.
 *
 * و`tsc` مرّ، و`jest` مرّ بـ٥٧٣ اختباراً — كلاهما لا يعرف القاعدة. فتوقّف
 * النشرُ على Vercel من ذلك الالتزام حتى اكتُشف ببناءٍ يدويّ، وبقي كلُّ ما
 * دُفع بعده غيرَ منشور.
 *
 * ═══ ما يُسمح به ═══
 *
 *   export async function …          ← الإجراءُ نفسه
 *   export const x = async (…) => …  ← يقبله Next أيضاً
 *   export type / export interface   ← يُمحى عند الترجمة
 *
 * وما عدا ذلك يُنقل إلى وحدةٍ عاديّة (كما نُقل الثابتُ إلى
 * `src/lib/app-settings.ts`).
 */

const SRC = join(process.cwd(), 'src');

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

/** التوجيه يجب أن يكون أوّلَ عبارة — بعد التعليقات والفراغ وحدها */
function isUseServer(src: string): boolean {
  const head = src.replace(/^(\s*(\/\/[^\n]*|\/\*[\s\S]*?\*\/))*\s*/, '');
  return /^['"]use server['"]/.test(head);
}

const ALLOWED = [
  /^async\s+function\b/,
  /^(type|interface)\b/,
  /^(const|let|var)\s+\w+\s*(:[^=]+)?=\s*async\b/,
];

const files = walk(SRC)
  .map((p) => ({ p, src: readFileSync(p, 'utf8') }))
  .filter(({ src }) => isUseServer(src));

describe("ملفّاتُ 'use server' لا تُصدّر إلّا دوالَّ غير متزامنة", () => {
  it('يجد الملفّات فعلاً (حارسُ الحارس)', () => {
    // محلّلٌ لا يتعرّف التوجيه يجد صفراً فيمرّ الفحصُ التالي بلا معنى
    expect(files.length).toBeGreaterThan(50);
    expect(files.some(({ p }) => p.endsWith('auto-reject-actions.ts'))).toBe(true);
  });

  it("🚨 لا ثابتَ ولا دالّةً متزامنةً ولا صنفَ يُصدَّر من ملفّ 'use server'", () => {
    const offenders: string[] = [];
    for (const { p, src } of files) {
      for (const m of src.matchAll(/^export\s+(.*)$/gm)) {
        if (!ALLOWED.some((re) => re.test(m[1]))) {
          offenders.push(`${p.replace(SRC, 'src')}: export ${m[1].slice(0, 60)}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
