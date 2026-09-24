/**
 * 📨 حارس قناة الدفع في طابور الإشعارات
 *
 * ═══ الخلل الذي وُلد منه ═══
 *
 * القوالبُ الثلاثة التي تُدرجها مُشغِّلاتُ القاعدة (الترحيل 0029) تُعلن
 * `channel = 'push'` — وهو ما تقوله `notification_templates` نفسها:
 *
 *     lab_results_ready ............... push
 *     pharmacy_reservation_new ........ push
 *     pharmacy_reservation_* .......... push
 *
 * وكان `deliverRow` يُنفّذ `whatsapp` وحدها، وما عداها:
 *
 *     result = { ok: false, error: `channel ${msg.channel} not implemented` }
 *
 * فكلُّ إشعارٍ من هذه المُشغِّلات يفشل ثلاث مرّاتٍ ثمّ يُدفن في `failed`،
 * بلا أن يصل المريضَ خبرُ أنّ نتائج تحاليله جاهزة. والتنفيذُ كان موجوداً
 * أصلاً في `@/lib/services/push` (web-push + `push_subscriptions`)، غيرَ
 * موصولٍ بالطابور.
 *
 * ═══ ولماذا `cancelled` لا `failed` ═══
 *
 * مستخدمٌ لم يأذن بالإشعارات ليس عطباً يُعاد ثلاثاً. يُنهى صفُّه
 * `cancelled` بسببٍ مكتوب، فلا تمتلئ لوحةُ المشرف بإخفاقاتٍ ليست إخفاقات.
 */

const sendPushToUser = jest.fn();
const sendWhatsApp = jest.fn();

jest.mock('@/lib/services/push', () => ({
  sendPushToUser: (...a: unknown[]) => sendPushToUser(...a),
}));
jest.mock('@/lib/whatsapp', () => ({
  sendWhatsApp: (...a: unknown[]) => sendWhatsApp(...a),
}));

/** عميلُ Supabase مُصغَّرٌ يكفي لما يلمسه المعالج */
interface Row { [k: string]: unknown }
function makeClient(rows: Row[], templates: Row[] = []) {
  const updates: Row[] = [];
  const client = {
    from(table: string) {
      const state: { filters: Row; payload?: Row } = { filters: {} };
      const api: Record<string, unknown> = {
        select: () => api,
        order: () => api,
        limit: () => Promise.resolve({ data: rows, error: null }),
        eq(col: string, val: unknown) { state.filters[col] = val; return api; },
        lte: () => api,
        lt: () => api,
        update(payload: Row) { state.payload = payload; return api; },
        maybeSingle: () =>
          Promise.resolve({
            data: templates.find((t) => t.key === state.filters.key) ?? null,
            error: null,
          }),
        single() {
          if (table === 'notification_queue' && state.payload) {
            updates.push({ table, ...state.filters, ...state.payload });
            // المطالبة الذرّية تنجح ما دام الصفّ pending
            const ok = state.filters.status === undefined || state.filters.status === 'pending';
            return Promise.resolve({ data: ok ? { id: state.filters.id } : null, error: null });
          }
          return Promise.resolve({ data: null, error: null });
        },
        then(res: (v: unknown) => unknown) {
          if (state.payload) updates.push({ table, ...state.filters, ...state.payload });
          return Promise.resolve(res({ data: null, error: null }));
        },
      };
      return api;
    },
  };
  return { client, updates };
}

const baseRow = {
  id: 'q1',
  recipient_user_id: 'u1',
  recipient_phone: '07700000000',
  body: 'نتائج فحوصاتك جاهزة الآن!',
  template_key: 'lab_results_ready',
  status: 'pending',
  attempts: 0,
  max_attempts: 3,
  scheduled_for: new Date(0).toISOString(),
};

describe('قناة الدفع تُسلَّم فعلاً', () => {
  beforeEach(() => {
    jest.resetModules();
    sendPushToUser.mockReset();
    sendWhatsApp.mockReset();
  });

  async function run(rows: Row[], templates: Row[] = []) {
    const { client, updates } = makeClient(rows, templates);
    jest.doMock('@/lib/supabase/server-service', () => ({
      createServiceClient: () => client,
    }));
    const { processNotificationQueue } = await import('@/lib/notifications-processor');
    const result = await processNotificationQueue(10);
    return { result, updates };
  }

  it('🚨 صفُّ `push` يُسلَّم عبر web-push لا يُعلَن «غير مُنفَّذ»', async () => {
    sendPushToUser.mockResolvedValue({ sent: 1, failed: 0, removedSubscriptions: 0 });
    const { result, updates } = await run([{ ...baseRow, channel: 'push' }]);

    expect(sendPushToUser).toHaveBeenCalledTimes(1);
    expect(result.succeeded).toBe(1);
    expect(updates.some((u) => u.status === 'sent')).toBe(true);
    // ولا يُدَّعى نجاحٌ عبر واتساب
    expect(sendWhatsApp).not.toHaveBeenCalled();
  });

  it('العنوان من `name_ar` في القالب، والنصّ من الطابور', async () => {
    sendPushToUser.mockResolvedValue({ sent: 1, failed: 0, removedSubscriptions: 0 });
    await run(
      [{ ...baseRow, channel: 'push' }],
      [{ key: 'lab_results_ready', name_ar: 'نتائج التحاليل جاهزة' }],
    );
    const [, payload] = sendPushToUser.mock.calls[0] as [string, { title: string; body: string }];
    expect(payload.title).toBe('نتائج التحاليل جاهزة');
    expect(payload.body).toBe(baseRow.body);
  });

  it('مستخدمٌ بلا اشتراكٍ نشِط → `cancelled` لا `failed`', async () => {
    // لم يأذن بالإشعارات: ليس عطباً يُعاد ثلاثاً
    sendPushToUser.mockResolvedValue({ sent: 0, failed: 0, removedSubscriptions: 0 });
    const { result, updates } = await run([{ ...baseRow, channel: 'push' }]);

    expect(result.cancelled).toBe(1);
    expect(result.failed).toBe(0);
    const done = updates.find((u) => u.status === 'cancelled');
    expect(done).toBeDefined();
    expect(done!.error_message).toBe('no_active_push_subscription');
  });

  it('عطبٌ حقيقيّ في الإرسال يبقى إخفاقاً يُعاد', async () => {
    sendPushToUser.mockResolvedValue({ sent: 0, failed: 2, removedSubscriptions: 0 });
    const { result, updates } = await run([{ ...baseRow, channel: 'push' }]);

    expect(result.failed).toBe(1);
    expect(result.cancelled).toBe(0);
    // أوّلُ محاولةٍ من ثلاث: تعود `pending` لا `failed`
    const last = updates[updates.length - 1];
    expect(last.status).toBe('pending');
  });

  it('صفُّ `push` بلا `recipient_user_id` لا يُرسَل إلى رقم هاتف', async () => {
    const { result } = await run([{ ...baseRow, channel: 'push', recipient_user_id: null }]);
    expect(sendPushToUser).not.toHaveBeenCalled();
    expect(result.failed).toBe(1);
  });

  it('وواتساب ما يزال يعمل كما كان', async () => {
    sendWhatsApp.mockResolvedValue({ ok: true, messageId: 'wamid.1', provider: 'meta' });
    const { result } = await run([{ ...baseRow, channel: 'whatsapp', template_key: 'order_cancelled' }]);
    expect(sendWhatsApp).toHaveBeenCalledTimes(1);
    expect(result.succeeded).toBe(1);
    expect(sendPushToUser).not.toHaveBeenCalled();
  });
});
