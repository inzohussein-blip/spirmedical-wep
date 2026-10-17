import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { render } from '@testing-library/react';
import EmojiIcon from '@/components/ui/EmojiIcon';
import { EmptyState } from '@/components/ui';
import { ActionTile, DataTable, StatCard, StatusPill } from '@/components/admin-ui';
import { ICONS, ICON_COLOR, ICON_TONES } from '@/lib/icons';
import { EMOJI_ICONS, EMOJI_TONE } from '@/lib/emoji-icons';

jest.mock('next/link', () => ({ __esModule: true, default: ({ children, ...p }: { children: React.ReactNode }) => <a {...p}>{children}</a> }));

/**
 * 🎯 أيقوناتٌ من مصدرٍ واحد ومكوّناتٌ مشتركة للإدارة — قرار المالك، 17 تشرين الأول.
 *
 * المصدرُ Tabler بأسلوب تطبيق المريض (لونُ المفهوم على خلفيّته الفاتحة): وُحّدت أوّلاً على Lucide،
 * ثمّ رأى المالكُ تطبيقَ المريض وفضّله، فنُقلت 169 ملفّاً وأُزيلت lucide-react.
 *
 * قِيس في المتصفّح (نصوصُ الصفحة المعروضة، بلا <script>) على 47 صفحة إدارة و15 صفحةً عامّة:
 * 186 إيموجي ظاهراً قبل ← 2 بعد (تحيّةٌ في مجسّم الهاتف، وقلبٌ داخل جملة — محتوى لا أيقونة).
 * والإيموجي يُرسم بخطّ الجهاز: شكلٌ في آيفون وآخر في أندرويد، ولا يتبع لونَ النصّ ولا الوضعَ الليليّ.
 */
const ROOT = process.cwd();
const EMO = /(?:[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{231A}-\u{23FF}])/u;

function walk(dir: string): string[] {
  return readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? walk(p) : e.name.endsWith('.tsx') ? [p] : [];
  });
}
const code = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const AREAS = [
  ...walk('src/app/admin'), ...walk('src/app/(marketing)'), ...walk('src/components/landing'), 'src/app/page.tsx',
  // تطبيقا المريض والمختصّ (17 تشرين الأول)
  ...walk('src/app/(dashboard)'), ...walk('src/app/(specialist)'), ...walk('src/components/appointments'),
  ...walk('src/components/dashboard-v3'), ...walk('src/components/layout'),
];

describe('🎯 مصدرُ الأيقونات', () => {
  it('كلُّ اسمٍ في السجلّين أيقونةُ Tabler، ولكلّ مفهومٍ لونٌ من اللوحة', () => {
    for (const C of [...Object.values(ICONS), ...Object.values(EMOJI_ICONS)]) expect(C).toBeTruthy();
    expect(Object.keys(EMOJI_ICONS).length).toBeGreaterThan(180);
    for (const n of Object.keys(ICONS) as (keyof typeof ICONS)[]) expect(ICON_TONES[ICON_COLOR[n]]).toBeTruthy();
    for (const t of Object.values(EMOJI_TONE)) expect(ICON_TONES[t]).toBeTruthy();
    // ألوانُ تطبيق المريض نفسُها (services-v3): المستشفى أزرق، الصيدلية بنفسجيّة، سحبُ الدم أحمر
    expect(ICON_TONES[ICON_COLOR.hospitals].fg).toBe('#1A73E8');
    expect(ICON_TONES[ICON_COLOR.pharmacies].fg).toBe('#9334E6');
    expect(ICON_TONES[ICON_COLOR.bloodDraw].fg).toBe('#EA4335');
  });

  it('🚨 lucide-react غائبةٌ من الكود والاعتماديّات', () => {
    const src = (dir: string): string[] =>
      readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((e) => {
        const p = join(dir, e.name);
        return e.isDirectory() ? src(p) : /\.tsx?$/.test(e.name) ? [p] : [];
      });
    expect(src('src').filter((f) => /from 'lucide-react'/.test(readFileSync(join(ROOT, f), 'utf8')))).toEqual([]);
    expect(JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).dependencies['lucide-react']).toBeUndefined();
  });

  it('🚨 EmojiIcon يرسم Tabler بلون مفهومه، ونقطةً ملوّنةً لدوائر الحالة، ويترك غيرَه', () => {
    const h = render(<EmojiIcon e="🏥" />).container.querySelector('svg');
    expect(h?.getAttribute('class')).toMatch(/tabler-icon/);
    expect(h?.getAttribute('data-tone')).toBe('blue');
    expect(h?.getAttribute('style')).toContain('--icon-tone: #1A73E8');
    expect(render(<EmojiIcon e="⚠️" />).container.querySelector('svg')).toBeTruthy(); // بمحدِّد الشكل
    expect(render(<EmojiIcon e="🟢" />).container.querySelector('.emoji-dot')).toBeTruthy();
    expect(render(<EmojiIcon e="🇬🇧" />).container.textContent).toBe('🇬🇧');
  });

  it('🚨 EmptyState يحوّل الإيموجي النصّيّ دون تغيير مواضع استعماله', () => {
    const { container } = render(<EmptyState icon="📦" title="لا توجد طلبات" />);
    expect(container.querySelector('svg')).toBeTruthy();
    expect(container.textContent).not.toMatch(EMO);
  });
});

describe('🚨 لا إيموجي أيقونةً في الإدارة والموقع وتطبيقَي المريض والمختصّ', () => {
  it('لا إيموجي في أوّل نصّ JSX (عنوان، زرّ، تسمية)', () => {
    const bad: string[] = [];
    for (const f of AREAS) {
      code(f).split('\n').forEach((l, i) => {
        const t = l.replace(/<EmojiIcon e="[^"]*" \/>/g, '');
        if (new RegExp(`>\\s*${EMO.source}\\s`, 'u').test(t) || new RegExp(`^\\s*${EMO.source}\\s`, 'u').test(t)) bad.push(`${f}:${i + 1}`);
      });
    }
    expect(bad).toEqual([]);
  });

  it('لا إيموجي داخل <option> (القائمةُ المنسدلة لا ترسم أيقونة)', () => {
    const bad = AREAS.filter((f) => /<option[^>]*>[^<]*\{[^}]*\.(?:emoji|icon)\}/.test(code(f)));
    expect(bad).toEqual([]);
  });

  it('القائمةُ الجانبيّة بأسماء أيقونات لا إيموجي، وزرُّها بأيقونة', () => {
    const s = code('src/app/admin/_components/AdminSidebar.tsx');
    expect(s).not.toMatch(EMO);
    expect(s).toMatch(/icon: IconName/);
  });
});

describe('🧩 مكوّناتُ الإدارة', () => {
  it('🚨 DataTable يرسم جدولاً وبطاقاتٍ من تعريف الأعمدة نفسه', () => {
    const { container } = render(
      <DataTable<{ id: string; name: string; gov: string }>
        rows={[{ id: '1', name: 'علي', gov: 'النجف' }]}
        rowKey={(r) => r.id}
        columns={[
          { key: 'n', header: 'الاسم', primary: true, render: (r) => r.name },
          { key: 'g', header: 'المحافظة', render: (r) => r.gov },
        ]}
      />,
    );
    expect(container.querySelector('table td')?.textContent).toBe('علي');
    expect(container.querySelector('.aui-card-primary')?.textContent).toBe('علي');
    expect(container.querySelector('.aui-card-field dt')?.textContent).toBe('المحافظة');
  });

  it('🚨 بلاطاتُ الإحصاء والإجراء بلون المفهوم (أسلوبُ تطبيق المريض)، و`tone` الصريح يغلبه', () => {
    const tile = (el: HTMLElement) => el.querySelector('.aui-stat-icon') as HTMLElement;
    const h = tile(render(<StatCard icon="hospitals" label="مستشفيات" value={3} />).container);
    expect(h.getAttribute('style')).toContain('--tone: #1A73E8');
    const p = tile(render(<ActionTile href="/x" icon="pharmacies" title="صيدليات" />).container);
    expect(p.getAttribute('style')).toContain('--tone: #9334E6');
    const r = tile(render(<StatCard icon="hospitals" label="x" value={1} tone="rose" />).container);
    expect(r.className).toContain('aui-tone-rose');
  });

  it('شارةُ الحالة تقبل أسماءً خاصّة بالمجال', () => {
    expect(render(<StatusPill status="pending" />).container.textContent).toBe('جديد');
    expect(render(<StatusPill status="pending" labels={{ pending: 'قيد المراجعة' }} />).container.textContent).toBe('قيد المراجعة');
  });
});

describe('🚨 لا ادّعاءَ اعتمادٍ رسميّ بلا وثيقة (قرار المالك، 17 تشرين الأول)', () => {
  it('«معتمد طبياً» و«وزارة الصحة» غائبان عن الواجهة', () => {
    const files = [...walk('src/app'), ...walk('src/components')];
    const bad = files.filter((f) => /معتمد طبي|معتمد رسمياً من|ووزارة الصحة العراقية/.test(code(f)));
    expect(bad).toEqual([]);
  });
});
