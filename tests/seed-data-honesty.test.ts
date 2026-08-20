import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * 🌱 حارس صدق بيانات البذر
 *
 * `src/lib/seed/` يحمل ١٢٣ عنصراً بأسماءٍ ومواقعَ **حقيقية** — «مستشفى
 * الصدر التعليمي» في النجف بإحداثياته الصحيحة — و**هواتفَ مُختلَقة**:
 *
 *     07712340001 · 07712340002 · 07712340003 · 07712340004 …
 *     خمسة مستشفياتٍ بـ phone_emergency: '912' نفسه
 *
 * وكانت ترويسة `hospitals.ts` تصفها بأنّها «بيانات حقيقية»، ولا تحذير في
 * أيّ موضع — لا في الوحدة ولا في صفحة الإدارة التي فيها زرّ الإدراج.
 *
 * والخطر ليس في البيانات بل في اقترانها: اسمٌ حقيقيّ مع رقمٍ خاطئ في
 * تطبيقٍ فيه شاشة طوارئ (`/guest/sos`) أسوأ من دليلٍ فارغ — المريض يثق
 * بالاسم فيطلب الرقم.
 *
 * هذا الحارس يمنع أمرين: أن تعود التسمية المضلِّلة، وأن يُشحن الملفّ بلا
 * تحذيرٍ عند موضع القرار.
 */

const SEED_DIR = join(process.cwd(), 'src', 'lib', 'seed');
const read = (f: string) => readFileSync(f, 'utf8');

describe('صدق وصف بيانات البذر', () => {
  it('وحدة البذر تحذّر صراحةً من الإدراج في الإنتاج', () => {
    const index = read(join(SEED_DIR, 'index.ts'));
    expect(index).toMatch(/بيانات تطوير/);
    expect(index).toMatch(/مُختلَقة|مختلقة/);
  });

  it('صفحة الإدارة تحمل التحذير عند موضع الزرّ', () => {
    const page = read(
      join(process.cwd(), 'src', 'app', 'admin', 'seed-data', 'SeedManagerClient.tsx'),
    );
    expect(page).toMatch(/بيانات تطوير/);
    expect(page).toMatch(/role="alert"/);
  });

  it('لا ملفّ بذرٍ يصف نفسه بأنّ بياناته حقيقية دون تقييد', () => {
    const offenders: string[] = [];
    for (const f of readdirSync(SEED_DIR).filter((x) => x.endsWith('.ts'))) {
      const src = read(join(SEED_DIR, f));
      const header = src.slice(0, src.indexOf('*/') + 2);
      // «حقيقية» وحدها مضلِّلة؛ مقبولةٌ إن قُيّدت بذكر ما ليس حقيقياً
      if (/بيانات حقيقية/.test(header) && !/مُختلَقة|مختلقة|تطوير/.test(header)) {
        offenders.push(f);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('كشف الهواتف النائبة', () => {
  /**
   * الكشف بنيويّ لا اعتباطيّ: أرقامٌ متتاليةٌ عددياً (فرقُ ١) دليلُ
   * توليدٍ لا دليلُ واقع. ثلاثةٌ متتالية تكفي.
   */
  function phones(): string[] {
    const out: string[] = [];
    for (const f of readdirSync(SEED_DIR).filter((x) => x.endsWith('.ts'))) {
      for (const m of read(join(SEED_DIR, f)).matchAll(/phone: '(0\d{10})'/g)) {
        out.push(m[1]);
      }
    }
    return out;
  }

  it('الأرقام المتسلسلة موجودة فعلاً — فالتحذير ليس احتياطياً', () => {
    const nums = phones().map(Number).sort((a, b) => a - b);
    let run = 1;
    let longest = 1;
    for (let i = 1; i < nums.length; i++) {
      run = nums[i] - nums[i - 1] === 1 ? run + 1 : 1;
      longest = Math.max(longest, run);
    }
    // لو نُظّفت البيانات يوماً واختفى التسلسل، فليُراجَع التحذير وهذا الاختبار
    expect(longest).toBeGreaterThanOrEqual(3);
  });
});
