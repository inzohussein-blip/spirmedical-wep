import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * 🛰️ لوحةُ الإرسال الحيّة (المرحلة 4، 0070): الإسنادُ عبر `admin_assign_order` وحدها،
 * وقواعدُها في SQL — الصفحةُ لا تكتب في `appointments` مباشرة.
 */
const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');
const strip = (s: string) => s.replace(/--.*$/gm, '');

describe('🛰️ لوحةُ الإرسال', () => {
  const sql = strip(read('supabase/migrations/0070_admin_dispatch.sql'));
  const assignFn = sql.slice(sql.indexOf('FUNCTION public.admin_assign_order'));

  it('🚨 الإسنادُ للإدارة وحدها، وحارسُه لا يُعطي NULL', () => {
    expect(assignFn).toMatch(/NOT coalesce\(private\.is_admin\(v_uid\), false\)/);
    expect(sql).toMatch(/REVOKE EXECUTE ON FUNCTION public\.admin_assign_order\(uuid, uuid\) FROM PUBLIC, anon/);
    expect(sql).toMatch(/REVOKE EXECUTE ON FUNCTION public\.get_dispatch_board\(\) FROM PUBLIC, anon/);
  });

  it('🚨 المختصّ معتمَدٌ وغيرُ موقوف ومن النوع المطلوب، والطلبُ لم يصل المراجع', () => {
    expect(assignFn).toMatch(/v_s\.approval_status = 'approved'/);
    expect(assignFn).toMatch(/NOT coalesce\(v_s\.is_suspended, false\)/);
    expect(assignFn).toMatch(/v_s\.specialist_type = v_o\.required_specialist_type/);
    expect(assignFn).toMatch(/NOT IN \('pending', 'confirmed', 'on_the_way'\)/);
    expect(assignFn).toMatch(/INSERT INTO public\.order_events/);
  });

  it('الإجراءُ يمرّ بالدالّة ويُسجَّل، والصفحةُ تقرأ اللوحة منها', () => {
    const action = read('src/app/admin/dispatch/actions.ts');
    expect(action).toMatch(/\.rpc\('admin_assign_order'/);
    expect(action).toMatch(/isAdminRole/);
    expect(action).toMatch(/logAdminAction/);
    expect(action).not.toMatch(/from\('appointments'\)\s*\.update/);
    expect(read('src/app/admin/dispatch/page.tsx')).toMatch(/\.rpc\('get_dispatch_board'\)/);
  });

  it('الوصولُ إليها: الشريطُ الجانبيّ وبطاقةُ «طلباتٌ بلا قبول»', () => {
    expect(read('src/app/admin/_components/AdminSidebar.tsx')).toMatch(/href: '\/admin\/dispatch'/);
    const cards = read('src/app/admin/_components/OpsHealthCards.tsx');
    expect(cards).toMatch(/ops-late-orders/);
    expect(cards).toMatch(/href="\/admin\/dispatch"/);
    expect(read('src/lib/admin/ops-health.ts')).toMatch(/\.lt\('created_at', lateSince\)/);
  });
});
