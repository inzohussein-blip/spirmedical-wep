/**
 * @jest-environment node
 */
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * ⬆️ ترقيةُ Supabase (supabase-js 2.118 و@supabase/ssr 0.12) — 16 تشرين الأول.
 *
 * #11 رقّاهما آليّاً فسقط فحصُ الأنواع وتوقّف النشر. هذه المرّة يدويّاً، وقِيس محلّياً بخادمٍ يحاكي
 * Supabase: جلسةٌ بالصيغة القديمة تُقرأ، ودخولٌ جديد (بريد، ورقم + PIN) يكتب كعكةً يقرؤها الخادم،
 * وبلا جلسة تحويلٌ إلى الدخول.
 *
 * والأنواعُ الأدقّ كشفت خللاً حيّاً: «إضافة مستشفى» من الإدارة تُدرج `verified_at`، ولا عمودَ
 * بهذا الاسم في hospitals (قِيس على الإنتاج) — فكان الإدراجُ يفشل دائماً.
 */
const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');

describe('ترقيةُ Supabase', () => {
  const pkg = JSON.parse(read('package.json'));

  it('🚨 الإصداران المجرَّبان مثبَّتان بدقّة', () => {
    expect(pkg.dependencies['@supabase/supabase-js']).toMatch(/^2\.(1[1-9]\d|[2-9]\d\d)\.\d+$/);
    expect(pkg.dependencies['@supabase/ssr']).toMatch(/^0\.(1[2-9]|[2-9]\d)\.\d+$/);
  });

  it('🚨 إضافةُ مستشفى لا تكتب عموداً غيرَ موجود (verified_at)', () => {
    const src = read('src/app/admin/hospitals/actions.ts');
    const insert = src.slice(src.indexOf(".from('hospitals').insert("), src.indexOf('});', src.indexOf(".from('hospitals').insert(")));
    expect(insert).toMatch(/is_verified: true/);
    const code = insert.replace(/\/\/.*$/gm, '');
    expect(code).not.toMatch(/\bverified_at\b/);
  });

  it('حالةُ الطلب من الرابط تُصدَّق قبل الاستعلام', () => {
    expect(read('src/app/admin/orders/page.tsx')).toMatch(
      /if \(searchParams\.status && isAppointmentStatus\(searchParams\.status\)\)/,
    );
  });
});
