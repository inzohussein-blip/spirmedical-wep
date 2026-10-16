import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * 🔤 الصفحة الرئيسية: لا أسطرَ متداخلة ولا حروفَ بسماكاتٍ مختلفة (طلبُ المالك، 16 تشرين الأول)
 *
 * قِيس في متصفّحٍ حقيقيّ (360/1280) بعد الانتقال إلى IBM Plex Sans Arabic:
 *   • العناوين بارتفاع سطر 1.02–1.1: للخطّ صواعدُ ونوازلُ أطول فتتلامس الأسطر.
 *   • الكلمةُ المُبرزة (`.landing-italic`) مائلةٌ بوزن 500 داخل عنوانٍ بوزن 800 — العائلةُ بلا مائل
 *     فيُصطنع الميلان، فتظهر حروفُ العنوان الواحد بسماكتين.
 *   • `letter-spacing` على نصٍّ عربيّ (0.2em في الشارات، سالبٌ في العناوين) يقطع وصلَ الحروف.
 *   • شريطُ «المزايا» يلصق العنوانَ بالوصف («مشفّر بالكاملبياناتك…»)، ويَعِد بـ«زين كاش · فيزا» والدفعُ نقدٌ.
 *   • هاتفُ التذييل يُعرض مقلوباً («3585 399 780 964+») بلا dir="ltr".
 */
const ROOT = process.cwd();
const css = (f: string) => readFileSync(join(ROOT, 'src/app/styles', f), 'utf8');
const rule = (s: string, sel: string) => {
  const i = s.indexOf(`${sel} {`);
  return s.slice(i, s.indexOf('}', i));
};
const home = readFileSync(join(ROOT, 'src/app/page.tsx'), 'utf8');

describe('🔤 الطباعة', () => {
  it('🚨 لا مائلَ مصطنعاً (العائلةُ بلا مائل)', () => {
    for (const f of ['marketing.css', 'shared.css', 'app.css']) expect(css(f)).not.toMatch(/font-style:\s*italic/);
  });

  it('🚨 الإبرازُ باللون وبوزن العنوان نفسِه', () => {
    const r = rule(css('marketing.css'), '.landing-h1-italic, .landing-italic');
    expect(r).toMatch(/font-weight:\s*inherit/);
    expect(r).toMatch(/font-style:\s*normal/);
  });

  it.each(['.landing-h1', '.landing-h2', '.landing-cta-h2', '.blog-hero-title', '.article-title'])(
    '🚨 %s بارتفاع سطرٍ ≥ 1.3',
    (sel) => {
      const m = /line-height:\s*([\d.]+)/.exec(rule(css('marketing.css'), sel));
      expect(Number(m?.[1])).toBeGreaterThanOrEqual(1.3);
    },
  );

  it('🚨 لا تباعدَ حروفٍ على النصّ العربيّ في الموقع', () => {
    const s = css('marketing.css');
    const bad = [...s.matchAll(/([^{}]+)\{[^}]*letter-spacing:\s*(-?[\d.]+(?:em|px))/g)]
      .filter((m) => !/stat-number|mono|code|pin|otp/i.test(m[1]) && parseFloat(m[2]) !== 0)
      .map((m) => m[1].trim());
    expect(bad).toEqual([]);
  });

  it('🚨 خطٌّ واحد للأرقام في الموقع (لا JetBrains Mono)', () => {
    expect(css('marketing.css')).not.toMatch(/JetBrains/);
  });
});

describe('🧭 ترتيبُ الرئيسية', () => {
  it('🚨 الأقسامُ بالترتيب: الخدمات ← كيف يعمل ← عن التطبيق ← التغطية ← … ← الأسئلة ← التثبيت', () => {
    const order = ['id="services"', 'id="how-it-works"', '<AboutApp', 'id="coverage-map"', 'landing-trust-section', 'id="testimonials"', 'id="doctors"', 'id="blog"', 'id="faq"', 'id="install"', 'landing-cta-section', 'landing-footer'];
    const pos = order.map((o) => home.indexOf(o));
    expect(pos.every((p) => p > 0)).toBe(true);
    expect([...pos].sort((a, b) => a - b)).toEqual(pos);
  });

  it('🚨 لا أقسامَ مكرّرة ولا وعدَ بدفعٍ إلكترونيّ', () => {
    expect(home).not.toMatch(/className="landing-features"|className="landing-cities"/);
    expect(home).not.toMatch(/زين كاش|فيزا/);
  });

  it('شريطُ التنقّل ≤ 7 روابط، والمدوّنةُ 3 مقالات، والهاتفُ ltr', () => {
    expect(home.match(/landing-nav-link-section/g)?.length).toBeLessThanOrEqual(7);
    expect(home).toMatch(/ARTICLES\.slice\(0, 3\)/);
    expect(home).toMatch(/href="tel:\+9647803993585" dir="ltr"/);
  });

  it('«كيف يعمل»: الرقمُ عمودٌ والنصُّ تحت بعضه', () => {
    expect(css('marketing.css')).toMatch(/\.landing-step \{\s*display: grid;\s*grid-template-columns: auto 1fr;/);
  });
});
