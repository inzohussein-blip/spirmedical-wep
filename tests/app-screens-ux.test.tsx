import { readFileSync } from 'fs';
import { join } from 'path';
import { render, screen, fireEvent, within } from '@testing-library/react';

/**
 * 📱 حارس شاشات المستخدم المُسجَّل
 *
 * قِيس بعرض 360px على الشاشات الحقيقيّة — مُعروضةً عبر خادمٍ محلّيّ يحاكي
 * Supabase بجلسة مريضٍ تجريبيّ، دون لمس قاعدة الإنتاج:
 *
 * ① بطاقةُ الطلب تناقض نفسها: «في انتظار التأكيد» وخطوةُ «تأكيد» مُعلَّمةٌ
 *    بـ✓. والمعلَّقُ والمؤكَّد متطابقان في المتتبِّع.
 * ② زرُّ «+» (z 999) فوق زرّ الإبلاغ عن عطل (z 100) بتداخل 48×40px في
 *    الرئيسية والطلبات والرسائل — لا يظهر منه إلّا حافّةٌ حمراء ولا يُلمس.
 * ③ إجراءاتُ «+» المطويّة خفيّةٌ لكنّها في ترتيب Tab ويعلنها قارئ الشاشة؛
 *    ومفتوحةً لا يُلمس منها إلّا الدائرة (38px) لا التسمية.
 * ④ بحثُ الرئيسية: حقلٌ ~٢١px في صندوقٍ ~٦٤px، وزرُّ «بحث صوتي» بلا onClick.
 * ⑤ ١٦ حقلاً تُكبّر iOS — من ~٨٥ حقلاً بنمطٍ مضمَّن دون 16px.
 */

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
}));
jest.mock('next/link', () => {
  // eslint-disable-next-line react/display-name
  return ({ children, href, ...rest }: any) => <a href={typeof href === 'string' ? href : ''} {...rest}>{children}</a>;
});

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');

describe('① متتبِّعُ الطلب لا يناقض نفسه', () => {
  const LiveStatusCard = require('@/components/dashboard/LiveStatusCard').default;
  const steps = () => [...document.querySelectorAll('.live-status-step')];
  const circle = (i: number) => steps()[i].querySelector('.live-status-step-circle')!;

  it('🚨 «في انتظار التأكيد»: خطوةُ «تأكيد» جاريةٌ لا مكتملة', () => {
    render(<LiveStatusCard status="pending" specialistName="بانتظار تعيين مختص" />);
    expect(screen.getByText('في انتظار التأكيد')).toBeInTheDocument();
    expect(circle(0).className).toMatch(/\bactive\b/);
    expect(circle(0).textContent).not.toContain('✓');
    expect(steps()[0].getAttribute('aria-current')).toBe('step');
  });

  it('🚨 المؤكَّد يختلف عن المعلَّق: «تأكيد» مكتملة ولا خطوةَ جارية', () => {
    render(<LiveStatusCard status="confirmed" specialistName="أحمد" />);
    expect(circle(0).className).toMatch(/\bcomplete\b/);
    expect(circle(0).textContent).toContain('✓');
    expect(steps().some((s) => s.getAttribute('aria-current'))).toBe(false);
  });

  it('في الطريق: الأولى مكتملة والثانية جارية بلا ✓', () => {
    render(<LiveStatusCard status="on_the_way" specialistName="أحمد" />);
    expect(circle(0).textContent).toContain('✓');
    expect(circle(1).className).toMatch(/\bactive\b/);
    expect(circle(1).textContent).not.toContain('✓');
  });

  it('حالةُ كلّ خطوةٍ مقروءةٌ لقارئ الشاشة', () => {
    render(<LiveStatusCard status="in_service" specialistName="أحمد" />);
    expect(steps()[0].textContent).toContain('مكتملة');
    expect(steps()[2].textContent).toContain('جارية');
  });
});

describe('② لا زرَّ إبلاغٍ عن عطل في واجهة المريض', () => {
  // كان عائماً فوق زرّ «+» فلا يُلمس، ثمّ نُقل إلى «مساعدة والدعم»، ثمّ رأى
  // المالك أنّه غير ضروريّ فحُذف. ولوحةُ الإدارة تبقى تعرض البلاغات السابقة.
  it('🚨 لا يُعرض في أيّ شاشة، ولا يبقى المكوّنُ ميّتاً', () => {
    const { existsSync } = require('fs');
    expect(existsSync(join(process.cwd(), 'src/components/feedback/BugReportButton.tsx'))).toBe(false);
    for (const f of ['src/app/(dashboard)/layout.tsx', 'src/app/(dashboard)/account/help/page.tsx']) {
      expect(read(f)).not.toMatch(/BugReport/);
    }
  });
});

describe('③ إجراءاتُ «+»', () => {
  const FloatingActionButton = require('@/components/ui/FloatingActionButton').default;

  it('🚨 مطويّةً: خارجَ ترتيب Tab وشجرة الإتاحة', () => {
    render(<FloatingActionButton />);
    const actions = [...document.querySelectorAll('.fab-action')];
    expect(actions.length).toBe(3);
    for (const a of actions) {
      expect(a.getAttribute('aria-hidden')).toBe('true');
      expect(a.querySelector('a')!.getAttribute('tabindex')).toBe('-1');
    }
  });

  it('🚨 مفتوحةً: الصفُّ كلُّه رابطٌ — التسميةُ داخله', () => {
    render(<FloatingActionButton />);
    fireEvent.click(screen.getByRole('button', { name: 'إجراءات سريعة' }));
    const link = screen.getByRole('link', { name: /سحب دم/ });
    expect(link.getAttribute('tabindex')).toBeNull();
    expect(within(link).getByText('سحب دم')).toHaveClass('fab-action-label');
    expect(link.closest('.fab-action')!.getAttribute('aria-hidden')).toBe('false');
  });
});

describe('④ بحثُ الرئيسية', () => {
  const SearchBarV3 = require('@/components/dashboard-v3/SearchBarV3').default;

  it('🚨 لا زرَّ «بحث صوتي» ميّتاً', () => {
    render(<SearchBarV3 />);
    expect(screen.queryByRole('button', { name: /صوتي/ })).toBeNull();
  });

  it('🚨 حقلُ بحثٍ مُسمّى يملأ الصندوق، ومفتاحُ لوحة المفاتيح «بحث»', () => {
    render(<SearchBarV3 />);
    const input = screen.getByRole('searchbox', { name: /ابحث/ });
    expect(input.getAttribute('enterkeyhint')).toBe('search');
    expect(input.style.alignSelf).toBe('stretch');
    expect(parseInt(input.style.minHeight, 10)).toBeGreaterThanOrEqual(44);
    expect(screen.getByRole('search')).toBeInTheDocument();
  });
});

describe('⑤ لا حقلَ يُكبّر iOS على الهاتف', () => {
  const css = read('src/app/styles/shared.css');
  const block = css.slice(css.indexOf('@media (max-width: 640px) {\n  input:not('));
  const rule = block.slice(0, block.indexOf('}\n}') + 3);

  it('🚨 القاعدةُ تغلب النمطَ المضمَّن وتشمل select وtextarea', () => {
    expect(rule).toMatch(/font-size:\s*16px\s*!important/);
    expect(rule).toMatch(/\n\s*select,\n\s*textarea \{/);
  });

  it('🚨 المستثنى ما هو أكبر من 16px عمداً — لا يُستعمل الاستثناءُ لتصغير حقل', () => {
    const excluded = [...rule.matchAll(/:not\(\.([\w-]+)\)/g)].map((m) => m[1]).sort();
    expect(excluded).toEqual(['auth-otp-input', 'input-large-text']);
    expect(css).toMatch(/\.auth-otp-input\s*\{[^}]*font-size:\s*(1[7-9]|[2-9]\d)px/);
    const wa = read('src/components/settings/WhatsAppOtpSettings.tsx');
    const at = wa.indexOf('className="input-large-text"');
    expect(at).toBeGreaterThan(0);
    const size = Number(wa.slice(at).match(/fontSize:\s*(\d+)/)![1]);
    expect(size).toBeGreaterThan(16);
  });
});

describe('⑥ سطرُ الثقة تحت «اطلب الفحص»', () => {
  it('🚨 سطرٌ مرن — Tailwind يجعل <svg> كتلةً فتسقط الأيقونات عن نصّها', () => {
    const f = read('src/components/appointments/BloodDrawFlow.tsx');
    const b = f.slice(f.indexOf('.bd-trust-row {'), f.indexOf('}', f.indexOf('.bd-trust-row {')));
    expect(b).toMatch(/display:\s*flex/);
    expect(b).toMatch(/align-items:\s*center/);
  });
});
