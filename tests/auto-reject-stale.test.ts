import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * ⏳ حارس الرفض التلقائيّ للطلبات المعلَّقة
 *
 * طلبٌ يبقى `pending` بلا إسنادٍ لا يُغلق نفسه أبداً، فينتظر المريضُ ولا
 * أحد يخبره. والترحيل 0042 يُغلقه — لكنّ إغلاقاً آلياً لطلبٍ طبّيّ يحتاج
 * حدوداً صارمة، وهذا الملفّ يحرسها واحدةً واحدة:
 *
 *   ① المدّة **ليست في الكود**: تُقرأ من `app_settings`. وغيابُها أو صفرُها
 *      يُوقف الرفض بدل أن يعود إلى قيمةٍ مفترَضة — الصمتُ أسلمُ من إلغاءٍ
 *      لا يقصده أحد.
 *   ② `pending` وحدها. `confirmed` و`in_progress` خارج المدى.
 *   ③ الطوارئ (`nurse_emergency_logs`) لا يُغلقها مؤقّت.
 *   ④ لا رفضَ صامتاً: الإشعار يُدرَج في المعاملة نفسها.
 *   ⑤ المسار محميٌّ بـ`CRON_SECRET`.
 *
 * ═══ المُقاس في معاملةٍ مُلغاة ═══
 *
 *     مرفوضٌ=٣ مُخطَرٌ=٣ · القديم المعلَّق: cancelled · الحديث: pending
 *     المُسنَد: pending · قيد التنفيذ: in_progress · الطوارئ: pending
 *     رسائلُ الطابور للطلب المرفوض: ١ · تشغيلٌ ثانٍ: ٠
 *     الإعداد صفراً: ٠ · بلا إعداد: ٠
 */

const MIG = readFileSync(
  join(process.cwd(), 'supabase', 'migrations', '0042_auto_reject_stale_pending.sql'),
  'utf8',
);
const ROUTE = readFileSync(
  join(process.cwd(), 'src', 'app', 'api', 'cron', 'auto-reject-pending', 'route.ts'),
  'utf8',
);
const VERCEL = JSON.parse(readFileSync(join(process.cwd(), 'vercel.json'), 'utf8'));

/** جسمُ الدالّة وحده — دون ترويسة التعليقات، كي لا يمرّ شرطٌ ذُكر في شرحٍ فقط */
function fnBody(): string {
  const start = MIG.indexOf('CREATE OR REPLACE FUNCTION private.auto_reject_stale_pending');
  expect(start).toBeGreaterThan(0);
  const end = MIG.indexOf('$$;', MIG.indexOf('AS $$', start));
  expect(end).toBeGreaterThan(start);
  return MIG.slice(start, end);
}

describe('الرفض التلقائيّ محدودٌ بحدوده', () => {
  const body = fnBody();

  it('يقرأ الترحيل والمسار قراءةً صحيحة', () => {
    expect(body.length).toBeGreaterThan(500);
    expect(ROUTE).toMatch(/run_auto_reject_stale_pending/);
  });

  it('المدّة تُقرأ من الإعدادات، ولا رقمَ ساعاتٍ مسمَّرٌ في الدالّة', () => {
    expect(body).toMatch(/app_settings/);
    expect(body).toMatch(/pending_auto_reject_hours/);
    expect(body).toMatch(/make_interval\s*\(\s*hours\s*=>\s*v_hours\s*\)/);

    // لا `interval '48 hours'` ولا `v_hours := 48` ولا `COALESCE(v_hours, 48)`
    expect(body).not.toMatch(/interval\s*'\s*\d+\s*(hour|day)/i);
    expect(body).not.toMatch(/COALESCE\s*\(\s*v_hours/i);
    expect(body).not.toMatch(/v_hours\s*:?=\s*\d/);
  });

  it('غيابُ الإعداد أو صفرُه يوقف الرفض — لا يُرجعه إلى قيمةٍ مفترَضة', () => {
    expect(body).toMatch(/v_hours\s+IS\s+NULL\s+OR\s+v_hours\s*<=\s*0/i);
  });

  it('الشرط على `pending` وحدها وبلا إسناد', () => {
    const where = body.slice(body.indexOf('UPDATE public.appointments'));
    expect(where).toMatch(/a\.status\s*=\s*'pending'/);
    expect(where).toMatch(/a\.assigned_specialist_id\s+IS\s+NULL/i);
    // ما هو قيد التنفيذ لا يُلغى بمؤقّت
    expect(where).not.toMatch(/'in_progress'/);
    expect(where).not.toMatch(/'confirmed'/);
  });

  it('الطوارئ مستثناة', () => {
    expect(body).toMatch(/NOT\s+EXISTS[\s\S]{0,200}nurse_emergency_logs/i);
  });

  it('لا رفضَ صامتاً: الإشعار في المعاملة نفسها', () => {
    const upd = body.indexOf('UPDATE public.appointments');
    const notif = body.indexOf('INSERT INTO public.notification_queue');
    expect(notif).toBeGreaterThan(upd);
    expect(body).toMatch(/'order_cancelled'/);
    // في نفس العبارة (CTE) لا في عبارةٍ تالية قد تسقط وحدها
    expect(body).toMatch(/WITH\s+stale\s+AS\s*\([\s\S]*INSERT\s+INTO\s+public\.notification_queue/i);
  });

  it('المسار محميٌّ بسرٍّ ومجدولٌ في vercel.json', () => {
    expect(ROUTE).toMatch(/process\.env\.CRON_SECRET/);
    expect(ROUTE).toMatch(/!secret\s*\|\|\s*authHeader\s*!==\s*`Bearer \$\{secret\}`/);
    expect(ROUTE).toMatch(/status:\s*401/);
    expect(
      (VERCEL.crons as { path: string }[]).some(
        (c) => c.path === '/api/cron/auto-reject-pending',
      ),
    ).toBe(true);
  });

  it('الدالّة للخادم وحده', () => {
    expect(MIG).toMatch(/REVOKE\s+ALL\s+ON\s+FUNCTION\s+public\.run_auto_reject_stale_pending\(\)\s+FROM\s+anon,\s*authenticated/i);
    expect(MIG).toMatch(/GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.run_auto_reject_stale_pending\(\)\s+TO\s+service_role/i);
  });
});
