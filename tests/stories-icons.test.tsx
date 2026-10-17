import { render } from '@testing-library/react';

/**
 * 📸 قصصُ الرئيسية: الإيموجي في القاعدة يُرسم أيقونةً لا نصّاً.
 *
 * القصصُ في الإنتاج مخزّنةٌ إيموجي (💉🩺💊🍎🚑 — تكتبها الإدارة)، و`StoryIcon` كان لا يرسم إلّا
 * أسماءَ `ti-*`، فظهرت القصصُ وحدها إيموجي ملوّناً وسط أيقونات Tabler الخطّيّة (ملاحظةُ المالك،
 * 17 تشرين الأول). القاعدةُ لا تُمسّ: الترجمةُ في الكود فتشمل ما تضيفه الإدارةُ لاحقاً.
 */
jest.mock('@/lib/stories/get-stories', () => ({ getActiveStories: jest.fn(async () => []) }));

const { StoryIcon } = require('@/components/dashboard/StoriesRow');

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

describe('📸 أيقوناتُ القصص', () => {
  it.each(['💉', '🩺', '💊', '🍎', '🚑'])('🚨 قصّةُ الإنتاج %s تُرسم أيقونةَ Tabler', (e) => {
    const { container } = render(<StoryIcon icon={e} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('class')).toMatch(/tabler-icon/);
    expect(container.textContent).not.toMatch(EMOJI);
  });

  it('محدِّدُ الشكل U+FE0F لا يُسقط الترجمة (❤️ = ❤)', () => {
    const { container } = render(<StoryIcon icon={'❤️'} />);
    expect(container.querySelector('svg')).toBeTruthy();
    expect(container.textContent).toBe('');
  });

  it('إيموجي خارج الجدول يمرّ بـEmojiIcon فيبقى خطّيّاً', () => {
    const { container } = render(<StoryIcon icon="🏆" />);
    expect(container.querySelector('svg')).toBeTruthy();
    expect(container.textContent).not.toMatch(EMOJI);
  });

  it('أسماءُ ti-* القديمة باقية', () => {
    const { container } = render(<StoryIcon icon="ti-vaccine" />);
    expect(container.querySelector('svg')?.getAttribute('class')).toMatch(/tabler-icon-vaccine/);
  });
});
