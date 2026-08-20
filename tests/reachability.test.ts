import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join, relative } from 'path';

/**
 * 🧭 حارس الوصول والاكتمال
 *
 * ثلاث فجواتٍ كشفها مسحٌ شاملٌ للمشروع، تشترك في صفةٍ واحدة: **الكود
 * سليم ويُصرَّف بنجاح، والميزة لا تصل المستخدم**. لا يكشف أيّاً منها
 * مترجمٌ ولا اختبار وحدة.
 *
 *   ١. **خمس صفحات إدارةٍ بلا رابط.** `/admin/nurses` و`/admin/physio`
 *      و`/admin/labs` و`/admin/cosmetic` و`/admin/locations` صفحاتٌ
 *      مبنيّة (٤٥–١٢٨ سطراً) تعمل، لكنّ القائمة الجانبية لا تذكرها —
 *      فالمشرف لا يبلغها إلّا بكتابة المسار يدوياً. القائمة كانت تغطّي
 *      أربعاً من تسع فئات مقدّمي خدمة.
 *
 *   ٢. **مجموعات مسارات بلا حدّ أخطاء.** `guest` و`(marketing)` بلا
 *      `error.tsx`، فأيّ خطأ عرضٍ فيها يصعد إلى الجذر ويبتلع التخطيط
 *      كلّه — والزائر الذي لم يسجّل بعد يرى صفحةً عارية بلا مخرج.
 *
 *   ٣. **قوالب الإشعارات.** `enqueueNotification` تفشل مُغلَقةً إن لم
 *      تجد القالب، وثلاثةٌ من المفاتيح الخمسة التي يطلبها الكود لم تكن
 *      معرَّفةً في أيّ ترحيل. أي أنّ إلغاء الطلب وقبول المختصّ ورفضه
 *      كانت ستفشل حتى على قاعدةٍ رُحِّلت ترحيلاً سليماً.
 */

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');
const read = (f: string) => readFileSync(f, 'utf8');

// ─────────────────────────────────────────────────────────────────
// ١. كل صفحة إدارةٍ عليا يشير إليها التنقّل
// ─────────────────────────────────────────────────────────────────
describe('وصول صفحات لوحة الإدارة', () => {
  it('لا صفحة إدارةٍ عليا خارج القائمة الجانبية', () => {
    const adminDir = join(SRC, 'app', 'admin');
    const pages = readdirSync(adminDir)
      .filter((e) => statSync(join(adminDir, e)).isDirectory())
      .filter((e) => !e.startsWith('_') && !e.startsWith('['))
      .filter((e) => existsSync(join(adminDir, e, 'page.tsx')));

    const sidebar = read(join(adminDir, '_components', 'AdminSidebar.tsx'));

    /** صفحاتٌ يُوصل إليها من صفحةٍ أخرى لا من القائمة — مع سبب كلٍّ منها */
    const LINKED_ELSEWHERE = new Map([
      ['users', 'حاوية فقط؛ `/admin/users/create` مذكورٌ في القائمة'],
      ['reports', 'صفحةٌ أمّ تعرض تقاريرها الفرعية'],
      ['settings', 'مذكورةٌ في القائمة، وفرعُها theme يُوصل منها'],
      ['specialists', 'مذكورةٌ في القائمة'],
      ['admins', 'مذكورةٌ في القائمة'],
      ['emergencies', 'مذكورةٌ في القائمة'],
      ['orders', 'مذكورةٌ في القائمة'],
      ['patients', 'مذكورةٌ في القائمة'],
    ]);

    const unreachable = pages.filter(
      (p) => !sidebar.includes(`/admin/${p}`) && !LINKED_ELSEWHERE.has(p),
    );

    expect(unreachable).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────
// ٢. كل مجموعة مسارات لها حدّ أخطاء
// ─────────────────────────────────────────────────────────────────
describe('حدود الأخطاء', () => {
  it('كل مجموعة مساراتٍ فيها صفحات لها error.tsx', () => {
    const appDir = join(SRC, 'app');

    const groups = readdirSync(appDir)
      .filter((e) => statSync(join(appDir, e)).isDirectory())
      .filter((e) => !['api', 'styles'].includes(e));

    const hasPage = (dir: string): boolean => {
      for (const e of readdirSync(dir)) {
        const full = join(dir, e);
        if (e === 'page.tsx') return true;
        if (statSync(full).isDirectory() && hasPage(full)) return true;
      }
      return false;
    };

    const missing = groups
      .filter((g) => hasPage(join(appDir, g)))
      .filter((g) => !existsSync(join(appDir, g, 'error.tsx')))
      .filter((g) => {
        // مجلّدٌ ذو صفحةٍ واحدة على الجذر يكفيه حدّ الجذر
        const own = join(appDir, g);
        return readdirSync(own).some((e) => statSync(join(own, e)).isDirectory());
      });

    expect(missing).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────
// ٣. كل مفتاح قالبٍ يطلبه الكود معرَّفٌ في ترحيل
// ─────────────────────────────────────────────────────────────────
describe('قوالب الإشعارات', () => {
  it('كل templateKey في الكود له تعريفٌ في ملفّات الترحيل', () => {
    const notifications = read(join(SRC, 'lib', 'notifications.ts'));
    const requested = [
      ...notifications.matchAll(/templateKey:\s*'([a-z_]+)'/g),
    ].map((m) => m[1]);

    expect(requested.length).toBeGreaterThan(0);

    const migrationsDir = join(ROOT, 'supabase', 'migrations');
    const sql = readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .map((f) => read(join(migrationsDir, f)))
      .join('\n');

    // مفاتيح مُدرَجة فعلاً في notification_templates
    const defined = new Set<string>();
    for (const block of sql.matchAll(
      /INSERT\s+INTO\s+public\.notification_templates[\s\S]*?;/gi,
    )) {
      for (const m of block[0].matchAll(/\(\s*'([a-z_]+)'\s*,/g)) defined.add(m[1]);
    }

    const missing = [...new Set(requested)].filter((k) => !defined.has(k)).sort();
    expect(missing).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────
// ٤. لا يُرسَل معامل استعلامٍ إلى صفحةٍ لا تقرؤه
// ─────────────────────────────────────────────────────────────────
/**
 * شريط البحث في لوحة التحكّم كان يوجّه إلى `/services?q=…` — و
 * `services/page.tsx` لا تستقبل `searchParams` إطلاقاً. فما يكتبه
 * المستخدم يُلقى في المهمَل ويصل خريطةً عامّة، بلا خطأ ولا رسالة.
 *
 * وصفحة البحث الحقيقية `/search` تقرأ `q` وتمرّره إلى `SearchClient`
 * (٢٦٥ سطراً من بحثٍ فعليّ) — ولم يكن يشير إليها رابطٌ واحد.
 *
 * العطل من صنفٍ لا يكشفه المترجم: المسار موجود، والتصريف ينجح، والوظيفة
 * تختفي في الطريق.
 */
describe('معاملات الاستعلام تصل صفحةً تقرؤها', () => {
  it('كل توجيهٍ داخليّ بمعامل استعلام يقصد صفحةً تستقبل searchParams', () => {
    const appDir = join(SRC, 'app');

    const tsx: string[] = [];
    (function walk(d: string) {
      for (const e of readdirSync(d)) {
        const full = join(d, e);
        if (statSync(full).isDirectory()) walk(full);
        else if (full.endsWith('.tsx')) tsx.push(full);
      }
    })(SRC);

    /** يحوّل مساراً إلى ملفّ الصفحة، مع تجاهل مجموعات المسارات */
    function pageFor(route: string): string | null {
      const parts = route.split('/').filter(Boolean);
      const groups = readdirSync(appDir).filter(
        (e) => e.startsWith('(') && statSync(join(appDir, e)).isDirectory(),
      );
      for (const prefix of ['', ...groups]) {
        const p = join(appDir, prefix, ...parts, 'page.tsx');
        if (existsSync(p)) return p;
      }
      return null;
    }

    /**
     * معاملاتٌ لا تَعِد المستخدم بشيء، فتجاهلُها ليس عطلاً.
     * `from` وسمُ مصدرٍ للتحليلات: `/consultations?from=share` تعرض
     * الاستشارات كلَّها سواءٌ قُرئ الوسم أم لا.
     */
    const MARKER_PARAMS = new Set(['from', 'utm_source', 'utm_medium', 'utm_campaign', 'ref']);

    /** التعليقات تذكر مساراتٍ لشرح ما كان — لا لتوجيه المستخدم */
    const stripComments = (src: string) =>
      src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

    const offenders: string[] = [];
    for (const file of tsx) {
      const src = stripComments(readFileSync(file, 'utf8'));
      for (const m of src.matchAll(/[`'"](\/[a-z0-9/_-]*)\?([a-zA-Z_]+)=/g)) {
        const [, route, param] = m;
        if (route.includes('[')) continue;
        if (MARKER_PARAMS.has(param)) continue;
        const target = pageFor(route);
        if (!target) continue; // مسارٌ ديناميّ أو خارجيّ — يغطّيه حارس الروابط
        // الصفحة تقرأ المعامل إمّا بخاصّية `searchParams` (مكوّن خادم)
        // أو بـ`useSearchParams` (مكوّن عميل)
        const targetSrc = readFileSync(target, 'utf8');
        if (!/searchParams|useSearchParams/.test(targetSrc)) {
          offenders.push(`${relative(process.cwd(), file)} → ${route}?${param}=`);
        }
      }
    }

    expect([...new Set(offenders)]).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────
// ٥. كل revalidatePath يقصد مساراً موجوداً
// ─────────────────────────────────────────────────────────────────
/**
 * `toggleWishlist` كان يستدعي `revalidatePath('/account/cosmetic-wishlist')`
 * ولا صفحة بهذا المسار. والاستدعاء لا يفشل — Next يتجاهل مساراً لا يعرفه
 * بصمت — لكنّ دلالته أنّ صفحةً كان يُفترض وجودها.
 *
 * وكان الأثر حقيقياً: المستخدم يضغط القلب فيُحفظ المنتج في
 * `cosmetic_wishlist`، ولا مكان في التطبيق كلّه يعرض ما حفظ. البيانات
 * تُجمع ولا تُعاد إليه.
 */
describe('مسارات إعادة التحقّق', () => {
  it('كل revalidatePath يقصد صفحةً موجودة', () => {
    const appDir = join(SRC, 'app');

    const files: string[] = [];
    (function walk(d: string) {
      for (const e of readdirSync(d)) {
        const full = join(d, e);
        if (statSync(full).isDirectory()) walk(full);
        else if (full.endsWith('.ts') || full.endsWith('.tsx')) files.push(full);
      }
    })(SRC);

    const groups = readdirSync(appDir).filter(
      (e) => e.startsWith('(') && statSync(join(appDir, e)).isDirectory(),
    );

    const offenders: string[] = [];
    for (const file of files) {
      for (const m of readFileSync(file, 'utf8').matchAll(
        /revalidatePath\(\s*['"`](\/[^'"`$]*)/g,
      )) {
        const route = m[1];
        if (route === '/' || route.includes('[')) continue;
        const parts = route.split('/').filter(Boolean);
        const found = ['', ...groups].some((p) =>
          existsSync(join(appDir, p, ...parts, 'page.tsx')),
        );
        if (!found) offenders.push(`${relative(process.cwd(), file)} → ${route}`);
      }
    }

    expect([...new Set(offenders)]).toEqual([]);
  });
});
