import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

/**
 * 🔧 أداةُ تدقيق الهاتف في المستودع لا في مسوّدةٍ تضيع
 *
 * كانت تُعاد كتابتُها في كلّ جلسة (CLAUDE.md: «أُعيد بناؤها كلَّ جلسة»). الآن في
 * `tools/mobile-audit/`، وهذا الحارس يمنع أن تنكسر بصمت: الملفّاتُ موجودة،
 * والسكربتان قابلان للتنفيذ، والمحاكي يعرف جداولَ الشاشات الجديدة.
 */

const root = (p: string) => join(process.cwd(), p);
const D = 'tools/mobile-audit';

it.each(['mock-supabase.mjs', 'session-cookie.mjs', 'audit.mjs', 'up.sh', 'down.sh', 'package.json', 'README.md'])(
  '🚨 %s موجود',
  (f) => expect(existsSync(root(`${D}/${f}`))).toBe(true),
);

it.each(['up.sh', 'down.sh'])('🚨 %s قابلٌ للتنفيذ', (f) => {
  expect(statSync(root(`${D}/${f}`)).mode & 0o111).not.toBe(0);
});

it('🚨 المحاكي يعرف جداولَ الصندوق وقائمة الانتظار', () => {
  const mock = readFileSync(root(`${D}/mock-supabase.mjs`), 'utf8');
  expect(mock).toMatch(/\bnotifications: \[/);
  expect(mock).toMatch(/\bservice_waitlist: \[/);
});

it('🚨 المحاكي والتطبيق على المنفذ نفسه', () => {
  const mock = readFileSync(root(`${D}/mock-supabase.mjs`), 'utf8');
  const up = readFileSync(root(`${D}/up.sh`), 'utf8');
  const port = /const PORT = (\d+)/.exec(mock)?.[1];
  expect(port).toBeDefined();
  expect(up).toContain(`NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:${port}`);
});

it('🚨 down.sh لا يقتل إلّا خادمَيه', () => {
  const down = readFileSync(root(`${D}/down.sh`), 'utf8');
  expect(down).toMatch(/\*mock-supabase\.mjs\*/);
  expect(down).toMatch(/next-server\*/);
  expect(down).not.toMatch(/pkill|killall/);
});

it('🚨 المخرجاتُ خارج git', () => {
  expect(readFileSync(root('.gitignore'), 'utf8')).toMatch(/^\.audit\/$/m);
});
