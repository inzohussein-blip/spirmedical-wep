/**
 * @jest-environment node
 */
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * 🧪 الدفعة 2 — «المريض ← مختبر ← سحّاب» (قرار المالك، 18 تشرين الأول).
 *
 * كان المحلّلُ يسحب ويُدخل النتائج بنفسه، وأزرارُ «أُرسل للمختبر/قيد التحليل» تكتب أيَّ حالةٍ بلا تحقّق ولا عدّ.
 * الآن: المحلّلُ «تمّ السحب» ← «سلّمتُ العيّنة» لمختبرٍ معتمَد، والمختبرُ يستلم ويرفع النتائج من نافذة الخدمة.
 */

// ── قاعدةٌ مزيّفة: كلُّ استعلامٍ يُسجَّل، والنتيجةُ من `respond` ──
type Call = { client: 'rls' | 'service'; table: string; op: string; filters: [string, string, unknown][]; payload?: unknown };
const calls: Call[] = [];
let respond: (c: Call) => { data: unknown; error: unknown } = () => ({ data: null, error: null });
let authUser: { id: string } | null = { id: 'lab-1' };

function builder(client: Call['client'], table: string) {
  const c: Call = { client, table, op: 'select', filters: [] };
  const b: any = {
    select: () => b,
    insert: (p: unknown) => { c.op = 'insert'; c.payload = p; return b; },
    update: (p: unknown) => { c.op = 'update'; c.payload = p; return b; },
    delete: () => { c.op = 'delete'; return b; },
    eq: (k: string, v: unknown) => { c.filters.push(['eq', k, v]); return b; },
    in: (k: string, v: unknown) => { c.filters.push(['in', k, v]); return b; },
    order: () => b,
    limit: () => b,
    single: () => b,
    maybeSingle: () => b,
    then: (ok: (v: unknown) => unknown, bad?: (e: unknown) => unknown) => {
      calls.push(c);
      return Promise.resolve(respond(c)).then(ok, bad);
    },
  };
  return b;
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: authUser } }) },
    from: (t: string) => builder('rls', t),
  }),
  createAdminClient: () => ({ from: (t: string) => builder('service', t) }),
}));
jest.mock('@/lib/supabase/server-service', () => ({
  createServiceClient: () => ({ from: (t: string) => builder('service', t) }),
}));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('@/lib/services/push-templates', () => ({
  notifyTestResultsReady: jest.fn(async () => {}),
  notifySpecialistAssigned: jest.fn(async () => {}),
}));
jest.mock('@/lib/audit', () => ({ logAuditEvent: jest.fn(async () => {}) }));
const network = [{ id: 'lab-1', name: 'مختبر النور', city: 'النجف', tests: ['cbc'] }];
jest.mock('@/lib/labs/lab-network', () => ({
  resolveChosenLab: async (id: string | null) => network.find((l) => l.id === id) ?? null,
  getLabNetwork: async () => network,
}));

const { sanitizeLabResults } = require('@/lib/labs/lab-results');
const specialist = require('@/app/(specialist)/specialist/orders/[id]/actions');
const lab = require('@/app/(provider)/provider/samples/actions');

const row = (o: Record<string, unknown> = {}) => ({ test_id: 'cbc', test_name: 'صورة دم', result_value: '13.2', status: 'normal', ...o });
const writes = (table: string, op: string) => calls.filter((c) => c.table === table && c.op === op);

beforeEach(() => {
  calls.length = 0;
  authUser = { id: 'lab-1' };
});

describe('🧹 النتائجُ من المتصفّح لا تُصدَّق', () => {
  it('🚨 حالةٌ من القائمة وحدها، ولا صفَّ ناقص، ولا رابطَ ملفٍّ من العميل، وسقفٌ للعدد', () => {
    expect(sanitizeLabResults([row({ status: 'fine' })])).toEqual({ ok: false, error: 'حالةُ نتيجةٍ غيرُ معروفة' });
    expect(sanitizeLabResults([row({ result_value: '  ' })])).toMatchObject({ ok: false });
    expect(sanitizeLabResults([])).toMatchObject({ ok: false });
    expect(sanitizeLabResults(Array.from({ length: 61 }, () => row()))).toMatchObject({ ok: false });
    const ok = sanitizeLabResults([row({ pdf_url: 'https://evil.example/x.pdf', notes: 'x'.repeat(900) })]);
    expect(ok.ok).toBe(true);
    expect(ok.results[0].pdf_url).toBeUndefined();
    expect(ok.results[0].notes).toHaveLength(500);
  });
});

describe('🩸 المحلّل: يسحب ويسلّم — لا يختار مختبراً خارج الشبكة', () => {
  const analyst = (labOrder: Record<string, unknown>, updatedRows: unknown[] = [{ id: 'lo-1' }]) => {
    authUser = { id: 'an-1' };
    respond = (c) => {
      if (c.table === 'users') return { data: { specialist_type: 'lab_analyst', role: 'specialist' }, error: null };
      if (c.table === 'appointments' && c.op === 'select') {
        return { data: { id: 'ap-1', user_id: 'pt-1', lab_order_id: 'lo-1', assigned_specialist_id: 'an-1', specialist_id: null }, error: null };
      }
      if (c.table === 'lab_orders' && c.op === 'select') return { data: labOrder, error: null };
      if (c.table === 'lab_orders' && c.op === 'update') return { data: updatedRows, error: null };
      return { data: null, error: null };
    };
  };

  it('🚨 «لا يهم» بلا اختيار، أو مختبرٌ ليس في الشبكة ← لا تسليم', async () => {
    analyst({ id: 'lo-1', status: 'sample_collected', lab_specialist_id: null });
    expect(await specialist.deliverSampleToLab('ap-1', null)).toEqual({ ok: false, error: 'اختر المختبرَ الذي ستسلّمه العيّنة' });
    expect(await specialist.deliverSampleToLab('ap-1', 'fake-lab')).toMatchObject({ ok: false });
    expect(writes('lab_orders', 'update')).toHaveLength(0);
  });

  it('🚨 اختيارُ المريض يغلب ما يرسله المحلّل، والاسمُ من القاعدة، والانتقالُ من حالةٍ متوقَّعة', async () => {
    analyst({ id: 'lo-1', status: 'sample_collected', lab_specialist_id: 'lab-1' });
    expect(await specialist.deliverSampleToLab('ap-1', 'another-lab')).toEqual({ ok: true });
    const [u] = writes('lab_orders', 'update');
    expect(u.payload).toMatchObject({ status: 'sent_to_lab', lab_specialist_id: 'lab-1', lab_name_snapshot: 'مختبر النور' });
    expect(u.filters).toContainEqual(['in', 'status', ['pending', 'sample_collected']]);
    expect(writes('appointments', 'update')[0].payload).toMatchObject({ status: 'completed' });
    const inbox = writes('notifications', 'insert')[0].payload as { user_id: string }[];
    expect(inbox.map((m) => m.user_id).sort()).toEqual(['lab-1', 'pt-1']);
  });

  it('🚨 صفرُ صفوفٍ محدَّثة ← فشلٌ صريح لا «تمّ»', async () => {
    analyst({ id: 'lo-1', status: 'sample_collected', lab_specialist_id: 'lab-1' }, []);
    expect(await specialist.deliverSampleToLab('ap-1')).toMatchObject({ ok: false });
    expect(writes('appointments', 'update')).toHaveLength(0);
  });

  it('مختصٌّ غيرُ مُسنَد لا يسلّم', async () => {
    analyst({ id: 'lo-1', status: 'sample_collected', lab_specialist_id: 'lab-1' });
    authUser = { id: 'someone-else' };
    expect(await specialist.deliverSampleToLab('ap-1')).toEqual({ ok: false, error: 'الطلب ليس مُسنَداً إليك' });
  });
});

describe('🏥 المختبر: يستلم ويرفع — عيّناتُه وحدها', () => {
  const asLab = (opts: { approved?: boolean; order?: Record<string, unknown> | null; inserted?: number } = {}) => {
    respond = (c) => {
      if (c.table === 'users') {
        return { data: { role: 'provider', provider_type: 'lab', approval_status: opts.approved === false ? 'pending' : 'approved', is_suspended: false }, error: null };
      }
      if (c.table === 'lab_orders' && c.op === 'select') {
        return { data: opts.order === undefined ? { id: 'lo-1', user_id: 'pt-1', status: 'processing', lab_specialist_id: 'lab-1', appointment_id: 'ap-1', lab_name_snapshot: 'مختبر النور' } : opts.order, error: null };
      }
      if (c.table === 'lab_results' && c.op === 'insert') {
        return { data: Array.from({ length: opts.inserted ?? (c.payload as unknown[]).length }, (_, i) => ({ id: `r${i}` })), error: null };
      }
      if (c.table === 'lab_orders' && c.op === 'update') return { data: [{ id: 'lo-1' }], error: null };
      return { data: null, error: null };
    };
  };

  it('🚨 عيّنةُ مختبرٍ آخر «غير موجودة» — ولا كتابة', async () => {
    asLab({ order: { id: 'lo-1', user_id: 'pt-1', status: 'processing', lab_specialist_id: 'lab-2' } });
    expect(await lab.saveResultsAsLab('lo-1', [row()])).toEqual({ ok: false, error: 'الطلب غير موجود' });
    expect(await lab.receiveSample('lo-1')).toEqual({ ok: false, error: 'الطلب غير موجود' });
    expect(calls.filter((c) => c.op !== 'select')).toHaveLength(0);
  });

  it('🚨 مختبرٌ لم يُعتمَد لا يرفع شيئاً', async () => {
    asLab({ approved: false });
    expect(await lab.saveResultsAsLab('lo-1', [row()])).toEqual({ ok: false, error: 'حسابُك بانتظار الاعتماد' });
  });

  it('🚨 المريضُ من الطلب لا من المدخل، وكاتبُها المختبر، ثمّ «جاهزة» ويُخطَر المريض', async () => {
    asLab();
    expect(await lab.saveResultsAsLab('lo-1', [row({ user_id: 'attacker' })])).toEqual({ ok: true });
    const [ins] = writes('lab_results', 'insert');
    expect(ins.client).toBe('service');
    expect(ins.payload).toEqual([expect.objectContaining({ user_id: 'pt-1', entered_by: 'lab-1', lab_order_id: 'lo-1' })]);
    expect(writes('lab_orders', 'update')[0].payload).toMatchObject({ status: 'results_ready' });
    expect(writes('notifications', 'insert')[0].payload).toEqual([expect.objectContaining({ user_id: 'pt-1', link: '/account/lab-history/lo-1' })]);
  });

  it('🚨 صفوفٌ أقلّ ممّا أُرسل ← فشلٌ صريح ولا «جاهزة»', async () => {
    asLab({ inserted: 0 });
    expect(await lab.saveResultsAsLab('lo-1', [row()])).toMatchObject({ ok: false });
    expect(writes('lab_orders', 'update')).toHaveLength(0);
  });

  it('الاستلامُ من «في الطريق» وحده ومقيّدٌ بالمختبر', async () => {
    asLab({ order: { id: 'lo-1', user_id: 'pt-1', status: 'sent_to_lab', lab_specialist_id: 'lab-1' } });
    expect(await lab.receiveSample('lo-1')).toEqual({ ok: true });
    const [u] = writes('lab_orders', 'update');
    expect(u.filters).toEqual(expect.arrayContaining([['eq', 'status', 'sent_to_lab'], ['eq', 'lab_specialist_id', 'lab-1']]));
  });
});

describe('🖥️ الواجهة', () => {
  const code = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');

  it('المحلّلُ يرى التسليم، وإدخالُ النتائج بديلٌ حين لا مختبرَ مسجَّلاً فقط', () => {
    const page = code('src/app/(specialist)/specialist/orders/[id]/page.tsx');
    expect(page).toMatch(/<SampleDelivery[\s\S]*fallbackEditor=\{\s*<LabResultsEditor\s+save=\{saveLabResults\.bind\(null, order\.id\)\}/);
    const card = code('src/app/(specialist)/specialist/orders/[id]/role-forms/SampleDelivery.tsx');
    expect(card).toMatch(/const noNetwork = !chosenLab && labs\.length === 0;/);
    expect(card).toMatch(/\{noNetwork && \(/);
    expect(code('src/app/(specialist)/specialist/orders/[id]/actions.ts')).not.toMatch(/updateLabOrderStatus/);
  });

  it('صفحةُ العيّنة لا تكشف اسمَ المريض ولا هاتفَه ولا عنوانَه', () => {
    const page = code('src/app/(provider)/provider/samples/[id]/page.tsx');
    const select = page.match(/\.from\('lab_orders'\)\s*\.select\('([^']+)'\)/)?.[1] ?? '';
    expect(select).not.toMatch(/user_id|name|phone|address/);
    expect(page).not.toMatch(/from\('users'\)\.select\('[^']*(full_name|phone)/);
  });
});
