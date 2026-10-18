// خادمٌ يحاكي Supabase محلياً — لعرض شاشات المستخدم المُسجَّل دون لمس الإنتاج.
import http from 'http';
import fs from 'fs';

const PORT = 54399;
const UID = '11111111-1111-4111-8111-111111111111';
const ROLE = process.env.MOCK_ROLE || 'patient';
const PID = '22222222-2222-4222-8222-222222222222';
const now = new Date();
const iso = (d) => new Date(now.getTime() + d * 864e5).toISOString();

export const USER = {
  id: UID, aud: 'authenticated', role: 'authenticated', email: 'patient@example.test',
  phone: '9647700000000', app_metadata: { provider: 'phone', role: ROLE },
  user_metadata: { full_name: 'حسن محمد', role: ROLE }, created_at: iso(-30),
};

const PROFILE = {
  id: UID, role: ROLE, specialist_type: ROLE === 'specialist' ? 'lab_analyst' : null, is_available: true, full_name: 'حسن محمد', phone: '07700000000', email: 'patient@example.test',
  gender: 'male', date_of_birth: '1990-05-10', blood_type: 'O+', city: 'النجف', governorate: 'النجف',
  avatar_url: null, is_active: true, onboarding_completed: true, profile_completed: true,
  email_verified: true, phone_verified: true, created_at: iso(-30), updated_at: iso(-1),
  approval_status: 'approved', preferred_language: 'ar', loyalty_points: 120, loyalty_tier: 'silver', wallet_balance: 0,
};

// بياناتٌ تكفي لتظهر الشاشات بمحتوى لا فارغة
const PATIENT = { id: PID, full_name: 'زينب علي', phone: '07711111111' };
const SPEC_APPTS = [
  { id: 'o1', user_id: PID, specialist_id: null, service_type: 'سحب دم + تحاليل', status: 'pending', scheduled_at: iso(1), address: 'النجف · حي السعد · قرب جامع الحسن', created_at: iso(-0.05), updated_at: iso(-0.05), estimated_price: 25000, required_specialist_type: 'lab_analyst', governorate: 'النجف', users: PATIENT, patient: PATIENT },
  { id: 'o2', user_id: PID, specialist_id: UID, assigned_specialist_id: UID, service_type: 'سحب دم + تحاليل', status: 'confirmed', scheduled_at: iso(0.2), address: 'النجف · حي الأمير', created_at: iso(-1), updated_at: iso(-0.5), estimated_price: 30000, required_specialist_type: 'lab_analyst', governorate: 'النجف', users: PATIENT, patient: PATIENT },
  { id: 'o3', user_id: PID, specialist_id: UID, assigned_specialist_id: UID, service_type: 'تمريض منزلي', status: 'completed', scheduled_at: iso(-3), address: 'النجف · حي الغدير', created_at: iso(-4), updated_at: iso(-3), completed_at: iso(-3), estimated_price: 20000, governorate: 'النجف', users: PATIENT, patient: PATIENT },
];
// لوحةُ الإدارة: مريضٌ ومختصٌّ وطلبٌ وطارئ بمعرّفاتٍ ثابتة لصفحات التفاصيل
const SID = '33333333-3333-4333-8333-333333333333';
const ADMIN_USERS = [
  PROFILE,
  { ...PROFILE, ...PATIENT, role: 'patient', email: null, approval_status: 'approved' },
  { ...PROFILE, id: SID, full_name: 'علي حسين', phone: '+9647722222222', role: 'specialist', specialist_type: 'nurse',
    approval_status: 'pending', specialist_bio: 'ممرّض بخبرة 5 سنوات', specialist_years_exp: 5, specialist_languages: ['ar'], is_suspended: false },
];
const ADMIN_APPTS = [
  { ...SPEC_APPTS[0], id: '44444444-4444-4444-8444-444444444444', user_id: PID, assigned_specialist_id: SID, specialist_id: SID, status: 'confirmed',
    specialist: { full_name: 'علي حسين', phone: '+9647722222222' } },
];
// 🧪 مختبران (مختصّا تحاليل) وتحاليلُهما (0055) — لاختيار المختبر في سحب الدم
const LABS = [
  { id: '44444444-0000-4000-8000-000000000001', role: 'specialist', specialist_type: 'lab_analyst', approval_status: 'approved',
    is_suspended: false, full_name: 'أحمد كاظم', clinic_name: 'مختبر النور', clinic_city: 'النجف', governorate: 'النجف' },
  { id: '44444444-0000-4000-8000-000000000002', role: 'specialist', specialist_type: 'lab_analyst', approval_status: 'approved',
    is_suspended: false, full_name: 'سارة عباس', clinic_name: 'مختبر الرافدين', clinic_city: 'كربلاء', governorate: 'كربلاء' },
];
const LAB_TESTS = [
  ...['cbc', 'fbs', 'hba1c', 'lipid', 'tsh', 'vit-d'].map((t) => ({ specialist_id: LABS[0].id, test_id: t })),
  ...['cbc', 'fbs'].map((t) => ({ specialist_id: LABS[1].id, test_id: t })),
  ...(ROLE === 'specialist' ? ['cbc', 'fbs', 'hba1c'].map((t) => ({ specialist_id: UID, test_id: t })) : []),
];

const FIX = {
  specialist_lab_tests: LAB_TESTS,
  users: ROLE === 'specialist' ? [PROFILE, { ...PATIENT, role: 'patient' }] : ROLE === 'admin' ? ADMIN_USERS : [PROFILE, ...LABS],
  nurse_emergency_logs: ROLE === 'admin' ? [{ id: '55555555-5555-4555-8555-555555555555', specialist_id: SID, appointment_id: ADMIN_APPTS[0].id,
    trigger_reason: 'panic_button', description: 'وصفٌ تجريبيّ', latitude: 32.0, longitude: 44.33, status: 'open', created_at: iso(-0.01) }] : [],
  appointments: ROLE === 'specialist' ? SPEC_APPTS : ROLE === 'admin' ? ADMIN_APPTS : [
    { id: 'a1', user_id: UID, service_type: 'سحب دم + تحاليل', status: 'pending', scheduled_at: iso(1), address: 'النجف · حي السعد', created_at: iso(-1), updated_at: iso(-1), notes: null, estimated_price: 25000, required_specialist_type: 'lab_analyst' },
    { id: 'a2', user_id: UID, service_type: 'تمريض منزلي', status: 'completed', scheduled_at: iso(-6), address: 'النجف · حي الأمير', created_at: iso(-8), updated_at: iso(-6), completed_at: iso(-6), estimated_price: 30000 },
    { id: 'a3', user_id: UID, service_type: 'سحب دم + تحاليل', status: 'confirmed', scheduled_at: iso(3), address: 'النجف · حي الغدير', created_at: iso(-2), updated_at: iso(-1), assigned_specialist_id: 's1' },
  ],
  notifications: [
    { id: 'n1', user_id: UID, title: 'تمّ تأكيد موعدك', body: 'موعد سحب الدم غداً الساعة 9 صباحاً', type: 'appointment', is_read: false, created_at: iso(-0.1) },
    { id: 'n2', user_id: UID, title: 'نتائج فحوصاتك جاهزة', body: 'انقر لعرض النتائج', type: 'lab_results', is_read: true, created_at: iso(-3) },
  ],
  service_switches: [],
  // قصصُ الإنتاج كما هي: إيموجي في حقل icon (لا ti-*)
  stories: [
    ['لقاحات', '💉', '/tools/vaccinations', 'orange', 'حملة لقاح الإنفلونزا الموسميّة بدأت. راجع جدول التطعيم واحجز موعدك.', 'جدول التطعيم'],
    ['صحتك', '🩺', '/account/health', 'emerald', 'سجّل ضغطك وسكّرك أسبوعياً لترى تغيّرها في لوحة الصحة.', null],
    ['دواء', '💊', '/account/prescriptions', 'purple', 'احفظ وصفاتك في التطبيق ليصلك تذكيرُ الجرعة في موعدها.', null],
    ['تغذية', '🍎', '/services/nutrition', 'green', 'أخصائيّو التغذية متاحون للاستشارة.', null],
    ['إسعافات', '🚑', '/tools/first-aid', 'red', 'تعلّم الإسعافات الأوّليّة لعشر حالاتٍ شائعة.', 'افتح الدليل'],
  ].map(([title, icon, href, color_theme, description, cta_label], i) =>
    ({ id: `st${i + 1}`, title, icon, href, color_theme, description, cta_label, image_url: null, sort_order: i + 1,
      is_active: true, starts_at: null, ends_at: null, created_at: iso(-1), updated_at: iso(-1) })),
  service_areas: [],
  family_members: [],
  favorites: [], service_favorites: [], pharmacy_favorites: [],
  chats: [], messages: [],
  notification_preferences: [{ user_id: UID, appointment_reminders: true, lab_results: true, promotions: false }],
  health_vitals: [], reminders: [], prescriptions: [], lab_orders: [], user_medications: [], vaccination_records: [],
  app_theme_settings: [],
  service_waitlist: [],
  auth_login_pins: [],

};

function send(res, code, body, headers = {}) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*', ...headers });
  res.end(body === undefined ? '' : JSON.stringify(body));
}

// سجلُّ الطلبات يكشف ما تسأله الصفحةُ فعلاً (جدولٌ ناقصٌ في FIX = شاشةٌ فارغة)
const log = fs.createWriteStream(process.env.MOCK_LOG || '/dev/null');

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  log.write(`${req.method} ${u.pathname}${u.search}\n`);
  if (req.method === 'OPTIONS') return send(res, 204);

  if (u.pathname === '/auth/v1/user') return send(res, 200, USER);
  if (u.pathname === '/auth/v1/token') return send(res, 200, { access_token: 'mock-access', token_type: 'bearer', expires_in: 360000, expires_at: Math.floor(Date.now() / 1000) + 360000, refresh_token: 'mock-refresh', user: USER });
  if (u.pathname === '/auth/v1/logout') return send(res, 204);
  // حسابٌ هاتفيّ (بريدٌ اصطناعيّ) — كي يُجرَّب دخولُ «الرقم + PIN» محلّياً
  if (u.pathname.startsWith('/auth/v1/admin/users/')) return send(res, 200, { ...USER, email: '9647700000000@phone.spirmedical.local' });
  if (u.pathname.startsWith('/auth/v1/')) return send(res, 200, {});

  if (u.pathname.startsWith('/rest/v1/rpc/')) return send(res, 200, null);

  if (u.pathname.startsWith('/rest/v1/')) {
    const table = u.pathname.slice('/rest/v1/'.length);
    let rows = FIX[table] ? [...FIX[table]] : [];
    // مُرشِّحاتُ eq البسيطة (id=eq.x)
    for (const [k, v] of u.searchParams) {
      if (['select', 'order', 'limit', 'offset', 'or', 'and'].includes(k)) continue;
      const m = /^eq\.(.*)$/.exec(v);
      if (m) rows = rows.filter((r) => r[k] === undefined || String(r[k]) === m[1]);
    }
    const lim = u.searchParams.get('limit'); if (lim) rows = rows.slice(0, +lim);
    const single = (req.headers['accept'] || '').includes('vnd.pgrst.object');
    const range = `0-${Math.max(rows.length - 1, 0)}/${rows.length}`;
    if (req.method === 'HEAD') return send(res, 200, undefined, { 'Content-Range': range });
    if (req.method !== 'GET') return send(res, 201, single ? rows[0] ?? {} : rows);
    if (single) {
      if (!rows.length) return send(res, 406, { code: 'PGRST116', details: 'The result contains 0 rows', hint: null, message: 'JSON object requested, multiple (or no) rows returned' });
      return send(res, 200, rows[0], { 'Content-Range': range });
    }
    return send(res, 200, rows, { 'Content-Range': range });
  }
  if (u.pathname.startsWith('/storage/v1/')) return send(res, 404, { error: 'not found' });
  return send(res, 404, { error: 'unknown ' + u.pathname });
}).listen(PORT, '127.0.0.1', () => console.log('mock supabase on', PORT));
