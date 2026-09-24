import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { render, screen } from '@testing-library/react';

/**
 * 🦵 العلاج الطبيعي: «قريباً» للحجز، مفتوحٌ للتصفّح.
 *
 * كان «احجز جلسة» يفتح /appointments/new?service=physio، والمعالجُ العامّ لا
 * يعرف `physio` فيعرض قائمة خدماتٍ ليس فيها علاجٌ طبيعيّ — يعلق المريض بعد
 * أن اختار أخصائيّه. قرار المالك: الحجز قريباً، والصفحات تبقى مفتوحة.
 */

jest.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) },
    from: () => {
      const q: any = {
        select: () => q, eq: () => q, order: () => q, limit: () => q,
        single: async () => ({ data: { phone: '', full_name: '' } }),
        then: (r: any) => r({ data: [] }),
      };
      return q;
    },
  }),
}));
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  usePathname: () => '/appointments/new',
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn(), refresh: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock('next/link', () => {
  // eslint-disable-next-line react/display-name
  return ({ children, href, ...rest }: any) => <a href={typeof href === 'string' ? href : ''} {...rest}>{children}</a>;
});
jest.mock('@/app/(dashboard)/appointments/new/NewAppointmentClient', () => ({
  __esModule: true,
  default: () => <div data-testid="order-client" />,
}));

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');

describe('الحجز قريباً', () => {
  const { isBookingSoon, CORE_SERVICES } = require('@/lib/services-v3');

  it('العلاج الطبيعي وحده، والخدماتُ الأخرى على حالها', () => {
    expect(isBookingSoon('physio')).toBe(true);
    expect(isBookingSoon('blood-draw')).toBe(false);
    expect(isBookingSoon('home-nursing')).toBe(false);
    expect(isBookingSoon('')).toBe(false);
  });

  it('البطاقةُ تبقى رابطاً إلى الصفحة (لا شارة المنع)', () => {
    const physio = CORE_SERVICES.find((s: any) => s.id === 'physio');
    expect(physio.route).toBe('/services/physio');
    expect(physio.badge).not.toBe('قريباً');
    const grid = read('src/components/dashboard-v3/BentoServicesGridV3.tsx');
    expect(grid).toMatch(/isComingSoon \|\| service\.bookingSoon \? 'قريباً'/);
    expect(grid).toMatch(/const isComingSoon = disabled \|\| service\.badge === 'قريباً';/);
  });

  it('🚨 صفحة الطلب لا تعرض المعالجَ لخدمةٍ حجزُها قريب', async () => {
    const Page = require('@/app/(dashboard)/appointments/new/page').default;
    render(await Page({ searchParams: { service: 'physio' } }));
    expect(screen.queryByTestId('order-client')).toBeNull();
    expect(screen.getByText('حجز جلسات العلاج الطبيعي')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /تصفّح أخصائيي العلاج الطبيعي/ })).toHaveAttribute('href', '/services/physio');
  });

  it('وخدمةٌ عاديّة تصل المعالجَ كما كانت', async () => {
    const Page = require('@/app/(dashboard)/appointments/new/page').default;
    render(await Page({ searchParams: { service: 'blood-draw' } }));
    expect(screen.getByTestId('order-client')).toBeInTheDocument();
  });

  it('🚨 لا رابطَ في الواجهة إلى حجز العلاج الطبيعي', () => {
    const files: string[] = [];
    const walk = (d: string) => {
      for (const f of readdirSync(join(process.cwd(), d))) {
        const p = `${d}/${f}`;
        if (statSync(join(process.cwd(), p)).isDirectory()) walk(p);
        else if (/\.tsx?$/.test(p)) files.push(p);
      }
    };
    walk('src');
    expect(files.filter((f) => read(f).includes('service=physio'))).toEqual([]);
  });
});
