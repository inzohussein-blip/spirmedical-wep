/**
 * @jest-environment node
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { rankLabsForTests, type LabOffer } from '@/lib/labs/lab-match';
import { specialistReadiness } from '@/lib/specialist-readiness';

/**
 * 🧪 «المختصّ يختار الفحوص الموجودة في مختبره، وللمريض عند اختياره للفحوصات تظهر المختبرات التي تدعمها»
 * (قرار المالك، 18 تشرين الأول — 0055).
 *
 * كانت قائمةُ المختبرات في سحب الدم خمسةً ثابتة في الكود («معتمد دولياً»، «ISO 15189» بلا وثيقة) لا صلةَ لها
 * بالتحاليل ولا بمن يستلم الطلب، واسمُ المختبر في الطلب يرسله العميل كما يشاء.
 */
const ROOT = process.cwd();
const code = (p: string) =>
  readFileSync(join(ROOT, p), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*(--|\/\/).*$/gm, '');

const lab = (id: string, tests: string[]): LabOffer => ({ id, name: `مختبر ${id}`, city: 'النجف', tests });

describe('🧪 أيُّ مختبرٍ يُجري تحاليلَ المريض', () => {
  const labs = [lab('a', ['cbc', 'fbs']), lab('b', ['cbc', 'fbs', 'hba1c']), lab('c', ['tsh'])];

  it('🚨 الكاملُ أوّلاً، ثمّ الجزئيُّ بعدد الناقص، ولا يُعرض من لا يُجري شيئاً منها', () => {
    const r = rankLabsForTests(labs, ['cbc', 'fbs', 'hba1c']);
    expect(r.map((x) => x.lab.id)).toEqual(['b', 'a']);
    expect(r[0]).toMatchObject({ complete: true, covered: 3, missing: [] });
    expect(r[1]).toMatchObject({ complete: false, covered: 2, missing: ['hba1c'] });
  });

  it('بلا تحاليل مختارة لا مختبرات', () => {
    expect(rankLabsForTests(labs, [])).toEqual([]);
  });
});

describe('🚨 القاعدة: المختصُّ في قائمته وحدها (0055)', () => {
  const m = code('supabase/migrations/0055_specialist_lab_tests.sql');

  it('الإدراجُ لصاحب الصفّ ومختصِّ التحاليل وحده، والحذفُ لصاحبه، ولا تحديث', () => {
    expect(m).toMatch(/FOR INSERT TO authenticated\s+WITH CHECK \(\s*specialist_id = \(SELECT auth\.uid\(\)\)\s+AND EXISTS[\s\S]*u\.role = 'specialist' AND u\.specialist_type = 'lab_analyst'/);
    expect(m).toMatch(/FOR DELETE TO authenticated\s+USING \(specialist_id = \(SELECT auth\.uid\(\)\)\)/);
    expect(m).not.toMatch(/FOR UPDATE/);
    expect(m).toMatch(/REVOKE UPDATE ON public\.specialist_lab_tests FROM authenticated, anon/);
    expect(code('supabase/migrations/0056_lab_orders_lab_specialist_idx.sql')).toMatch(/ON public\.lab_orders \(lab_specialist_id\)/);
  });
});

describe('🚨 المريض: مختبراتٌ حقيقيّة تُجري تحاليلَه', () => {
  it('لا قائمةَ مختبراتٍ ثابتة ولا ادّعاءَ اعتمادٍ بلا وثيقة', () => {
    const d = code('src/lib/services/labs-data.ts');
    expect(d).not.toMatch(/PARTNER_LABS|ALL_LABS|ISO 15189|معتمد دولياً/);
    const flow = code('src/components/appointments/BloodDrawFlow.tsx');
    expect(flow).toMatch(/rankLabsForTests\(labs, selectedTests\)/);
    expect(flow).not.toMatch(/ALL_LABS/);
    expect(flow).toMatch(/labId: effectiveLabId/);
  });

  it('الخادمُ يتحقّق من المختبر ويأخذ اسمَه من القاعدة — لا ما يرسله العميل', () => {
    const a = code('src/app/(dashboard)/appointments/new/actions.ts');
    expect(a).toMatch(/const chosenLab = await resolveChosenLab\(input\.lab_specialist_id\)/);
    expect(a).toMatch(/lab_specialist_id: chosenLab\?\.id \?\? null/);
    expect(a).toMatch(/lab_name_snapshot: chosenLab \? chosenLab\.name :/);
    expect(a).not.toMatch(/lab_name_snapshot: input\.lab_name_snapshot/);
    const n = code('src/lib/labs/lab-network.ts');
    expect(n).toMatch(/eligibleSpecialistIds\('lab_analyst'/);
  });
});

describe('🚨 المختصّ: يحفظ تحاليلَ مختبره', () => {
  it('تحاليلُ معروفةٌ فقط، ومختصُّ تحاليل فقط، ويُعدّ الناتج', () => {
    const s = code('src/app/(specialist)/specialist/lab-tests/actions.ts');
    expect(s).toMatch(/filter\(\(id\) => known\.has\(id\)\)/);
    expect(s).toMatch(/profile\.specialist_type !== 'lab_analyst'/);
    expect(s).toMatch(/\(count \?\? -1\) !== wanted\.length/);
  });

  it('خطوةُ «حدّد تحاليلَ مختبرك» لمختصّ التحاليل وحده', () => {
    const p = { full_name: 'علي حسن', governorate: 'النجف', specialist_bio: 'x' };
    expect(specialistReadiness(p, 1).some((s) => s.key === 'labTests')).toBe(false);
    const step = specialistReadiness(p, 1, 0).find((s) => s.key === 'labTests');
    expect(step).toMatchObject({ done: false, href: '/specialist/lab-tests' });
    expect(specialistReadiness(p, 1, 5).find((s) => s.key === 'labTests')?.done).toBe(true);
  });
});
