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
// ٤. حقول الإدخال ١٦px على الهاتف — وإلّا قرّب iOS الصفحة تلقائياً
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
// ٥. لا فئة CSS جديدة بلا تعريف
// ─────────────────────────────────────────────────────────────────
describe('تعريف فئات CSS', () => {
  /**
   * الفئات المتبقّية المعروفة: أغلفةٌ تحمل تخطيطها في نمطٍ سطريّ، أو
   * فئاتٌ لا تحتاج قواعد (`deletion-form` مثلاً — فُحصت الصفحة وتُعرض
   * منسَّقةً بالكامل، والعناصر الداخلية تحمل فئاتها المعرَّفة).
   *
   * الغرض من القائمة منع **الجديد**، لا تثبيت القديم. عند تعريف أيٍّ
   * منها احذفها من هنا.
   */
  const KNOWN_UNDEFINED = new Set([
    'spir-map-view', 'spir-map-empty', 'mh-wrap', 'deletion-form',
    'legal-updated', 'file-upload', 'scr-form-card', 'service-emerald',
    'self-center', 'push-prompt', 'wa-otp-card', 'consult-empty',
  ]);

  // فئات Tailwind وما شابهها ليست من مسؤولية ملفّات CSS
  const UTILITY = new RegExp(
    '^(sm|md|lg|xl|2xl|hover|focus|active|group|dark|rtl|ltr):|' +
      '^(flex|grid|block|inline|hidden|absolute|relative|fixed|sticky|w|h|p|m|px|py|mx|my|mt|mb|ml|mr|pt|pb|pl|pr|' +
      'text|bg|border|rounded|shadow|gap|space|items|justify|font|leading|tracking|opacity|z|max|min|overflow|' +
      'transition|transform|scale|translate|cursor|select|object|top|bottom|left|right|inset|order|col|row|' +
      'animate|duration|ease|delay|ring|outline|divide|placeholder|from|via|to|backdrop|filter|blur|truncate|' +
      'aspect|container|sr|not|pointer)[-$]|' +
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
      // وحدة features/ غير مستورَدة من أيّ صفحة (كود ميّت)
      if (file.includes(`${'src'}/features/`)) continue;

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
