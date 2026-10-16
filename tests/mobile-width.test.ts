import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * 📱 لا عرضَ زائد على الهاتف (شكوى المالك، 16 تشرين الأول: «جهة اليسار بها زيادة في الحجم»)
 *
 * ما يتجاوز عرضَ الشاشة في صفحةٍ RTL يمتدّ يساراً، فيصغّر المتصفّحُ الصفحةَ كلّها ويبقى فراغٌ على اليسار.
 * قِيس بمحاكاة هاتفٍ (isMobile) بعرض 360 على بناءٍ حقيقيّ:
 *   الرئيسية 379 — أرقامُ الإحصاءات (56px) في عمودين لا يتقلّصان دون محتواهما.
 *   المدوّنة 398 — نموذجُ النشرة: عنصرُ flex لا يتقلّص دون عرض حقله.
 *   الأسئلة  388 — حقلُ البحث: لـinput عرضٌ افتراضيّ (~20 حرفاً) ولا يتقلّص داخل flex.
 * بعد الإصلاح: 23 صفحةً عامّة بعرض 360 و390 تساوي الشاشة — حتى مع تعطيل شبكة الأمان.
 */
const css = (f: string) => readFileSync(join(process.cwd(), 'src/app/styles', f), 'utf8');

describe('📱 عرضُ الصفحة على الهاتف', () => {
  it('🚨 حقولُ الإدخال تتقلّص (min-width: 0)', () => {
    expect(css('shared.css')).toMatch(/input, textarea, select \{ min-width: 0; max-width: 100%; \}/);
  });

  it('🚨 بطاقاتُ الإحصاء تتقلّص، وأرقامُها بحجمٍ يتبع عرضَ الشاشة', () => {
    const s = css('marketing.css');
    expect(s).toMatch(/\.landing-stat-card, \.landing-stats-grid > \* \{ min-width: 0; \}/);
    expect(s).toMatch(/\.landing-stat-number \{ font-size: clamp\(/);
  });

  it('🚨 نموذجُ النشرة لا يتجاوز حاويته', () => {
    expect(css('marketing.css')).toMatch(/\.blog-newsletter-form \{ min-width: 0; width: 100%;/);
  });

  it('شبكةُ أمان: الصفحاتُ التسويقيّة تقصّ التجاوزَ بـclip (لا hidden — يكسر sticky)', () => {
    expect(css('marketing.css')).toMatch(/\.landing, \.blog-page, \.mkt-screen \{ overflow-x: clip; \}/);
  });
});

describe('📱 لوحة الإدارة على الهاتف', () => {
  /**
   * قِيس على 47 صفحة إدارة بعرض 390 (جلسة مديرٍ محاكاة): كان <main> يتمرّر أفقياً في ثمانٍ (حتى 735px في
   * صفحة المريض)، وجدولُ الممرّضين مقصوصاً. المصدر شبكاتٌ بأعمدةٍ ثابتة في النمط السطريّ (112 موضعاً).
   */
  const admin = css('admin.css');
  const mobile = admin.slice(admin.indexOf('لا عرضَ زائد في لوحة الإدارة'));

  it('🚨 العمودُ الجانبيّ الثابت ينطوي، والجانبُ لا يلتصق', () => {
    for (const w of ['320px', '340px', '360px']) expect(mobile).toContain(`[style*="1fr ${w}"]`);
    expect(mobile).toMatch(/position: static !important/);
  });

  it('🚨 أربعةُ أعمدة ← عمودان، وكلُّ عمودٍ يتقلّص (minmax(0, 1fr))', () => {
    expect(mobile).toMatch(/\[style\*="repeat\(4, 1fr\)"\][^{]*\{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\) !important; \}/);
    expect(mobile).toMatch(/\[style\*="flex: 1"\][^{]*\{ min-width: 0; \}/);
  });

  it('🚨 لا anywhere على المحتوى: يُكسّر جداولَ العربيّة حرفاً حرفاً', () => {
    expect(mobile).not.toMatch(/overflow-wrap: anywhere/);
    expect(mobile).toMatch(/main table \{ overflow-wrap: normal;/);
  });

  it('الجدولُ في حاويةٍ تقصّ يتمرّر، ولا نصَّ دون 12px', () => {
    expect(mobile).toMatch(/:has\(> table\)[^{]*\{ overflow-x: auto !important; \}/);
    expect(mobile).toMatch(/font-size: 11px"\][^{]*\{ font-size: 12px !important; \}/);
  });

  it('مقصورٌ على الهاتف — تصميمُ الحاسوب لا يتغيّر', () => {
    expect(mobile).toMatch(/^[\s\S]*?@media \(max-width: 700px\) \{/);
  });
});
