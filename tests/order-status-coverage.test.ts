import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';
import { ACTIVE_ORDER_STATUSES, IN_FLIGHT_STATUSES, ORDER_STATUSES, ORDER_STATUS_LABEL } from '@/lib/order-status';

/**
 * 🚦 حالتا «في الطريق» و«وصل» (0064 — تطبيق المختصّ «سباير برو»).
 *
 * الويب لا يكتبهما، لكنّ طلباً يقوده التطبيق يمرّ بهما. خريطةُ حالاتٍ تنساهما تعرض
 * الطلبَ «غيرَ معروف»، ومرشّحٌ بمصفوفةٍ محلّية `['pending','confirmed','in_progress']`
 * يُخفيه من «طلباتي» و«الحيّة» وبطاقة الطلب النشط أثناء توجّه المختصّ إليه.
 */
const ROOT = process.cwd();
const walk = (d: string): string[] =>
  readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const SRC = walk(join(ROOT, 'src')).filter((f) => /\.tsx?$/.test(f) && !f.endsWith('types/database.ts'));

describe('🚦 حالاتُ الطلب', () => {
  it('المصدرُ الواحد يطابق enum القاعدة', () => {
    const types = readFileSync(join(ROOT, 'src/types/database.ts'), 'utf8');
    const enumBlock = types.match(/appointment_status: \[([\s\S]*?)\]/)?.[1] ?? '';
    expect([...enumBlock.matchAll(/"([a-z_]+)"/g)].map((m) => m[1])).toEqual([...ORDER_STATUSES]);
    for (const s of ORDER_STATUSES) expect(ORDER_STATUS_LABEL[s]).toBeTruthy();
    expect(ACTIVE_ORDER_STATUSES).toEqual(expect.arrayContaining(['on_the_way', 'arrived']));
    expect(IN_FLIGHT_STATUSES).toEqual(expect.arrayContaining(['on_the_way', 'arrived']));
  });

  it('🚨 كلُّ خريطة حالاتٍ تعرف «في الطريق» و«وصل»', () => {
    const bad: string[] = [];
    for (const f of SRC) {
      const code = strip(readFileSync(f, 'utf8'));
      // خريطةٌ للطلبات = فيها مفتاحا confirmed و in_progress معاً
      if (!/\bconfirmed\s*:/.test(code) || !/\bin_progress\s*:/.test(code)) continue;
      if (!/\bon_the_way\s*:/.test(code) || !/\barrived\s*:/.test(code)) bad.push(relative(ROOT, f));
    }
    expect(bad).toEqual([]);
  });

  it('🚨 لا مرشّحَ حالاتٍ «جارية» بمصفوفةٍ محلّية — من lib/order-status', () => {
    const bad: string[] = [];
    for (const f of SRC) {
      const code = strip(readFileSync(f, 'utf8'));
      for (const m of code.matchAll(/\.in\(\s*'status'\s*,\s*\[([^\]]*)\]/g)) {
        if (/'in_progress'/.test(m[1]) && !/'on_the_way'/.test(m[1])) bad.push(`${relative(ROOT, f)}: [${m[1]}]`);
      }
    }
    expect(bad).toEqual([]);
  });
});
