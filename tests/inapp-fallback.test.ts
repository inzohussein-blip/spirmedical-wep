/**
 * 📥 نسخةُ صندوق التطبيق حين تتعثّر القناة الخارجيّة
 *
 * في 25 أيلول ألغى الرفضُ التلقائيّ ثلاثةَ طلبات، وفشلت رسائلُ واتساب الثلاث
 * بـ«Authentication Error» — فلم يعلم أيُّ مريضٍ بإلغاء طلبه. الآن يُكتب
 * نصُّ الرسالة في `notifications` (صندوق `/account/inbox`) عند أوّل تعثّر،
 * مرّةً واحدةً لكلّ رسالة.
 */

const sendPushToUser = jest.fn();
const sendWhatsApp = jest.fn();
jest.mock('@/lib/services/push', () => ({ sendPushToUser: (...a: unknown[]) => sendPushToUser(...a) }));
jest.mock('@/lib/whatsapp', () => ({ sendWhatsApp: (...a: unknown[]) => sendWhatsApp(...a) }));

interface Row { [k: string]: unknown }

function makeClient(queue: Row[], existingNotifications: Row[] = []) {
  const inserted: Row[] = [];
  const queueUpdates: Row[] = [];
  const client = {
    from(table: string) {
      const st: { filters: Row; payload?: Row } = { filters: {} };
      const api: Record<string, unknown> = {
        select: () => api,
        order: () => api,
        lte: () => api,
        eq(c: string, v: unknown) { st.filters[c] = v; return api; },
        update(p: Row) { st.payload = p; return api; },
        insert(p: Row) { inserted.push({ table, ...p }); return Promise.resolve({ error: null }); },
        limit() {
          if (table === 'notifications') {
            const qid = st.filters['metadata->>queue_id'];
            const hit = [...existingNotifications, ...inserted]
              .filter((n) => (n.metadata as Row | undefined)?.queue_id === qid);
            return Promise.resolve({ data: hit, error: null });
          }
          return Promise.resolve({ data: queue, error: null });
        },
        maybeSingle: () => Promise.resolve({ data: { name_ar: 'إلغاء الحجز' }, error: null }),
        single() {
          if (st.payload) queueUpdates.push({ ...st.filters, ...st.payload });
          return Promise.resolve({ data: { id: st.filters.id }, error: null });
        },
        then(res: (v: unknown) => unknown) {
          if (st.payload) queueUpdates.push({ ...st.filters, ...st.payload });
          return Promise.resolve(res({ data: null, error: null }));
        },
      };
      return api;
    },
  };
  return { client, inserted, queueUpdates };
}

const cancelledRow = {
  id: 'q-cancel-1',
  recipient_user_id: 'patient-1',
  recipient_phone: '07700000000',
  channel: 'whatsapp',
  template_key: 'order_cancelled',
  body: 'نأسف لإبلاغك أن حجزك تم إلغاؤه.',
  related_type: 'appointment',
  related_id: 'appt-1',
  status: 'pending',
  attempts: 1,
  max_attempts: 3,
  scheduled_for: new Date(0).toISOString(),
};

async function run(queue: Row[], existing: Row[] = []) {
  jest.resetModules();
  const made = makeClient(queue, existing);
  jest.doMock('@/lib/supabase/server-service', () => ({ createServiceClient: () => made.client }));
  const { processNotificationQueue } = await import('@/lib/notifications-processor');
  const result = await processNotificationQueue(10);
  return { result, ...made };
}

describe('📥 تعثّرُ واتساب لا يُسكت الإشعار', () => {
  beforeEach(() => { sendWhatsApp.mockReset(); sendPushToUser.mockReset(); });

  it('🚨 رسالةُ إلغاءٍ فشل واتسابها تُكتب في صندوق التطبيق برابط الطلب', async () => {
    sendWhatsApp.mockResolvedValue({ ok: false, error: 'Authentication Error', provider: 'meta' });
    const { result, inserted } = await run([cancelledRow]);

    expect(result.failed).toBe(1);
    const notes = inserted.filter((r) => r.table === 'notifications');
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({
      user_id: 'patient-1',
      body: cancelledRow.body,
      title: 'إلغاء الحجز',
      link: '/appointments/appt-1',
    });
    expect((notes[0].metadata as Row).queue_id).toBe('q-cancel-1');
  });

  it('🚨 مرّةً واحدة: المحاولةُ الثانية لا تُكرّر النسخة', async () => {
    sendWhatsApp.mockResolvedValue({ ok: false, error: 'Authentication Error' });
    const { inserted } = await run([cancelledRow], [{ metadata: { queue_id: 'q-cancel-1' } }]);
    expect(inserted.filter((r) => r.table === 'notifications')).toHaveLength(0);
  });

  it('مستخدمٌ بلا اشتراك دفع يجد الإشعارَ في الصندوق', async () => {
    sendPushToUser.mockResolvedValue({ sent: 0, failed: 0, removedSubscriptions: 0 });
    const { result, inserted } = await run([{ ...cancelledRow, id: 'q-push', channel: 'push' }]);
    expect(result.cancelled).toBe(1);
    expect(inserted.filter((r) => r.table === 'notifications')).toHaveLength(1);
  });

  it('النجاحُ لا يكتب نسخة', async () => {
    sendWhatsApp.mockResolvedValue({ ok: true, messageId: 'wamid.1' });
    const { inserted } = await run([cancelledRow]);
    expect(inserted.filter((r) => r.table === 'notifications')).toHaveLength(0);
  });

  it('الحالةُ في الطابور تبقى كما كانت (pending للإعادة)', async () => {
    sendWhatsApp.mockResolvedValue({ ok: false, error: 'Authentication Error' });
    const { queueUpdates } = await run([cancelledRow]);
    expect(queueUpdates[queueUpdates.length - 1].status).toBe('pending');
  });
});

describe('🔔 الصندوقُ مرئيّ', () => {
  const { readFileSync } = jest.requireActual('fs') as typeof import('fs');
  const read = (p: string) => readFileSync(`${process.cwd()}/${p}`, 'utf8');

  it('🚨 الجرسُ يفتح الصندوق لا الإعدادات', () => {
    expect(read('src/components/dashboard-v3/HeroCardV3.tsx')).toMatch(/href="\/account\/inbox"/);
  });

  it('🚨 الصفحةُ تقرأ `notifications` للمستخدم وتعرض النصّ', () => {
    const page = read('src/app/(dashboard)/account/inbox/page.tsx');
    expect(page).toMatch(/\.from\('notifications'\)[\s\S]*?\.eq\('user_id', user\.id\)/);
    expect(page).toMatch(/\{n\.body\}/);
  });

  it('🚨 الروابطُ داخليّةٌ وحدها (لا //host)', () => {
    const page = read('src/app/(dashboard)/account/inbox/page.tsx');
    expect(page).toContain('/^\\/(?!\\/)/.test(n.link)');
  });
});
