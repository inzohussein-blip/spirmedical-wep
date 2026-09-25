import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * 🩺 لا طلبَ لخدمةٍ بلا مختصّ — و«أعلِمني حين تتوفّر»
 *
 * في 25 أيلول كان في المنصّة صفرُ مختصّين، فبقيت الطلبات الثلاثة كلُّها
 * معلّقةً حتى ألغاها الرفضُ التلقائيّ. الآن يُسأل قبل الرفع: هل يوجد مختصٌّ
 * معتمَد غيرُ موقوفٍ من النوع المطلوب؟ وإلّا عُرضت قائمةُ الانتظار (0048)،
 * ويُخطَر المنتظرون داخل التطبيق حين يُعتمد أوّلُ مختصّ.
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');

/** جسمُ دالّةٍ مُصدَّرة: من توقيعها إلى الدالّة المُصدَّرة التالية */
function fnBody(src: string, name: string): string {
  const start = src.indexOf(`export async function ${name}(`);
  expect(start).toBeGreaterThan(-1);
  const next = src.indexOf('export async function ', start + 10);
  return src.slice(start, next < 0 ? undefined : next);
}

describe('① الإجراءاتُ ترفض قبل الإدراج', () => {
  const actions = read('src/app/(dashboard)/appointments/new/actions.ts');
  it.each([
    ['createAppointmentV2', /isSpecialistAvailable\(.*\.specialistType/],
    ['createBloodDrawOrder', /isSpecialistAvailable\('lab_analyst'\)/],
    ['createNursingAppointment', /isSpecialistAvailable\('nurse'\)/],
  ])('🚨 %s', (name, gate) => {
    const body = fnBody(actions, name);
    const g = body.search(gate as RegExp);
    const ins = body.indexOf('.insert(');
    expect(g).toBeGreaterThan(-1);
    expect(ins).toBeGreaterThan(-1);
    expect(g).toBeLessThan(ins);
    expect(body.slice(g, g + 200)).toContain("code: 'NO_SPECIALIST'");
  });
});

describe('② المعيارُ واحد: مَن يُخطَر بالطلب هو مَن يُحسب متاحاً', () => {
  const lib = read('src/lib/specialist-availability.ts');
  it('🚨 معتمَد + غيرُ موقوف + النوع', () => {
    const body = fnBody(lib, 'eligibleSpecialistIds');
    expect(body).toMatch(/\.eq\('role', 'specialist'\)/);
    expect(body).toMatch(/\.eq\('specialist_type', specialistType\)/);
    expect(body).toMatch(/\.eq\('approval_status', 'approved'\)/);
    expect(body).toMatch(/is_suspended\.is\.null,is_suspended\.eq\.false/);
  });
  it('🚨 إشعارُ الطلب الجديد يمرّ بالمعيار نفسه', () => {
    expect(read('src/lib/services/push-templates.ts')).toMatch(/eligibleSpecialistIds\(/);
  });
});

describe('③ الواجهة', () => {
  it('🚨 تدفّقا سحب الدم والتمريض يعرضان «غير متاحة» بدل النموذج', () => {
    const page = read('src/app/(dashboard)/appointments/new/page.tsx');
    expect(page).toMatch(/'blood-draw': \{ ?type: 'lab_analyst'/);
    expect(page).toMatch(/'home-nursing': \{ ?type: 'nurse'/);
    expect(page).toMatch(/<ServiceUnavailable\b/);
  });
  it('🚨 المعالجُ يعلِّم الخدمةَ غيرَ المتاحة ولا يتقدّم بها', () => {
    const w = read('src/components/appointments/AppointmentWizard.tsx');
    expect(w).toMatch(/unavailableSpecialistTypes/);
    expect(w).toMatch(/if \(isUnavailable\(/);
    expect(w).toContain('غير متاحة حالياً');
  });
});

describe('④ الإخطار عند الاعتماد', () => {
  const admin = read('src/app/admin/specialists/actions.ts');
  it('🚨 اعتمادُ المختصّ يُخطِر قائمةَ نوعه', () => {
    expect(fnBody(admin, 'approveSpecialist')).toMatch(/notifyServiceWaitlist\(specialistType\)/);
  });
  it('🚨 تغييرُ النوع يُخطِر بمعيارٍ صارم (لا الفتحَ عند الخطأ)', () => {
    const body = fnBody(admin, 'updateSpecialistType');
    expect(body).toMatch(/eligibleSpecialistIds\(newType, 1\)/);
    expect(body).not.toMatch(/isSpecialistAvailable\(/);
    expect(body).toMatch(/notifyServiceWaitlist\(newType\)/);
  });
});

describe('⑤ 0048 — المنح والسياسات', () => {
  const sql = read('supabase/migrations/0048_service_waitlist.sql');
  it('🚨 تُسحب المنحُ الافتراضيّة ثمّ يُعطى ما يلزم وحده', () => {
    expect(sql).toMatch(/REVOKE ALL ON public\.service_waitlist FROM anon, authenticated;/);
    expect(sql).toMatch(/GRANT SELECT, INSERT, DELETE ON public\.service_waitlist TO authenticated;/);
    expect(sql).not.toMatch(/GRANT[^;]*UPDATE[^;]*TO authenticated/);
  });
  it('🚨 المريضُ لا يُدرج صفّاً مُعلَّماً «أُخطِر»', () => {
    expect(sql).toMatch(/FOR INSERT WITH CHECK \(user_id = \(SELECT auth\.uid\(\)\) AND notified_at IS NULL\)/);
  });
});

/* ── سلوك: الإخطار يحجز ثمّ يكتب، ولا يُخطِر مرّتين ── */
describe('⑥ notifyServiceWaitlist', () => {
  const calls: { table: string; op: string; payload?: unknown; filters: Record<string, unknown> }[] = [];
  let claimRows: { user_id: string; service_id: string | null }[] = [];

  beforeEach(() => {
    calls.length = 0;
    jest.resetModules();
    jest.doMock('@/lib/supabase/server', () => ({
      createAdminClient: () => ({
        from(table: string) {
          const filters: Record<string, unknown> = {};
          let op = '';
          let payload: unknown;
          const api: Record<string, unknown> = {
            update(p: unknown) { op = 'update'; payload = p; return api; },
            insert(p: unknown) {
              calls.push({ table, op: 'insert', payload: p, filters });
              return Promise.resolve({ error: null });
            },
            eq(c: string, v: unknown) { filters[c] = v; return api; },
            is(c: string, v: unknown) { filters[`is:${c}`] = v; return api; },
            select() {
              calls.push({ table, op, payload, filters });
              return Promise.resolve({ data: claimRows, error: null });
            },
          };
          return api;
        },
      }),
    }));
  });

  it('🚨 يحجز صفوفَ النوع التي لم تُخطَر فقط، ثمّ يكتب إشعاراً لكلّ منها', async () => {
    claimRows = [{ user_id: 'p1', service_id: 'blood-draw' }, { user_id: 'p2', service_id: null }];
    const { notifyServiceWaitlist } = await import('@/lib/service-waitlist');
    expect(await notifyServiceWaitlist('lab_analyst')).toBe(2);

    const claim = calls.find((c) => c.table === 'service_waitlist')!;
    expect(claim.op).toBe('update');
    expect(claim.filters).toMatchObject({ specialist_type: 'lab_analyst', 'is:notified_at': null });

    const ins = calls.find((c) => c.table === 'notifications')!;
    const rows = ins.payload as { user_id: string; link: string }[];
    expect(rows.map((r) => r.user_id)).toEqual(['p1', 'p2']);
    expect(rows[0].link).toBe('/appointments/new?service=blood-draw');
  });

  it('لا منتظرين → لا إدراج', async () => {
    claimRows = [];
    const { notifyServiceWaitlist } = await import('@/lib/service-waitlist');
    expect(await notifyServiceWaitlist('nurse')).toBe(0);
    expect(calls.some((c) => c.table === 'notifications')).toBe(false);
  });

  it('نوعٌ مجهول لا يمسّ القاعدة', async () => {
    const { notifyServiceWaitlist } = await import('@/lib/service-waitlist');
    expect(await notifyServiceWaitlist('hacker')).toBe(0);
    expect(calls).toHaveLength(0);
  });
});
