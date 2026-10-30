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

describe('لا أعدادَ مُختلَقة في شاشات التطبيق (29 تشرين الأول)', () => {
  it('🚨 «+200 فحص» و«12 طبيب متاح الآن» و«+40 مستشفى» — والتطبيقُ يعرض 14 فحصاً ولا أطبّاءَ يُحجزون', () => {
    const { execSync } = require('child_process');
    const out: string = execSync(
      `grep -rlE "['\\">]\\s*\\+?[0-9]{2,}\\+? ?(طبيب|مستشفى|صيدلي|مختبر|ممرض|فحص|عيادة|مريض|مستخدم|نوع)|متاح الآن" src/app src/components --include=*.tsx || true`,
      { encoding: 'utf8' },
    );
    // الموقعُ التسويقيّ وأرقامُ الرئيسية باقيةٌ بقرار المالك
    const app = out.split('\n').filter(Boolean).filter((f) => !/src\/app\/\(marketing\)|src\/components\/landing|src\/app\/page\.tsx|Stats\.tsx/.test(f));
    expect(app).toEqual([]);
  });

  it('🚨 عددُ الفحوص من الكتالوج نفسه', () => {
    expect(read('src/app/guest/GuestClient.tsx')).toMatch(/\$\{BLOOD_TESTS\.length\} فحصاً/);
    expect(read('src/app/(dashboard)/services/page.tsx')).toMatch(/\{BLOOD_TESTS\.length\} فحصاً/);
  });
});
