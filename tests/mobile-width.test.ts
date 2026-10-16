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
