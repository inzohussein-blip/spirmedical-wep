/**
 * @jest-environment node
 */
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * 🏥 الصيدليةُ والعيادةُ والمستشفى تملك منشأتَها في الدليل (0062، قرار المالك: «ربطٌ بمنشأةٍ موجودة أو إضافةُ جديدة،
 * والإدارةُ تعتمد الربط») — **وتفتح خدمتَها ولا تتلقّى شيئاً من المريض** (قرار المالك، 22 تشرين الأول): يراها في الدليل
 * ويتواصل معها مباشرة، ويحرّر مالكُها بياناتِ التواصل.
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
const listing = require('@/app/(provider)/provider/listing/actions');
const admin = require('@/app/admin/providers/actions');

const writes = (table: string, op: string) => calls.filter((c) => c.table === table && c.op === op);
const ROOT = process.cwd();
const code = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*(--|\/\/).*$/gm, '');

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

describe('✏️ المالكُ يحرّر بياناتِ منشأته وحدها', () => {
  const asOwner = (kind: string, updated: unknown[] = [{ id: 'x-1' }]) => {
    me = { id: 'prov-1', role: 'provider', provider_type: kind };
    respond = (c) => {
      if (c.table === 'users') return { data: me, error: null };
      if (c.op === 'update') return { data: updated, error: null };
      return { data: null, error: null };
    };
  };

  it('🚨 التحديثُ مقيّدٌ بعمود الملكيّة، والحقولُ المسموحة وحدها (لا اسمَ ولا توثيقَ ولا مالك)', async () => {
    asOwner('pharmacy');
    const r = await listing.updateMyListing({ phone: '07801234567', is24h: 'on', name: 'اسمٌ آخر', is_verified: true, owner_user_id: 'x' });
    expect(r).toMatchObject({ ok: true });
    const [u] = writes('pharmacies', 'update');
    expect(u.client).toBe('service');
    expect(u.filters).toContainEqual(['eq', 'owner_user_id', 'prov-1']);
    expect(u.payload).toMatchObject({ phone: '07801234567', is_24h: true, opens_at: null });
    expect(u.payload).not.toHaveProperty('name');
    expect(u.payload).not.toHaveProperty('is_verified');
    expect(u.payload).not.toHaveProperty('owner_user_id');
  });

  it('🚨 العيادةُ تكتب في حقولها (`clinic_phone`) ومقيّدةٌ بـ`user_id`، ولا صفّ ← فشلٌ صريح', async () => {
    asOwner('clinic', []);
    expect(await listing.updateMyListing({ phone: '07801234567', about: 'باطنية' })).toEqual({ ok: false, message: 'لا منشأةَ مرتبطة بحسابك' });
    const [u] = writes('doctors', 'update');
    expect(u.filters).toContainEqual(['eq', 'user_id', 'prov-1']);
    expect(u.payload).toEqual({ clinic_phone: '07801234567', bio: 'باطنية', clinic_address: null, updated_at: expect.any(String) });
  });

  it('الصيدليةُ بلا ساعاتٍ ولا «24 ساعة» تُرفض، والمختبرُ لا منشأةَ له', async () => {
    expect(L.sanitizeListingUpdate('pharmacy', { phone: '07801234567' })).toEqual({ ok: false, error: 'حدّد ساعاتِ الدوام أو «24 ساعة»' });
    expect(L.sanitizeListingUpdate('pharmacy', { phone: '07801234567', opensAt: '08:00', closesAt: '23:30' })).toMatchObject({ ok: true });
    me = { id: 'lab-1', role: 'provider', provider_type: 'lab' };
    respond = (c) => (c.table === 'users' ? { data: me, error: null } : { data: null, error: null });
    expect(await listing.updateMyListing({ phone: '07801234567' })).toMatchObject({ ok: false });
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

  it('🚨 المنشأةُ لا تتلقّى طلباتٍ من المريض: لا حجزَ في صفحاتها، ولا «طلبات» في نافذتها', () => {
    expect(code('src/app/(dashboard)/services/pharmacies/[id]/PharmacyDetailClient.tsx')).not.toMatch(/PharmacyReservationModal|احجز الدواء/);
    expect(code('src/app/(dashboard)/services/doctors/[id]/DoctorDetailClient.tsx')).not.toMatch(/DoctorBookingModal|setBookingModalType|startConsultation/);
    expect(code('src/app/(dashboard)/services/hospitals/[id]/page.tsx')).not.toMatch(/HospitalBooking/);
    expect(code('src/app/(dashboard)/services/pharmacies/actions.ts')).not.toMatch(/createPharmacyReservation/);
    expect(existsSync(join(ROOT, 'src/app/(provider)/provider/requests'))).toBe(false);
    expect(code('src/components/layout/AppShell.tsx')).not.toMatch(/\/provider\/(requests|samples)/);
  });
});
