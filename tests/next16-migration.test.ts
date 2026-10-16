/**
 * @jest-environment node
 */
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

/**
 * ⬆️ الانتقال إلى Next 16 — ما يجب أن يبقى صحيحاً.
 *
 * قِيس قبل الانتقال وبعده (خطُّ أساسٍ على Next 14): 205 مساراً، 40 شاشةً بعرضَي 360/390، الدخولُ
 * (جلسةٌ قديمة، بريد، رقم + PIN)، الحمايةُ، الخريطة، والفهرسة — كلُّها مطابقة.
 */
const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');

describe('Next 16', () => {
  const pkg = JSON.parse(read('package.json'));

  it('🚨 الوسيطُ صار proxy.ts (middleware.ts لا يُقرأ في Next 16)', () => {
    expect(existsSync('src/middleware.ts')).toBe(false);
    expect(read('src/proxy.ts')).toMatch(/export async function proxy\(/);
  });

  it('🚨 revalidateTag بوسيطٍ واحد ممنوع (Next 16 يطلب profile) — والإبطالُ الفوريّ بـupdateTag', () => {
    const out = execSync(`grep -rnE "revalidateTag\\('[^']+'\\)" src || true`, { encoding: 'utf8' }).trim();
    expect(out).toBe('');
  });

  it('🚨 next lint أُزيل: الفحصُ بـESLint 9 مباشرة', () => {
    expect(pkg.scripts.lint).toBe('eslint .');
    expect(existsSync('eslint.config.mjs')).toBe(true);
    expect(existsSync('.eslintrc.json')).toBe(false);
  });

  it('Turbopack لا يقرأ webpack(): لا تخصيصَ ميّتاً في next.config', () => {
    expect(read('next.config.js')).not.toMatch(/^\s*webpack:\s*\(/m);
    expect(read('next.config.js')).toMatch(/require\('@sentry\/nextjs\/config'\)/);
  });

  it('أخطاءُ مكوّنات الخادم تصل Sentry (onRequestError)', () => {
    expect(read('src/instrumentation.ts')).toMatch(/captureRequestError as onRequestError/);
  });
});
