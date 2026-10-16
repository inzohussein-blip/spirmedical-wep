/**
 * @jest-environment node
 */

/**
 * 🩺 «هل يوجد مختصٌّ يستلم الطلب؟» — سلوكُ الدالّة نفسها لا نصُّها.
 *
 * المعيارُ (معتمَد، غيرُ موقوف، من النوع المطلوب) يقرّر إن كان المريضُ يرفع طلباً أم يرى
 * «أعلِمني حين تتوفّر». ويفشل مفتوحاً: عطبُ الاستعلام لا يمنع طلباً طبّيّاً.
 */

const state = {
  rows: [] as { id: string }[],
  error: null as { message: string } | null,
  filters: [] as string[],
};

jest.mock('@/lib/supabase/server', () => ({
  createAdminClient: () => {
    const q: any = {
      select: () => q,
      eq: (c: string, v: string) => { state.filters.push(`${c}=${v}`); return q; },
      or: (expr: string) => { state.filters.push(`or:${expr}`); return q; },
      limit: (n: number) => { state.filters.push(`limit=${n}`); return Promise.resolve({ data: state.error ? null : state.rows, error: state.error }); },
    };
    return { from: (t: string) => { state.filters.push(`from:${t}`); return q; } };
  },
}));
jest.mock('@/lib/logger', () => ({ logger: { warn: () => {}, error: () => {}, info: () => {} } }));

const { eligibleSpecialistIds, isSpecialistAvailable, unavailableSpecialistTypes } = require('@/lib/specialist-availability');

beforeEach(() => {
  state.rows = [];
  state.error = null;
  state.filters = [];
});

it('🚨 المعيارُ الموحّد: مختصٌّ من النوع، معتمَد، غيرُ موقوف', async () => {
  state.rows = [{ id: 's1' }];
  expect(await eligibleSpecialistIds('nurse')).toEqual(['s1']);
  expect(state.filters).toEqual(expect.arrayContaining([
    'from:users', 'role=specialist', 'specialist_type=nurse', 'approval_status=approved',
    'or:is_suspended.is.null,is_suspended.eq.false',
  ]));
});

it('🚨 لا مختصّ ← غيرُ متاح', async () => {
  expect(await isSpecialistAvailable('lab_analyst')).toBe(false);
  expect(state.filters).toContain('limit=1');
});

it('🚨 عطبُ الاستعلام ← متاح (يفشل مفتوحاً)', async () => {
  state.error = { message: 'timeout' };
  expect(await eligibleSpecialistIds('nurse')).toBeNull();
  expect(await isSpecialistAvailable('nurse')).toBe(true);
});

it('خدمةٌ بلا نوع مختصّ (في منشأة) متاحةٌ دائماً بلا استعلام', async () => {
  expect(await isSpecialistAvailable(null)).toBe(true);
  expect(state.filters).toEqual([]);
});

it('الأنواعُ غيرُ المتاحة بلا تكرار', async () => {
  expect(await unavailableSpecialistTypes(['nurse', 'nurse', '', 'doctor'])).toEqual(['nurse', 'doctor']);
  expect(state.filters.filter((f) => f === 'from:users')).toHaveLength(2);
});
