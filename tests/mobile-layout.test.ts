import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

/**
 * 🎯 حارس العرض على الهاتف
 *
 * ثلاثة أعطالٍ حقيقية كُشفت بقياس التطبيق على عرض ٣٦٠ و٣٩٠ بكسل، ولا
 * يكشف أيّاً منها المترجمُ ولا اختبارات المنطق — كلّها «تُصرَّف بنجاح
 * وتُعرض خطأً»:
 *
 *   ١. **عمود الإجراءات في لوحة الإدارة كان خارج الشاشة.** غلاف الجدول
 *      `overflow: 'hidden'` لا `auto`، والجدول يحتاج ٦١٣px والحاوية
 *      تعطيه ٣٥٨px — فالأعمدة الثلاثة الأخيرة (منها **إجراءات**) تقع في
 *      إحداثيات سالبة، مقصوصةً بلا وسيلة تمرير. المشرف على الهاتف لا
 *      يستطيع تعديل ولا توثيق ولا حذف أيّ صفّ.
 *
 *   ٢. **٢٩٢٣ سطر CSS ميّتة.** واحدٌ وعشرون مكوّناً يكتب تنسيقه داخل
 *      `<style jsx>`، وفي App Router لا تُحقن القواعد بلا سِجلّ: المحوّل
 *      يُضيف صنف النطاق إلى العناصر ثمّ لا يصل التنسيق الصفحة. النتيجة
 *      صفحاتٌ بأنماط المتصفّح الافتراضية — ومنها رحلة سحب الدم كاملة.
 *
 *   ٣. **التكبير كان مقفلاً** (`maximumScale: 1` + `userScalable: false`)
 *      — مخالفة WCAG 1.4.4 في تطبيقٍ طبّي يستعمله كبار السنّ.
 *
 * وحارسٌ رابع: فئة CSS مستعملة في JSX وغير معرَّفة في أيّ مكان تعني
 * عنصراً يُعرض بلا تنسيق. عولجت ٤٠٠+ منها؛ وهذا يمنع عودة الصنف.
 */

const SRC = join(process.cwd(), 'src');
const STYLE_FILES = [
  join(SRC, 'app', 'styles', 'app.css'),
  join(SRC, 'app', 'styles', 'admin.css'),
  join(SRC, 'app', 'styles', 'marketing.css'),
  join(SRC, 'app', 'styles', 'shared.css'),
  join(SRC, 'app', 'pwa.css'),
];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (full.endsWith('.tsx')) out.push(full);
  }
  return out;
}

const TSX = walk(SRC);
const read = (f: string) => readFileSync(f, 'utf8');

// ─────────────────────────────────────────────────────────────────
// ١. جداول الإدارة يجب أن تُمرَّر أفقياً لا أن تُقصّ
// ─────────────────────────────────────────────────────────────────
describe('جداول لوحة الإدارة', () => {
  it('لا يُغلَّف جدولٌ بحاويةٍ تقصّ الفائض أفقياً', () => {
    const offenders: string[] = [];

    for (const file of TSX) {
      const lines = read(file).split('\n');
      lines.forEach((line, i) => {
        if (!line.includes('<table')) return;
        // الغلاف المباشر خلال الأسطر الأربعة السابقة
        const before = lines.slice(Math.max(0, i - 4), i).join('\n');
        if (/overflow:\s*['"]hidden['"]/.test(before)) {
          offenders.push(`${relative(process.cwd(), file)}:${i + 1}`);
        }
      });
    }

    expect(offenders).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────
// ٢. سِجلّ styled-jsx موصولٌ في التخطيط الجذر
// ─────────────────────────────────────────────────────────────────
describe('حقن styled-jsx', () => {
  const layout = read(join(SRC, 'app', 'layout.tsx'));

  it('التخطيط الجذر يلفّ الشجرة بـStyledJsxRegistry', () => {
    expect(layout).toMatch(/<StyledJsxRegistry>/);
    expect(layout).toMatch(/<\/StyledJsxRegistry>/);
  });

  it('السِجلّ يحقن عبر useServerInsertedHTML', () => {
    const registry = read(
      join(SRC, 'components', 'providers', 'StyledJsxRegistry.tsx'),
    );
    expect(registry).toMatch(/useServerInsertedHTML/);
    expect(registry).toMatch(/createStyleRegistry/);
    expect(registry).toMatch(/StyleRegistry/);
  });

  it('كل مكوّنٍ يستعمل <style jsx> هو مكوّن عميل', () => {
    const notClient = TSX.filter((f) => {
      const src = read(f);
      return src.includes('<style jsx') && !src.startsWith("'use client'");
    }).map((f) => relative(process.cwd(), f));

    expect(notClient).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────
// ٣. التكبير غير مقفل
// ─────────────────────────────────────────────────────────────────
describe('إعدادات إطار العرض', () => {
  const layout = read(join(SRC, 'app', 'layout.tsx'));

  it('لا يمنع المستخدم من التقريب (WCAG 1.4.4)', () => {
    expect(layout).not.toMatch(/userScalable:\s*false/);
    expect(layout).not.toMatch(/maximumScale:\s*1\b/);
  });

  it('يحترم القصّة (notch) بـviewportFit', () => {
    expect(layout).toMatch(/viewportFit:\s*['"]cover['"]/);
  });
});

// ─────────────────────────────────────────────────────────────────
// ٤. لوحة الإدارة تعمل على الهاتف
// ─────────────────────────────────────────────────────────────────
describe('هيكل لوحة الإدارة', () => {
  const admin = read(join(SRC, 'app', 'styles', 'admin.css'));

  it('الشريط الجانبيّ يصير دُرجاً على الشاشات الضيّقة', () => {
    // كان `width: 260` ثابتاً في نمطٍ سطريّ داخل جذر flex، فيبقى للمحتوى
    // ٣٦px على عرض ٣٦٠ — عُشر الشاشة.
    // [^}] يحصر البحث داخل كتلة القاعدة نفسها — بدونه يلتقط
    // `position: fixed` من قاعدةٍ لاحقة (الطبقة أو الزرّ) فيمرّ زوراً
    expect(admin).toMatch(/\.admin-sidebar\s*\{[^}]*position:\s*fixed[^}]*\}/);
    expect(admin).toMatch(/@media \(max-width: 900px\)/);
    expect(admin).toMatch(/\.admin-sidebar\.open/);
    expect(admin).toMatch(/\.admin-menu-btn/);
  });

  it('خصائص تخطيط الشريط في CSS لا في نمطٍ سطريّ', () => {
    // النمط السطريّ يتغلّب على استعلامات الوسائط فيتعذّر تجاوزه
    const sidebar = read(join(SRC, 'app', 'admin', '_components', 'AdminSidebar.tsx'));
    expect(sidebar).not.toMatch(/width:\s*260/);
    expect(sidebar).not.toMatch(/position:\s*'sticky'/);
    expect(sidebar).toMatch(/className=\{`admin-sidebar/);
  });
});

// ─────────────────────────────────────────────────────────────────
// ٥. حقول الإدخال ١٦px على الهاتف — وإلّا قرّب iOS الصفحة تلقائياً
// ─────────────────────────────────────────────────────────────────
describe('حقول الإدخال على الهاتف', () => {
  it('قاعدة الـ16px موجودة في shared.css ولوحة الإدارة', () => {
    const shared = read(join(SRC, 'app', 'styles', 'shared.css'));
    const admin = read(join(SRC, 'app', 'styles', 'admin.css'));

    expect(shared).toMatch(/font-size:\s*16px/);
    // لوحة الإدارة تحتاج !important: أنماطها سطريّة في ١٩ ملفّاً
    expect(admin).toMatch(/\.admin-root[\s\S]*?font-size:\s*16px\s*!important/);
  });
});

// ─────────────────────────────────────────────────────────────────
// ٦. لا خطّ أصغر من ١١px
// ─────────────────────────────────────────────────────────────────
/**
 * قياسُ التطبيق على عرض ٣٩٠ أظهر ٣١ إعلاناً بين ٨px و٩px و٦٠ عند ١٠px —
 * أصغرها وسمُ العرض في لافتة الشاشة الرئيسية (٨px) وشارةُ القصّة (٧px).
 * وهذه منصّةٌ طبّية عربية يستعملها كبار السنّ: النصّ العربي المشكول عند
 * ٩px غير مقروء عملياً على شاشة الهاتف.
 *
 * ١١px حدٌّ أدنى لا هدفٌ — ليس تنسيقاً بل سقفَ ضررٍ لا يُتجاوز.
 */
describe('حدّ أدنى لحجم الخطّ', () => {
  const CSS = [...STYLE_FILES];

  it('لا إعلان font-size دون ١١px في ملفّات CSS', () => {
    const offenders: string[] = [];
    for (const f of CSS) {
      read(f).split('\n').forEach((line, i) => {
        for (const m of line.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)) {
          if (parseFloat(m[1]) < 11) offenders.push(`${relative(process.cwd(), f)}:${i + 1} → ${m[1]}px`);
        }
      });
    }
    expect(offenders).toEqual([]);
  });

  it('لا نمطٍ سطريّ بحجم خطٍّ دون ١١px في JSX', () => {
    const offenders: string[] = [];
    for (const file of TSX) {
      read(file).split('\n').forEach((line, i) => {
        const pats = [/fontSize:\s*(\d+(?:\.\d+)?)(?![\d.])/g, /fontSize:\s*'(\d+(?:\.\d+)?)px'/g,
          /font-size:\s*(\d+(?:\.\d+)?)px/g];
        for (const p of pats) {
          for (const m of line.matchAll(p)) {
            if (parseFloat(m[1]) < 11) offenders.push(`${relative(process.cwd(), file)}:${i + 1} → ${m[1]}`);
          }
        }
      });
    }
    expect(offenders).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────
// ٧. تباينٌ لا يُكسَر بقاعدةٍ أعلى تخصيصاً
// ─────────────────────────────────────────────────────────────────
/**
 * زرّ `.legal-link-btn` كان **غير مرئيّ**: خلفيتُه `--btn-primary-bg`
 * ونصُّه `--paper-3`، لكنّه يقع داخل `.legal-content` فتفوز عليه قاعدة
 * `.legal-content a { color: var(--emerald) }` — تخصيصها (0,1,1) أعلى من
 * (0,1,0) — فيصير لون النصّ لونَ الخلفية بالضبط: نسبة تباين ١٫٠٠.
 */
describe('تباين الأزرار داخل النصّ القانونيّ', () => {
  it('قاعدة .legal-content a لا تبتلع لون زرّ .legal-link-btn', () => {
    const css = read(join(SRC, 'app', 'styles', 'marketing.css'));
    expect(css).toMatch(/\.legal-content\s+a\.legal-link-btn\s*\{[^}]*color:/);
  });
});

// ─────────────────────────────────────────────────────────────────
// ٨. لا فئة CSS جديدة بلا تعريف
// ─────────────────────────────────────────────────────────────────
describe('تعريف فئات CSS', () => {
  /**
   * القائمة **فارغة**، وهذا هو المطلوب.
   *
   * كانت اثنتي عشرة فئة، وتبيّن عند مراجعتها واحدةً واحدة أنّها ثلاثة
   * أصناف لا صنفٌ واحد:
   *
   *   • تسعٌ ناقصةٌ فعلاً — عُرِّفت في `shared.css`. وأخطرها `.file-upload`:
   *     كان الإطار المتقطّع مكتوباً على `.file-upload-content` بينما
   *     الترميز يجعله غلافَ النصّ وحده، فالصندوق يحيط بالنصّ والأيقونة
   *     خارجه؛ و`.error`/`.has-file` بلا قاعدةٍ أصلاً فلا يبدو الحقل
   *     الخاطئ خاطئاً.
   *   • واحدةٌ (`push-prompt`) كانت **معرَّفة** ومُدرَجةً سهواً.
   *   • اثنتان (`wa-otp-card`, `consult-empty`) لم تعودا مستعملتين.
   *   • و`self-center` أداةُ Tailwind، محلّها قائمةُ الأدوات أدناه.
   *
   * إبقاؤها فارغةً يعني أنّ الحارس صار مطلقاً: أيّ فئةٍ بلا تعريف تُفشل
   * الاختبار. إن اضطُرّ أحدٌ لإضافة اسمٍ هنا فليكتب السبب.
   */
  const KNOWN_UNDEFINED = new Set<string>([]);

  // فئات Tailwind وما شابهها ليست من مسؤولية ملفّات CSS
  const UTILITY = new RegExp(
    '^(sm|md|lg|xl|2xl|hover|focus|active|group|dark|rtl|ltr):|' +
      '^(flex|grid|block|inline|hidden|absolute|relative|fixed|sticky|w|h|p|m|px|py|mx|my|mt|mb|ml|mr|pt|pb|pl|pr|' +
      'text|bg|border|rounded|shadow|gap|space|items|justify|font|leading|tracking|opacity|z|max|min|overflow|' +
      'transition|transform|scale|translate|cursor|select|object|top|bottom|left|right|inset|order|col|row|' +
      'animate|duration|ease|delay|ring|outline|divide|placeholder|from|via|to|backdrop|filter|blur|truncate|' +
      'aspect|container|sr|not|pointer|shrink|grow|basis|whitespace|break|self|place|list|fill|stroke)-|' +
      '^(flex|grid|hidden|block|truncate|container|sr-only|antialiased|shadow|transition|rounded|italic)$',
  );

  function definedClasses(): Set<string> {
    const set = new Set<string>();
    for (const f of STYLE_FILES) {
      for (const m of read(f).matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]+)/g)) set.add(m[1]);
    }
    return set;
  }

  /** فئات معرَّفة داخل الملفّ نفسه عبر <style jsx> أو <style> */
  function localClasses(src: string): Set<string> {
    const set = new Set<string>();
    for (const block of src.matchAll(/<style[^>]*>\{`([\s\S]*?)`\}<\/style>/g)) {
      for (const rule of block[1].matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]+)/g)) {
        set.add(rule[1]);
      }
    }
    return set;
  }

  it('لا فئة مستعملة في JSX بلا تعريف في أيّ ملفّ CSS', () => {
    const global = definedClasses();
    const offenders: string[] = [];

    for (const file of TSX) {
      const src = read(file);
      const known = localClasses(src);

      for (const m of src.matchAll(/className=\{?[`"]([^`"]*)[`"]/g)) {
        const cleaned = m[1].replace(/\$\{[^}]*\}/g, ' ');
        for (const cls of cleaned.split(/\s+/)) {
          if (!cls || cls.endsWith('-') || cls.includes('[') || cls.includes(':')) continue;
          if (UTILITY.test(cls)) continue;
          if (global.has(cls) || known.has(cls) || KNOWN_UNDEFINED.has(cls)) continue;
          offenders.push(`${relative(process.cwd(), file)} → .${cls}`);
        }
      }
    }

    expect([...new Set(offenders)]).toEqual([]);
  });
});
