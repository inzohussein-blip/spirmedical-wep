import { readFileSync } from 'fs';
import { join } from 'path';
import { render, screen } from '@testing-library/react';
import { specialistReadiness } from '@/lib/specialist-readiness';

/**
 * 🧭 جاهزيّةُ المختصّ الجديد
 *
 * المختصُّ المعتمَد يرى الطلبات فوراً، لكنّه لا يعلم بها إلّا بدفع الويب (واتساب معطّل).
 * وطلبٌ لا يُلتقط يُلغى بعد ٤٨ ساعة. فالبطاقةُ أعلى لوحته تقول ما ينقصه، وتختفي حين يكتمل.
 */

jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: jest.fn() }) }));
jest.mock('next/link', () => {
  // eslint-disable-next-line react/display-name
  return ({ children, href, ...rest }: any) => <a href={href} {...rest}>{children}</a>;
});
jest.mock('@/lib/push-client', () => ({ subscribeToPush: jest.fn() }));

const complete = { full_name: 'زينب علي', governorate: 'النجف', specialist_bio: 'محلّلة مختبر، ٥ سنوات' };

describe('specialistReadiness', () => {
  it('🚨 بلا اشتراك دفع → خطوةُ الإشعارات ناقصة', () => {
    const push = specialistReadiness(complete, 0).find((s) => s.key === 'push')!;
    expect(push.done).toBe(false);
    expect(specialistReadiness(complete, 1).find((s) => s.key === 'push')!.done).toBe(true);
  });

  it.each(['مستخدم', 'أخصائي', '', ' ', 'ع'])('🚨 الاسم «%s» لا يُعدّ اسماً', (full_name) => {
    expect(specialistReadiness({ ...complete, full_name }, 1).find((s) => s.key === 'name')!.done).toBe(false);
  });

  it('المحافظةُ والنبذة', () => {
    const steps = specialistReadiness({ ...complete, governorate: null, specialist_bio: '  ' }, 1);
    expect(steps.find((s) => s.key === 'governorate')!.done).toBe(false);
    expect(steps.find((s) => s.key === 'bio')!.done).toBe(false);
  });

  it('ملفٌّ مكتمل + اشتراك → كلُّ الخطوات مكتملة', () => {
    expect(specialistReadiness(complete, 2).every((s) => s.done)).toBe(true);
  });
});

describe('SpecialistReadinessCard', () => {
  const Card = require('@/components/specialist/SpecialistReadinessCard').default;

  it('🚨 يعرض زرَّ تفعيل الإشعارات والتقدّم', () => {
    render(<Card steps={specialistReadiness({ ...complete, specialist_bio: null }, 0)} />);
    expect(screen.getByTestId('specialist-readiness')).toHaveTextContent('2 من 4 مكتملة');
    expect(screen.getByRole('button', { name: 'تفعيل الإشعارات' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'تعديل الملفّ' })).toHaveAttribute('href', '/specialist/account/edit');
  });

  it('🚨 يختفي حين يكتمل كلُّ شيء', () => {
    const { container } = render(<Card steps={specialistReadiness(complete, 1)} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('🚨 لوحةُ المختصّ تعرضها بعدد الاشتراكات النشطة لصاحبها وحده', () => {
    const page = readFileSync(join(process.cwd(), 'src/app/(specialist)/specialist/page.tsx'), 'utf8');
    expect(page).toMatch(/<SpecialistReadinessCard steps=\{readiness\} \/>/);
    expect(page).toMatch(/\.from\('push_subscriptions'\)[\s\S]*?\.eq\('user_id', user\.id\)[\s\S]*?\.eq\('is_active', true\)/);
  });
});
