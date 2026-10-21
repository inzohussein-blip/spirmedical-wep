/**
 * @jest-environment node
 */
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * 🏥 الدفعة 3 — الصيدليةُ والعيادةُ والمستشفى تملك منشأتَها في الدليل وتردّ على حجوزاتها (0062، قرار المالك:
 * «ربطٌ بمنشأةٍ موجودة أو إضافةُ جديدة، والإدارةُ تعتمد الربط»).
 *
 * كانت حجوزاتُ الصيدلية ومواعيدُ العيادة والمستشفى تُكتب ولا يصل أيٌّ منها إلى أحد. وكُشف في الطريق: أيُّ مستخدمٍ
 * يُدرج طبيباً «موثَّقاً» نشطاً في الدليل، ومالكُ الصيدلية يكتب أيَّ عمودٍ في حجز المريض.
 */
type Call = { client: 'rls' | 'service'; table: string; op: string; filters: [string, string, unknown][]; payload?: unknown };
const calls: Call[] = [];
let respond: (c: Call) => { data: unknown; error: unknown } = () => ({ data: null, error: null });
let me: Record<string, unknown> = {};

function builder(client: Call['client'], table: string) {
  const c: Call = { client, table, op: 'select', filters: [] };
  const b: any = {
    select: () => b,
    insert: (p: unknown) => { c.op = 'insert'; c.payload = p; return b; },
    update: (p: unknown) => { c.op = 'update'; c.payload = p; return b; },
    delete: () => { c.op = 'delete'; return b; },
    eq: (k: string, v: unknown) => { c.filters.push(['eq', k, v]); return b; },
    in: (k: string, v: unknown) => { c.filters.push(['in', k, v]); return b; },
    is: (k: string, v: unknown) => { c.filters.push(['is', k, v]); return b; },
    or: () => b, order: () => b, limit: () => b, single: () => b, maybeSingle: () => b,
    then: (ok: (v: unknown) => unknown, bad?: (e: unknown) => unknown) => {
      calls.push(c);
      return Promise.resolve(respond(c)).then(ok, bad);
    },
  };
  return b;
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: me.id } } }) },
    from: (t: string) => builder('rls', t),
  }),
  createAdminClient: () => ({ from: (t: string) => builder('service', t) }),
}));
jest.mock('@/lib/supabase/server-service', () => ({ createServiceClient: () => ({ from: (t: string) => builder('service', t) }) }));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('@/lib/admin-audit', () => ({ logAdminAction: jest.fn(async () => {}) }));

const L = require('@/lib/provider-listings');
const requests = require('@/app/(provider)/provider/requests/actions');
const listing = require('@/app/(provider)/provider/listing/actions');
const admin = require('@/app/admin/providers/actions');

const writes = (table: string, op: string) => calls.filter((c) => c.table === table && c.op === op);
const ROOT = process.cwd();
const code = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*(--|\/\/).*$/gm, '');

/** صيدليةٌ معتمَدة تملك ph-1؛ والتحديثُ يعيد `updated` صفّاً */
const asPharmacy = (opts: { approved?: boolean; owned?: string[]; updated?: unknown[] } = {}) => {
  me = { id: 'prov-1', role: 'provider', provider_type: 'pharmacy', approval_status: opts.approved === false ? 'pending' : 'approved', is_suspended: false };
  respond = (c) => {
    if (c.table === 'users') return { data: me, error: null };
    if (c.table === 'pharmacies' && c.op === 'select') {
      return { data: (opts.owned ?? ['ph-1']).map((id) => ({ id, name: 'صيدلية الشفاء', city: 'النجف' })), error: null };
    }
    if (c.table === 'pharmacy_reservations' && c.op === 'update') {
      return { data: opts.updated ?? [{ id: 'res-1', user_id: 'pt-1', pharmacy_id: 'ph-1' }], error: null };
    }
    return { data: null, error: null };
  };
};

beforeEach(() => { calls.length = 0; });

describe('🧹 منشأةٌ جديدة: ما يقترحه الحسابُ منقّىً بحقول الجدول', () => {
  it('🚨 الناقصُ يُرفض، والعيادةُ تُكتب في حقول الطبيب، ونوعُ المستشفى من القائمة', () => {
    expect(L.sanitizeProposedListing('pharmacy', { name: 'ش', city: 'النجف', phone: '07801234567', district: 'x' })).toMatchObject({ ok: false });
    expect(L.sanitizeProposedListing('pharmacy', { name: 'الشفاء', city: 'النجف', phone: '07801234567' })).toEqual({ ok: false, error: 'حدّد الحيّ أو المنطقة' });
    expect(L.sanitizeProposedListing('doctor', { name: 'عيادة النور', city: 'النجف', phone: '07801234567', doctorName: 'د. علي', specialty: 'باطنية', is_verified: true }))
      .toEqual({ ok: true, row: expect.objectContaining({ full_name: 'د. علي', clinic_name: 'عيادة النور', clinic_city: 'النجف', available_for_clinic: true }) });
    const d = L.sanitizeProposedListing('doctor', { name: 'عيادة النور', city: 'النجف', phone: '07801234567', doctorName: 'د. علي', specialty: 'باطنية', is_verified: true });
    expect(d.row).not.toHaveProperty('is_verified');
    expect(L.sanitizeProposedListing('hospital', { name: 'الحكيم', city: 'النجف', phone: '07801234567', hospitalType: 'royal' })).toEqual({ ok: false, error: 'اختر نوعَ المستشفى' });
  });

  it('المختبرُ لا منشأةَ دليلٍ له، والعيادةُ ← doctors', () => {
    expect(L.listingKindFor('lab')).toBeNull();
    expect(L.listingKindFor('clinic')).toBe('doctor');
    expect(L.LISTING_SOURCE.doctor).toMatchObject({ table: 'doctors', owner: 'user_id' });
    expect(L.LISTING_SOURCE.hospital).toMatchObject({ table: 'hospitals', owner: 'owner_user_id' });
  });
});

describe('💊 الصيدلية تردّ على حجوزات منشأتها وحدها', () => {
  it('🚨 التحديثُ مقيّدٌ بمنشآت الحساب وبالحالة المسموحة، ويُخطَر المريض', async () => {
    asPharmacy();
    expect(await requests.updateReservation('res-1', 'confirm', { finalPrice: 12000 })).toEqual({ ok: true, message: 'تأكيد التوفّر' });
    const [u] = writes('pharmacy_reservations', 'update');
    expect(u.client).toBe('service');
    expect(u.filters).toEqual(expect.arrayContaining([['in', 'pharmacy_id', ['ph-1']], ['in', 'status', ['pending']]]));
    expect(u.payload).toMatchObject({ status: 'confirmed', total_final_price: 12000 });
    expect(writes('notifications', 'insert')[0].payload).toEqual([expect.objectContaining({ user_id: 'pt-1' })]);
  });

  it('🚨 حجزٌ ليس لمنشأتك أو تغيّرت حالتُه ← فشلٌ صريح، ولا إخطار', async () => {
    asPharmacy({ updated: [] });
    expect(await requests.updateReservation('res-x', 'ready')).toMatchObject({ ok: false });
    expect(writes('notifications', 'insert')).toHaveLength(0);
  });

  it('🚨 الاعتذارُ يطلب سبباً، والحسابُ غيرُ المعتمَد أو بلا منشأة لا يكتب', async () => {
    asPharmacy();
    expect(await requests.updateReservation('res-1', 'cancel', { reason: '  ' })).toEqual({ ok: false, message: 'اذكر سببَ الاعتذار — يراه المريض' });
    asPharmacy({ approved: false });
    expect(await requests.updateReservation('res-1', 'confirm')).toEqual({ ok: false, message: 'حسابُك بانتظار الاعتماد' });
    asPharmacy({ owned: [] });
    expect(await requests.updateReservation('res-1', 'confirm')).toEqual({ ok: false, message: 'اربط حسابَك بمنشأتك أوّلاً' });
    expect(await requests.updateReservation('res-1', 'drop_table')).toEqual({ ok: false, message: 'فعلٌ غيرُ معروف' });
    expect(writes('pharmacy_reservations', 'update')).toHaveLength(0);
  });

  it('الصيدليةُ لا تمسّ المواعيد', async () => {
    asPharmacy();
    expect(await requests.updateBooking('ap-1', 'confirm')).toEqual({ ok: false, message: 'للعيادات والمستشفيات' });
  });
});

describe('🩺 العيادة: مواعيدُ طبيبها (`doctor_id`)', () => {
  it('🚨 التأكيدُ مقيّدٌ بعيادات الحساب', async () => {
    me = { id: 'prov-2', role: 'provider', provider_type: 'clinic', approval_status: 'approved', is_suspended: false };
    respond = (c) => {
      if (c.table === 'users') return { data: me, error: null };
      if (c.table === 'doctors') return { data: [{ id: 'doc-1', full_name: 'د. علي', clinic_name: 'عيادة النور' }], error: null };
      if (c.table === 'appointments' && c.op === 'update') return { data: [{ id: 'ap-1', user_id: 'pt-1', doctor_id: 'doc-1' }], error: null };
      return { data: null, error: null };
    };
    expect(await requests.updateBooking('ap-1', 'confirm')).toEqual({ ok: true, message: 'تأكيد الموعد' });
    expect(writes('appointments', 'update')[0].filters).toEqual(expect.arrayContaining([['in', 'doctor_id', ['doc-1']], ['in', 'status', ['pending']]]));
  });
});

describe('🔗 الربط: طلبٌ تعتمده الإدارة', () => {
  it('🚨 منشأةٌ لها مالك لا تُطلب', async () => {
    me = { id: 'prov-1', role: 'provider', provider_type: 'pharmacy' };
    respond = (c) => {
      if (c.table === 'users') return { data: me, error: null };
      if (c.table === 'pharmacies') return { data: { id: 'ph-1', name: 'الشفاء', city: 'النجف', owner_user_id: 'someone', is_active: true }, error: null };
      return { data: null, error: null };
    };
    expect(await listing.claimListing('ph-1')).toMatchObject({ ok: false });
    expect(writes('provider_listing_claims', 'insert')).toHaveLength(0);
  });

  const asAdmin = (claim: Record<string, unknown>, ownershipRows: unknown[], claimRows: unknown[]) => {
    me = { id: 'adm-1', role: 'admin' };
    respond = (c) => {
      if (c.table === 'users') return { data: me, error: null };
      if (c.table === 'provider_listing_claims' && c.op === 'select') return { data: claim, error: null };
      if (c.table === 'pharmacies' && c.op === 'update') return { data: ownershipRows, error: null };
      if (c.table === 'provider_listing_claims' && c.op === 'update') return { data: claimRows, error: null };
      return { data: null, error: null };
    };
  };
  const claim = { id: 'cl-1', provider_id: 'prov-1', listing_kind: 'pharmacy', listing_id: 'ph-1', proposed: {} };

  it('🚨 الملكيّةُ مشروطةٌ بغياب مالك — ومنشأةٌ أُخذت لا يُعتمد طلبُها', async () => {
    asAdmin(claim, [], [{ id: 'cl-1' }]);
    expect(await admin.approveListingClaim('cl-1')).toMatchObject({ ok: false });
    const [own] = writes('pharmacies', 'update');
    expect(own.filters).toContainEqual(['is', 'owner_user_id', null]);
    expect(own.payload).toMatchObject({ owner_user_id: 'prov-1' });
    expect(writes('provider_listing_claims', 'update')).toHaveLength(0);
  });

  it('🚨 فشلُ تعليم الطلب «معتمَداً» يُرجع الملكيّة', async () => {
    asAdmin(claim, [{ id: 'ph-1' }], []);
    expect(await admin.approveListingClaim('cl-1')).toMatchObject({ ok: false });
    const [, revert] = writes('pharmacies', 'update');
    expect(revert.payload).toEqual({ owner_user_id: null });
  });
});

describe('🗄️ 0062 وتوصيلُ الإخطار', () => {
  const m = code('supabase/migrations/0062_provider_listings.sql');

  it('🚨 الطبيبُ لا يُدرجه غيرُ المدير، والمالكُ لا يكتب حجزَ المريض، والطلباتُ لعميل الخدمة', () => {
    const doctorsInsert = m.slice(m.indexOf('ALTER POLICY doctors_insert_merged'), m.indexOf('ALTER POLICY doctors_update_merged'));
    expect(doctorsInsert).toMatch(/users\.role IN \('admin', 'super_admin'\)/);
    expect(doctorsInsert).not.toMatch(/user_id\s*\)/);
    const res = m.slice(m.indexOf('ALTER POLICY pharmacy_reservations_insert_merged'));
    expect(res).not.toMatch(/owner_user_id/);
    expect(m).toMatch(/REVOKE ALL ON public\.provider_listing_claims FROM anon, authenticated/);
    expect(m).toMatch(/provider_listing_claims_listing_owner[\s\S]*WHERE status = 'approved'/);
    expect(m).not.toMatch(/\bDROP\b/);
  });

  it('الحجزُ الجديد يُخطر مالكَ المنشأة في المسارات الثلاثة', () => {
    expect(code('src/app/(dashboard)/services/pharmacies/actions.ts')).toMatch(/notifyListingOwner\('pharmacy', input\.pharmacy_id/);
    expect(code('src/app/(dashboard)/services/doctors/[id]/actions.ts')).toMatch(/notifyListingOwner\('doctor', input\.doctor_id/);
    expect(code('src/app/(dashboard)/services/booking/actions.ts')).toMatch(/notifyListingOwner\('hospital', input\.provider_id/);
  });
});
