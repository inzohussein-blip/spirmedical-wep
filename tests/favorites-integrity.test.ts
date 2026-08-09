import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * ⭐ سلامة المفضّلة — من الزرّ إلى القيد إلى العرض
 *
 * ثلاثة أخطاء متمايزة اجتمعت على هذه الميزة، وكلّها **صامتة**:
 *
 *   ١. مفردةٌ مزدوجة: التطبيق يُرسل `mental_health`/`nutritionist`
 *      وقيدُ CHECK في القاعدة يحمل `mental`/`nutrition` ⇒ الإدراج يُرفض
 *      بـ23514، فالضغط على القلب لا يفعل شيئاً أبداً.
 *   ٢. أنواعٌ بلا عرض: `physio` كان يُحفظ فعلاً، لكن صفحة المفضّلة لا
 *      تعرف له `SERVICE_META` ولا مصدرَ تفاصيل ⇒ الصفّ في القاعدة
 *      والمفضَّل لا يظهر في القائمة.
 *   ٣. فشلٌ مبتلَع: الزرّ كان `if (result.ok)` بلا فرعٍ آخر ⇒ لا رسالة
 *      تكشف (١) ولا (٢).
 *
 * الجامع بينها أنّ كلّ طرفٍ كان صحيحاً بمفرده. لذا يفحص هذا الحارس
 * **التطابق** بين الأطراف الأربعة: الاتحاد `ServiceType`، وقيد القاعدة،
 * وخريطة العرض، ومصادر التفاصيل — ثمّ يتأكّد أنّ الفشل لم يعد صامتاً.
 */

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

const ACTIONS = read('src/components/services/favorites-actions.ts');
const BUTTON = read('src/components/services/ServiceFavoriteButton.tsx');
const PAGE = read('src/app/(dashboard)/account/favorites/page.tsx');

/** الاتحاد المصدر: `export type ServiceType = 'a' | 'b' | …` */
function serviceTypes(): string[] {
  const decl = /export type ServiceType\s*=\s*([^;]+);/.exec(ACTIONS)?.[1] ?? '';
  return [...decl.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
}

/** القيم التي يقبلها آخرُ قيدٍ مُعرَّف على `service_favorites.service_type` */
function checkConstraintValues(): string[] {
  const dir = join(ROOT, 'supabase/migrations');
  const sql = readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => readFileSync(join(dir, f), 'utf8'))
    .join('\n');

  // آخر تعريفٍ يفوز — الترحيلات تُطبَّق بالترتيب
  const blocks = [
    ...sql.matchAll(/service_type\s+TEXT\s+NOT NULL\s+CHECK\s*\(\s*service_type IN \(([\s\S]*?)\)\s*\)/gi),
    ...sql.matchAll(/ADD CONSTRAINT service_favorites_service_type_check[\s\S]*?CHECK\s*\(\s*service_type IN \(([\s\S]*?)\)\s*\)/gi),
  ];
  const last = blocks.map((m) => ({ at: m.index ?? 0, body: m[1] })).sort((a, b) => a.at - b.at).pop();
  return [...(last?.body ?? '').matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
}

/** مفاتيح `SERVICE_META` في صفحة العرض */
function metaKeys(): string[] {
  const body = /const SERVICE_META: Record<ServiceType,[\s\S]*?\n\}> = \{([\s\S]*?)\n\};/.exec(PAGE)?.[1] ?? '';
  return [...body.matchAll(/^\s{2}([a-z_]+):\s*\{/gm)].map((m) => m[1]);
}

/** الأنواع التي لها مصدرُ تفاصيل في `SOURCES` */
function sourceTypes(): string[] {
  const body = /const SOURCES: Array<\{[\s\S]*?\n  \}> = \[([\s\S]*?)\n  \];/.exec(PAGE)?.[1] ?? '';
  return [...body.matchAll(/type:\s*'([a-z_]+)'/g)].map((m) => m[1]);
}

const sorted = (a: string[]) => [...a].sort();

describe('⭐ الحارس نفسه يقرأ فعلاً', () => {
  it('كل قائمة غير فارغة (لا نجاح بالفراغ)', () => {
    expect(serviceTypes().length).toBe(8);
    expect(checkConstraintValues().length).toBeGreaterThan(0);
    expect(metaKeys().length).toBeGreaterThan(0);
    expect(sourceTypes().length).toBeGreaterThan(0);
  });
});

describe('⭐ مفردةٌ واحدة من الزرّ إلى القيد', () => {
  it('🚨 قيد القاعدة يطابق `ServiceType` تماماً', () => {
    // لا زيادة ولا نقصان: قيمةٌ زائدة في القيد تعني نوعاً ميّتاً،
    // وقيمةٌ ناقصة تعني قلباً لا يعمل.
    expect(sorted(checkConstraintValues())).toEqual(sorted(serviceTypes()));
  });

  it('🚨 المفردة القديمة لم تعد مقبولة', () => {
    const values = checkConstraintValues();
    expect(values).not.toContain('mental');
    expect(values).not.toContain('nutrition');
  });

  it('كل نوعٍ يُرسله زرٌّ فعليّ موجودٌ في الاتحاد', () => {
    const dir = join(ROOT, 'src/app/(dashboard)/services');
    const sent = new Set<string>();
    const walk = (d: string) => {
      for (const e of readdirSync(d, { withFileTypes: true })) {
        const p = join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.tsx$/.test(e.name)) {
          const code = readFileSync(p, 'utf8');
          for (const m of code.matchAll(/serviceType=["']([a-z_]+)["']/g)) sent.add(m[1]);
          for (const m of code.matchAll(/checkIsFavorite\(\s*'([a-z_]+)'/g)) sent.add(m[1]);
        }
      }
    };
    if (existsSync(dir)) walk(dir);

    expect(sent.size).toBeGreaterThan(0);
    for (const t of sent) expect(serviceTypes()).toContain(t);
  });
});

describe('⭐ كل نوعٍ محفوظ قابلٌ للعرض', () => {
  it('🚨 `SERVICE_META` تغطّي كل نوع', () => {
    expect(sorted(metaKeys())).toEqual(sorted(serviceTypes()));
  });

  it('🚨 لكل نوعٍ مصدرُ تفاصيل في `SOURCES`', () => {
    // بلا مصدرٍ لا يُجلب `name`، ويُسقِط `.filter((f) => f.name)` الصفَّ
    // بصمت — يُحفظ المفضَّل ولا يظهر أبداً.
    expect(sorted(sourceTypes())).toEqual(sorted(serviceTypes()));
  });

  it('الخريطة مقيّدة بالنوع كي يصير الإغفال خطأ بناء', () => {
    expect(PAGE).toContain('Record<ServiceType,');
    expect(PAGE).toContain("type: ServiceType;");
  });
});

describe('⭐ الفشل لم يعد صامتاً', () => {
  it('🚨 الزرّ يُبلّغ عند رفض الحفظ', () => {
    expect(BUTTON).toContain('toast.error');
    // فرعٌ صريح للفشل — لا `if (ok)` وحده
    expect(/if \(result\.ok\)[\s\S]{0,120}return;/.test(BUTTON)).toBe(true);
  });

  it('انقطاع الشبكة ملتقَط (إجراء الخادم يرمي ولا يُرجع ok:false)', () => {
    expect(/try \{[\s\S]*?\} catch \{[\s\S]{0,160}toast\.error/.test(BUTTON)).toBe(true);
  });
});

describe('⭐ الفرع اليتيم أُزيل ولم يُترك مسارٌ مكسور', () => {
  it('🚨 صفحة `/favorites` وإجراءاتها لم تعد موجودة', () => {
    expect(existsSync(join(ROOT, 'src/app/(dashboard)/favorites'))).toBe(false);
  });

  it('🚨 لا كود يقرأ أو يكتب `user_favorites`', () => {
    const hits: string[] = [];
    const walk = (d: string) => {
      for (const e of readdirSync(d, { withFileTypes: true })) {
        const p = join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.(ts|tsx)$/.test(e.name) && /database(\.generated)?\.ts$/.test(e.name) === false) {
          if (/from\(['"]user_favorites['"]\)/.test(readFileSync(p, 'utf8'))) hits.push(p);
        }
      }
    };
    walk(join(ROOT, 'src'));
    expect(hits).toEqual([]);
  });

  it('الرابط القديم يُحوَّل بدل أن يسقط 404', () => {
    const config = read('next.config.js');
    expect(config).toMatch(/source:\s*'\/favorites'[\s\S]{0,120}destination:\s*'\/account\/favorites'/);
  });
});
