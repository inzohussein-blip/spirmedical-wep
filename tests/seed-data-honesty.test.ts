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

  it('🚨 لا رقمَ كاملاً في البذور: المُختلَقُ مُقنَّعٌ «0771 xxx xxxx»', () => {
    // كان هذا الاختبار يُثبت وجود التسلسل كي لا يصير التحذير احتياطياً.
    // قُنّعت الأرقام (قرار المالك)، فالحارسُ الآن ألّا يعود رقمٌ كامل.
    expect(phones()).toEqual([]);
    const masked = readdirSync(SEED_DIR)
      .filter((x) => x.endsWith('.ts'))
      .flatMap((f) => [...read(join(SEED_DIR, f)).matchAll(/phone: '0\d{3} xxx xxxx'/g)]);
    expect(masked.length).toBeGreaterThan(10);
  });

  it('رقمُ الطوارئ في البذور هو 122 لا رقماً مُختلَقاً', () => {
    const emergency = readdirSync(SEED_DIR)
      .filter((x) => x.endsWith('.ts'))
      .flatMap((f) => [...read(join(SEED_DIR, f)).matchAll(/^\s+phone_emergency: '([^']*)'/gm)].map((m) => m[1]));
    expect(emergency.length).toBeGreaterThan(0);
    expect(emergency.filter((e) => e !== '122')).toEqual([]);
  });
});
