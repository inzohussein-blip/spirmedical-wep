import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, basename } from 'path';

/**
 * 🗺️ الخريطةُ لا تكذب.
 *
 * README.md وقسمُ «خريطة سريعة» في CLAUDE.md يدلّان على ملفّاتٍ بأسمائها. خريطةٌ
 * تشير إلى ملفٍّ نُقل أو حُذف أسوأ من لا خريطة: تُضيّع الوقتَ الذي وُجدت لتوفيره.
 * (كان README القديم يذكر `sentry.client.config.ts` و`ALL_MIGRATIONS_COMBINED.sql`
 * ولا وجود لهما.)
 *
 * كلُّ مسارٍ بين علامتي ` يبدأ ببادئةٍ معروفة يجب أن يوجد. `app/` و`components/`
 * و`lib/` و`types/` نسبيّةٌ إلى `src/`. و`*` يطابق أيَّ اسمٍ في المجلّد.
 */

const ROOT = process.cwd();
const SRC_RELATIVE = ['app/', 'components/', 'lib/', 'types/'];
const ROOT_RELATIVE = ['src/', 'supabase/', 'tests/', 'public/', 'docs/'];
const ROOT_FILES = ['middleware.ts', 'vercel.json', 'README.md', 'CLAUDE.md'];

function resolve(token: string): string | null {
  if (token.includes('…') || token.includes(' ')) return null; // عناصرُ نائبة ووصف
  if (ROOT_FILES.includes(token)) return token === 'middleware.ts' ? 'src/middleware.ts' : token;
  if (ROOT_RELATIVE.some((p) => token.startsWith(p))) return token;
  if (SRC_RELATIVE.some((p) => token.startsWith(p))) return 'src/' + token;
  return null;
}

function exists(rel: string): boolean {
  const clean = rel.replace(/\/$/, '');
  if (!clean.includes('*')) return existsSync(join(ROOT, clean));
  // «dir/*» أو «dir/Name*.tsx»: المجلّد موجود وفيه ما يطابق
  const dir = clean.endsWith('/*') ? clean.slice(0, -2) : dirname(clean);
  if (!existsSync(join(ROOT, dir)) || !statSync(join(ROOT, dir)).isDirectory()) return false;
  if (clean.endsWith('/*')) return true;
  const re = new RegExp('^' + basename(clean).replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
  return readdirSync(join(ROOT, dir)).some((f) => re.test(f));
}

function brokenPaths(file: string, text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/`([^`\n]+)`/g)) {
    const rel = resolve(m[1].trim());
    if (rel && !exists(rel)) out.push(`${file}: \`${m[1]}\``);
  }
  return out;
}

describe('🗺️ خريطة المشروع', () => {
  it('🚨 كلُّ مسارٍ في README.md موجود', () => {
    expect(brokenPaths('README.md', readFileSync(join(ROOT, 'README.md'), 'utf8'))).toEqual([]);
  });

  it('🚨 كلُّ مسارٍ في «خريطة سريعة» بـ CLAUDE.md موجود', () => {
    const claude = readFileSync(join(ROOT, 'CLAUDE.md'), 'utf8');
    const start = claude.indexOf('## 🗺️ خريطة سريعة');
    expect(start).toBeGreaterThanOrEqual(0);
    const section = claude.slice(start, claude.indexOf('\n## ', start + 5));
    expect(brokenPaths('CLAUDE.md', section)).toEqual([]);
  });

  it('الخريطةُ تغطّي كلَّ مجموعة مسارات في app/', () => {
    const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
    const groups = readdirSync(join(ROOT, 'src/app')).filter(
      (d) => statSync(join(ROOT, 'src/app', d)).isDirectory() && d !== 'styles',
    );
    const missing = groups.filter((g) => !readme.includes(g));
    expect(missing).toEqual([]);
  });
});
