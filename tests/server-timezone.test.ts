import { readFileSync, readdirSync } from 'fs';
import { join, relative } from 'path';

/**
 * 🕒 حارس: لا حساب «يوم» بتوقيت الخادم في كود الخادم
 *
 * `new Date().setHours(0,0,0,0)` يعطي بداية اليوم بتوقيت المُنفِّذ:
 *   • في مكوّن **عميل** → توقيت متصفّح المستخدم (بغداد) ✅ صحيح.
 *   • في كود **خادم** على Vercel → UTC ❌، فيبدأ «اليوم» الساعة ٠٣:٠٠ بغداد.
 *
 * الأثر الذي كُشف: تذكير المواعيد كان يرسل «📅 موعدك اليوم» لموعدٍ في الغد
 * باكراً، ولوحات الإدارة كانت تُسقط طلبات ما بعد منتصف الليل من حصيلة اليوم.
 *
 * التمييز بين العميل والخادم جوهري هنا: «إصلاح» مكوّن عميل يكسره.
 */

const SRC = join(process.cwd(), 'src');

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) sourceFiles(p, out);
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

const strip = (c: string) =>
  c.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');

/** ملفات يُحزَمها العميل: إمّا معلّمة `'use client'` أو يستوردها ملفٌ كذلك */
function clientBundled(files: string[]): Set<string> {
  const raw = new Map(files.map((f) => [f, readFileSync(f, 'utf8')]));
  const isClient = new Set(
    files.filter((f) => /^['"]use client['"]/m.test(raw.get(f)!))
  );

  // توسعة: أي ملف يستورده مكوّن عميل يعمل في المتصفّح أيضاً
  let changed = true;
  while (changed) {
    changed = false;
    for (const f of files) {
      if (isClient.has(f)) continue;
      const base = f.replace(/\.(ts|tsx)$/, '');
      const alias = '@/' + relative(SRC, base).split('\\').join('/');
      for (const c of isClient) {
        if (raw.get(c)!.includes(alias)) {
          isClient.add(f);
          changed = true;
          break;
        }
      }
    }
  }
  return isClient;
}

describe('🕒 كود الخادم لا يحسب «اليوم» بتوقيت الخادم', () => {
  const files = sourceFiles(SRC);
  const clientSide = clientBundled(files);

  it('يميّز العميل عن الخادم فعلاً (الحارس ليس فارغاً)', () => {
    expect(clientSide.size).toBeGreaterThan(10);
    expect(clientSide.size).toBeLessThan(files.length);
  });

  it('🚨 لا `setHours(0,0,0,0)` في ملفٍ خادميّ', () => {
    const offenders: string[] = [];

    for (const f of files) {
      if (clientSide.has(f)) continue;                 // العميل: التوقيت المحلّي صحيح
      if (f.endsWith('baghdad-day.ts')) continue;      // المساعد نفسه

      const code = strip(readFileSync(f, 'utf8'));
      if (/setHours\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)/.test(code)) {
        offenders.push(relative(process.cwd(), f));
      }
    }

    expect(offenders.sort()).toEqual([]);
  });

  it('التذكير اليومي يستعمل نافذة بغداد', () => {
    const cron = strip(
      readFileSync(join(SRC, 'app/api/cron/appointment-reminders/route.ts'), 'utf8')
    );
    expect(cron).toContain('baghdadDayWindow');
    expect(/setHours/.test(cron)).toBe(false);
  });

  it('منتقي المواعيد (عميل) لم يُمسّ — توقيت المتصفّح صحيح له', () => {
    const slots = join(SRC, 'lib/services/time-slots.ts');
    expect(clientSide.has(slots)).toBe(true);
    expect(readFileSync(slots, 'utf8')).toContain('setHours');
  });
});
