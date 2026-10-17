import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { render } from '@testing-library/react';
import EmojiIcon from '@/components/ui/EmojiIcon';
import { EmptyState } from '@/components/ui';
import { DataTable, StatusPill } from '@/components/admin-ui';
import { ICONS } from '@/lib/icons';
import { EMOJI_ICONS } from '@/lib/emoji-icons';

/**
 * 🎯 أيقوناتٌ من مصدرٍ واحد (Lucide) ومكوّناتٌ مشتركة للإدارة — قرار المالك، 17 تشرين الأول.
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
const AREAS = [...walk('src/app/admin'), ...walk('src/app/(marketing)'), ...walk('src/components/landing'), 'src/app/page.tsx'];

describe('🎯 مصدرُ الأيقونات', () => {
  it('كلُّ اسمٍ في السجلّين أيقونةٌ موجودة في Lucide', () => {
    for (const C of [...Object.values(ICONS), ...Object.values(EMOJI_ICONS)]) expect(C).toBeTruthy();
    expect(Object.keys(EMOJI_ICONS).length).toBeGreaterThan(130);
  });

  it('🚨 EmojiIcon يرسم Lucide لما في الجدول، ونقطةً ملوّنةً لدوائر الحالة، ويترك غيرَه', () => {
    expect(render(<EmojiIcon e="🏥" />).container.querySelector('svg')).toBeTruthy();
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

describe('🚨 لا إيموجي أيقونةً في الإدارة والموقع', () => {
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
