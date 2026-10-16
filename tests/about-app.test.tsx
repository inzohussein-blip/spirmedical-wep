import { readFileSync } from 'fs';
import { join } from 'path';
import { render, screen } from '@testing-library/react';
import AboutApp from '@/components/landing/AboutApp';
import AboutPage from '@/app/(marketing)/about/page';

/**
 * ℹ️ «عن التطبيق»: قسمٌ في الرئيسية وصفحة `/about`، وفيهما فقرةُ سحب الدم المنزلي والخدمات
 * الطبّية المنزلية (طلبُ المالك، 16 تشرين الأول).
 *
 * كانت `/about` شاشةَ تطبيق: رجوعٌ إلى `/account`، و«الإصدار 1.0.0»، و«+200 نوع فحص».
 */
const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');

describe('ℹ️ AboutApp', () => {
  it('🚨 فقرةُ سحب الدم المنزلي والخدمات الطبّية المنزلية حاضرة', () => {
    render(<AboutApp />);
    expect(screen.getByRole('heading', { name: 'سحب الدم المنزلي' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'الخدمات الطبّية المنزلية' })).toBeTruthy();
    expect(screen.getByText('التمريضَ المنزليّ', { selector: 'strong' })).toBeTruthy();
    expect(screen.getByText('اطلب سحب دم منزلي').closest('a')?.getAttribute('href')).toContain('service=blood-draw');
  });

  it('🚨 لا عددَ مُختلَق ولا وعدَ بلا مصدر', () => {
    const { container } = render(<AboutApp variant="page" />);
    const text = container.textContent ?? '';
    expect(text).not.toMatch(/\+\s?\d|\d\s?\+|24\/7|فوري|الإصدار/);
  });

  it('العلاجُ الطبيعيّ «قريباً» لا «متاحة»', () => {
    render(<AboutApp />);
    const physio = screen.getByText('العلاج الطبيعي المنزلي').closest('li');
    expect(physio?.textContent).toContain('قريباً');
  });

  it('في الرئيسية h2 ورابطُ المزيد؛ في الصفحة h1 وحده', () => {
    const home = render(<AboutApp variant="home" />);
    expect(home.container.querySelector('h1')).toBeNull();
    expect(home.container.querySelector('a[href="/about"]')).toBeTruthy();
    home.unmount();
    const page = render(<AboutApp variant="page" />);
    expect(page.container.querySelectorAll('h1')).toHaveLength(1);
  });
});

describe('ℹ️ صفحة /about', () => {
  it('🚨 لا رجوعَ إلى /account ولا رقمَ إصدار، ولها وصفٌ وJSON-LD AboutPage', () => {
    const { container } = render(<AboutPage />);
    expect(container.querySelector('a[href="/account"]')).toBeNull();
    expect(container.textContent).not.toMatch(/الإصدار/);
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    const ld = [...container.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent ?? '');
    expect(ld.some((s) => s.includes('"AboutPage"'))).toBe(true);
    const src = read('src/app/(marketing)/about/page.tsx');
    expect(src).toMatch(/description: SUMMARY_AR/);
  });

  it('🚨 الرئيسية تعرض القسمَ وتربط به في التنقّل والتذييل', () => {
    const home = read('src/app/page.tsx');
    expect(home).toMatch(/<AboutApp variant="home" \/>/);
    expect(home).toMatch(/href="#about"/);
    expect(home).toMatch(/<Link href="\/about">عن التطبيق<\/Link>/);
    expect(read('src/components/landing/MobileMenu.tsx')).toMatch(/href="#about"/);
    expect(home).not.toMatch(/رمز SMS/);
  });
});
