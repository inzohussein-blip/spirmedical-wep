import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * 🌐 الجذر `/` هو الموقع التسويقي
 *
 * كان أيّ مستخدم مُسجّل يُحوَّل من `/` إلى التطبيق فوراً، فيتعذّر عليه بلوغ
 * صفحة التسويق من نطاقه أصلاً — حتى حين يقصدها عمداً. والصفحة العامّة
 * (الخدمات، التغطية، الأسئلة، المقالات) جمهورها يشمل المسجّلين.
 *
 * القاعدة: التحويل الوحيد الباقي من `/` هو فتح التطبيق المثبَّت
 * (`?source=pwa`) — فذلك قصدٌ صريح للتطبيق لا للتسويق.
 */

const SRC = join(process.cwd(), 'src');
const read = (rel: string) => readFileSync(join(SRC, rel), 'utf8');
const strip = (c: string) =>
  c.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');

describe('🌐 صفحة الجذر تُخدَم للجميع', () => {
  const page = strip(read('app/page.tsx'));

  it('🚨 لا تحويل للمستخدم المُسجّل من `/`', () => {
    // النمط المُزال: if (user) { … redirect(getRoleHomePath(...)) }
    expect(/if\s*\(\s*user\s*\)\s*\{[\s\S]{0,300}?redirect\(/.test(page)).toBe(false);
  });

  it('التحويل الوحيد الباقي هو فتح التطبيق المثبَّت', () => {
    expect(page).toContain('isPWA');
    expect(/if\s*\(\s*isPWA\s*\)\s*\{[\s\S]{0,120}?redirect\(/.test(page)).toBe(true);
  });

  it('الدور ما زال يُقرأ — لتكييف الدعوات لا للتحويل', () => {
    expect(page).toContain('getRoleHomePath');
    expect(page).toContain('appHomePath');
  });
});

describe('🌐 دعوات الصفحة تتكيّف مع حالة الدخول', () => {
  const page = strip(read('app/page.tsx'));
  const menu = strip(read('components/landing/MobileMenu.tsx'));

  it('«تسجيل دخول» لا تظهر لمن هو داخلٌ أصلاً', () => {
    for (const code of [page, menu]) {
      expect(/\{\s*!appHomePath\s*&&/.test(code)).toBe(true);
    }
  });

  it('الدعوات تقود إلى التطبيق للمسجّل وإلى البوّابة لغيره', () => {
    expect(page).toContain("appHomePath ?? '/gate'");
    expect(menu).toContain("appHomePath ?? '/gate'");
  });

  it('قائمة الجوّال تتلقّى الحالة (لا نصف إصلاح)', () => {
    expect(page).toContain('<LandingMobileMenu appHomePath={appHomePath} />');
  });
});

describe('🌐 فخّ إعداد النطاق الواحد', () => {
  /**
   * ⚠️ `MARKETING_URL` و`APP_URL` يشيران افتراضياً إلى **النطاق نفسه**.
   * فلو ضُبط `NEXT_PUBLIC_SITE_TYPE='app'`:
   *   • `/` يُحوَّل إلى `/dashboard` من الوسيط قبل أن تصل الصفحة أصلاً،
   *     فيصير الموقع التسويقي غير قابل للوصول.
   *   • ومسارات التسويق (`/about`, `/faq` …) تُحوَّل إلى `MARKETING_URL`
   *     وهو المضيف نفسه ⇒ **حلقة تحويل لا نهائية**.
   *
   * هذا الاختبار يوثّق الشرط ويمنع نسيانه: الفصل بـ`SITE_TYPE` لا يصلح
   * إلا بنطاقين مختلفين فعلاً.
   */
  const config = read('lib/site-config.ts');
  const middleware = strip(read('middleware.ts'));

  it('الفصل يعتمد على اختلاف النطاقين', () => {
    expect(config).toContain('NEXT_PUBLIC_MARKETING_URL');
    expect(config).toContain('NEXT_PUBLIC_APP_URL');
  });

  it('الوسيط يحوّل مسارات التسويق إلى MARKETING_URL', () => {
    // إن ساوى APP_URL فالنتيجة حلقة — لذا يجب ضبط نطاقين أو ترك SITE_TYPE='all'
    expect(middleware).toContain('MARKETING_URL');
    expect(middleware).toContain("SITE_TYPE !== 'all'");
  });

  it('الافتراضي `all` كي لا يقع الفخّ بلا ضبطٍ صريح', () => {
    expect(/\|\|\s*'all'/.test(config)).toBe(true);
  });
});
