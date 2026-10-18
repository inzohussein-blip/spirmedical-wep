import { readFileSync } from 'fs';
import { join } from 'path';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { Story } from '@/types/story';

/**
 * 📸 قصصٌ حقيقيّة تنشرها الإدارة وحدها (قرار المالك، 18 تشرين الأول — 0054).
 *
 * كانت «القصص» روابطَ ثابتة: إطارٌ متدرّجٌ يوحي بمحتوى لم يُشاهَد ولا يتغيّر، ولونٌ بترتيب القصّة
 * (`nth-child`) لا بها — فاللونُ الذي يختاره المديرُ يُحفظ ولا يُرسم، والسادسةُ بلا لون — و«تغذية»
 * توصل إلى حاسبة المخاطر، وصفحةُ الزائر تعرض «إضافة» قصّةٍ كأنّ المستخدمَ ينشر.
 */
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...p }: { children: React.ReactNode; href: string }) => <a href={href} {...p}>{children}</a>,
}));
const mockStories = jest.fn(async () => [] as Story[]);
const mockLook = jest.fn(async () => ({ enabled: true, shape: 'circle', theme: 'concept' }));
jest.mock('@/lib/stories/get-stories', () => ({ getActiveStories: () => mockStories() }));
jest.mock('@/lib/stories/get-strip-settings', () => ({ getStripSettings: () => mockLook() }));

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*(--|\/\/).*$/gm, '');

const { default: StoriesStrip } = require('@/components/stories/StoriesStrip');

const story = (id: string, over: Partial<Story> = {}): Story => ({
  id, title: `قصّة ${id}`, icon: '💉', description: `نصّ ${id}`, href: `/x/${id}`, color_theme: 'blue',
  image_url: null, cta_label: null, sort_order: 0, is_active: true, starts_at: null, ends_at: null,
  created_by: null, created_at: '', updated_at: `2026-10-18T00:00:0${id}Z`, ...over,
});

beforeEach(() => localStorage.clear());

describe('📸 شريطُ القصص', () => {
  it('🚨 اللونُ من القصّة لا من ترتيبها (لوحةُ المشروع)', () => {
    const { container } = render(<StoriesStrip stories={[story('1', { color_theme: 'purple' }), story('2', { color_theme: 'red' })]} />);
    const btns = container.querySelectorAll<HTMLElement>('.story');
    expect(btns[0].getAttribute('style')).toContain('--st-fg: #9334E6');
    expect(btns[1].getAttribute('style')).toContain('--st-fg: #EA4335');
    expect(code('src/app/styles/app.css')).not.toMatch(/\.story:nth-child/);
  });

  it('🚨 الحلقةُ ملوّنة للجديدة، ورماديّة بعد المشاهدة — وتعود جديدةً إن عُدّلت', () => {
    const s = story('1');
    localStorage.setItem('spir_stories_seen_v1', JSON.stringify({ 1: s.updated_at }));
    const { container, rerender } = render(<StoriesStrip stories={[s, story('2')]} />);
    const [a, b] = container.querySelectorAll('.story');
    expect(a.className).toContain('story-seen');
    expect(b.className).toContain('story-new');
    rerender(<StoriesStrip stories={[{ ...s, updated_at: '2026-10-19T00:00:00Z' }]} />);
    expect(container.querySelector('.story')!.className).toContain('story-new');
  });
});

describe('📸 العارض', () => {
  it('🚨 يُفتح بملء الشاشة بالنصّ والزرّ، ويُعلّم القصّةَ مُشاهَدة', () => {
    render(<StoriesStrip stories={[story('1', { cta_label: 'احجز الآن' })]} />);
    fireEvent.click(screen.getByRole('button', { name: /قصّة: قصّة 1/ }));
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.textContent).toContain('نصّ 1');
    expect(screen.getByRole('link', { name: 'احجز الآن' }).getAttribute('href')).toBe('/x/1');
    expect(JSON.parse(localStorage.getItem('spir_stories_seen_v1')!)['1']).toBeTruthy();
  });

  it('🚨 التالية تتقدّم، وبعد الأخيرة يُغلق، وEscape يُغلق', () => {
    render(<StoriesStrip stories={[story('1'), story('2')]} />);
    fireEvent.click(screen.getByRole('button', { name: /قصّة: قصّة 1/ }));
    fireEvent.click(screen.getByRole('button', { name: 'القصّة التالية' }));
    expect(screen.getByRole('dialog').textContent).toContain('نصّ 2');
    fireEvent.click(screen.getByRole('button', { name: 'القصّة التالية' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /قصّة: قصّة 2/ }));
    act(() => { fireEvent.keyDown(document, { key: 'Escape' }); });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('زرٌّ بلا نصّ يقول «اعرف المزيد»، والرابطُ الخارجيّ في نافذةٍ جديدة', () => {
    render(<StoriesStrip stories={[story('1', { href: 'https://example.org/a' })]} />);
    fireEvent.click(screen.getByRole('button', { name: /قصّة: قصّة 1/ }));
    const a = screen.getByRole('link', { name: 'اعرف المزيد' });
    expect(a.getAttribute('target')).toBe('_blank');
    expect(a.getAttribute('rel')).toContain('noopener');
  });
});

describe('🚨 من الإدارة وحدها', () => {
  it('الحاويةُ عامّةُ القراءة بلا أيّ سياسة كتابة؛ والرفعُ بعد التحقّق من الدور', () => {
    const m = code('supabase/migrations/0054_stories_content.sql');
    expect(m).toMatch(/'stories', 'stories', true/);
    expect(m).not.toMatch(/CREATE POLICY/i);
    const a = code('src/app/admin/stories/actions.ts');
    const fn = a.slice(a.indexOf('export async function uploadStoryImage'));
    expect(fn.indexOf('requireAdmin()')).toBeGreaterThan(-1);
    expect(fn.indexOf('requireAdmin()')).toBeLessThan(fn.indexOf('createServiceClient()'));
  });

  it('لا قصصَ مكتوبةً في الكود، ولا «إضافة» قصّةٍ في صفحة الزائر', () => {
    expect(code('src/components/dashboard/StoriesRow.tsx')).not.toMatch(/FALLBACK|title: '/);
    const g = code('src/app/guest/GuestClient.tsx');
    expect(g).not.toMatch(/إضافة قصصك|isAdd/);
    expect(g).toMatch(/<StoriesStrip stories=\{stories\} shape=\{look\?\.shape\} theme=\{look\?\.theme\} \/>/);
  });

  it('«تغذية» توصل إلى التغذية', () => {
    expect(code('supabase/migrations/0054_stories_content.sql')).toMatch(/SET href = '\/services\/nutrition'/);
  });
});

describe('⚙️ تحكّمُ المدير بالشريط (app_settings: stories_strip)', () => {
  const { parseStripSettings, DEFAULT_STRIP } = require('@/lib/stories/strip-settings');

  it('🚨 غيابُ الإعداد أو فسادُه ← ظاهرٌ بالقيم الافتراضيّة (لا إخفاءَ بلا قرار)', () => {
    expect(parseStripSettings(null)).toEqual(DEFAULT_STRIP);
    expect(parseStripSettings({ enabled: 'no', shape: 'hexagon', theme: 1 })).toEqual(DEFAULT_STRIP);
    expect(parseStripSettings({ enabled: false, shape: 'chip', theme: 'soft' })).toEqual({ enabled: false, shape: 'chip', theme: 'soft' });
  });

  it('🚨 «إخفاء عن الجميع» يُخفي الشريط في الرئيسية وصفحة الزائر', async () => {
    const StoriesRow = require('@/components/dashboard/StoriesRow').default;
    mockStories.mockResolvedValueOnce([story('1')]);
    mockLook.mockResolvedValueOnce({ enabled: false, shape: 'circle', theme: 'concept' });
    expect(await StoriesRow()).toBeNull();
    mockStories.mockResolvedValueOnce([story('1')]);
    mockLook.mockResolvedValueOnce({ enabled: true, shape: 'card', theme: 'filled' });
    const { container } = render(await StoriesRow());
    expect(container.querySelector('.scr-stories')!.className).toMatch(/stories-shape-card.*stories-theme-filled/);
    expect(code('src/app/guest/page.tsx')).toMatch(/look\.enabled \? stories : \[\]/);
  });

  it('لكلّ شكلٍ وثيمٍ تنسيقٌ في shared.css (المعاينةُ في الإدارة تستعمله)', () => {
    const css = code('src/app/styles/shared.css');
    const { STRIP_SHAPES, STRIP_THEMES } = require('@/lib/stories/strip-settings');
    for (const s of STRIP_SHAPES.filter((x: string) => x !== 'circle')) expect(css).toContain(`.stories-shape-${s}`);
    for (const t of STRIP_THEMES.filter((x: string) => x !== 'concept')) expect(css).toContain(`.stories-theme-${t}`);
  });

  it('🚨 الحفظُ يُعدّ الصفَّ المكتوب، ويُبطل ما يراه المرضى؛ والقراءةُ بعميل الخدمة مفتاحاً واحداً', () => {
    const a = code('src/app/admin/stories/actions.ts');
    const fn = a.slice(a.indexOf('export async function saveStripSettings'));
    expect(fn.indexOf('requireAdmin()')).toBeLessThan(fn.indexOf(".from('app_settings')"));
    expect(fn).toMatch(/if \(!data\?\.length\)/);
    expect(fn).toMatch(/updateTag\('stories'\)/);
    expect(code('src/lib/stories/get-strip-settings.ts')).toMatch(/\.eq\('key', STRIP_SETTINGS_KEY\)/);
  });
});

describe('🍪 شريطُ الكوكيز بأصغر شكل', () => {
  it('🚨 سطرٌ واحد: لا أيقونةَ ولا عنوانَ ولا فقرةً قانونيّة خارج «تخصيص»', () => {
    const src = code('src/components/legal/CookieConsent.tsx');
    expect(src).not.toMatch(/cookie-icon|cookie-title|🍪/);
    expect(src).toMatch(/className="cookie-row"/);
    const css = code('src/app/styles/shared.css');
    expect(css).toMatch(/\.cookie-row \{ display: flex/);
  });
});
