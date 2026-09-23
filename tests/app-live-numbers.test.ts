import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * 🔢 أرقامُ التطبيق حيّة — قرار المالك (أرقامُ التسويق تبقى كما هي).
 *
 * داخل التطبيق كان منتقي المختبر في سحب الدم يعرض «4.9 · 1240+ تقييم» من
 * بياناتٍ مكتوبة في `labs-data.ts`، و`partner_labs` في الإنتاج بُذر بالأرقام
 * نفسها (4,230 مراجعة) ولا جدولَ تقييماتٍ للمختبرات يُحسب منه. صُفّر في 0047.
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');

describe('لا تقييماتٍ مكتوبة داخل التطبيق', () => {
  it('🚨 بيانات المختبرات الساكنة بلا تقييمٍ ولا عددِ مراجعات', () => {
    const labs = read('src/lib/services/labs-data.ts');
    expect(labs).not.toMatch(/^\s*rating:\s*[\d.]+/m);
    expect(labs).not.toMatch(/^\s*reviewsCount:\s*\d+/m);
  });

  it('🚨 بطاقةُ المختبر في سحب الدم لا تعرض تقييماً', () => {
    const flow = read('src/components/appointments/BloodDrawFlow.tsx');
    expect(flow).not.toMatch(/\.rating\b|reviewsCount|bd-lab-rating|[0-9]\+? ?تقييم/);
  });

  it('الترحيل 0047 يُصفّر المبذور ويُعاد بلا أثر', () => {
    const sql = read('supabase/migrations/0047_reset_seeded_lab_ratings.sql');
    expect(sql).toMatch(/UPDATE public\.partner_labs\s+SET rating_avg = 0, rating_count = 0\s+WHERE rating_avg <> 0 OR rating_count <> 0;/);
  });
});
