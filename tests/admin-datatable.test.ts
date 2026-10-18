/**
 * @jest-environment node
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

/**
 * 📋 جداولُ لوحة الإدارة كلُّها بـ`DataTable` (18 تشرين الأول).
 *
 * كانت 17 صفحةً تكتب `<table>` بأنماطٍ سطريّة: بعرض الهاتف تفيض أفقياً أو تنضغط أعمدتُها، ولكلٍّ رأسٌ
 * بلونٍ وحشوٍ مختلف. `DataTable` يطويها بطاقاتٍ على الهاتف بعمودها الأساسيّ.
 */
const ROOT = process.cwd();
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : /\.tsx$/.test(n) ? [p] : [];
  });

describe('📋 لا جدولَ خامّاً في الإدارة', () => {
  it('🚨 كلُّ جدولٍ في src/app/admin يمرّ بـDataTable', () => {
    const raw = walk(join(ROOT, 'src/app/admin')).filter((f) => /<table[\s>]/.test(readFileSync(f, 'utf8')));
    expect(raw.map((f) => f.slice(ROOT.length + 1))).toEqual([]);
  });

  it('لكلّ DataTable عمودٌ أساسيٌّ واحد (عنوانُ البطاقة على الهاتف)', () => {
    for (const f of walk(join(ROOT, 'src/app/admin'))) {
      const src = readFileSync(f, 'utf8');
      const tables = src.split('<DataTable').slice(1);
      for (const t of tables) {
        const cols = t.slice(t.indexOf('columns={['), t.indexOf(']}', t.indexOf('columns={[')));
        expect([f.slice(ROOT.length + 1), (cols.match(/primary: true/g) ?? []).length]).toEqual([f.slice(ROOT.length + 1), 1]);
      }
    }
  });
});
