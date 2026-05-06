import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { formatDateTime } from '@/lib/utils';
import { logAuditEvent } from '@/lib/audit';

interface AppointmentWithUser {
  id: string;
  service_type: string;
  scheduled_at: string;
  status: string;
  created_at: string;
  user_full_name: string | null;
  user_phone: string;
}

export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // فحص الدور موثوق هنا لأن middleware + layout قد فلترا
  // لكن نسجّل كل وصول للوحة الإدارة
  await logAuditEvent({
    action: 'admin_dashboard_view',
    user_id: user!.id,
  });

  // إحصاءات
  const [usersResult, appointmentsResult, pendingResult, recentResult] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('appointments').select('*', { count: 'exact', head: true }),
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('appointments_with_users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const usersCount = usersResult.count ?? 0;
  const appointmentsCount = appointmentsResult.count ?? 0;
  const pendingCount = pendingResult.count ?? 0;
  const recentAppointments = (recentResult.data ?? []) as AppointmentWithUser[];

  return (
    <div className="space-y-8">
      <div>
        <span className="inline-block rounded-full bg-amber px-3 py-1 text-xs font-bold text-paper-3">
          🔒 لوحة الإدارة
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">إدارة المنصة</h1>
        <p className="text-ink-3">نظرة عامة على نشاط سباير ميديكال</p>
      </div>

      {/* الإحصاءات */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="إجمالي المستخدمين" value={usersCount} accent="emerald" />
        <StatCard label="إجمالي الحجوزات" value={appointmentsCount} accent="amber" />
        <StatCard label="قيد الانتظار" value={pendingCount} accent="rose" />
      </div>

      {/* آخر الحجوزات */}
      <Card>
        <h2 className="mb-4 text-xl font-extrabold">آخر الحجوزات</h2>
        {recentAppointments.length === 0 ? (
          <p className="py-8 text-center text-ink-3">لا توجد حجوزات بعد</p>
        ) : (
          <div className="-mx-6 divide-y divide-ink/5">
            {recentAppointments.map((apt) => (
              <div key={apt.id} className="px-6 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-bold">{apt.service_type}</div>
                    <div className="text-sm text-ink-3">
                      {apt.user_full_name ?? 'مستخدم'} ·{' '}
                      <span dir="ltr" className="font-mono">
                        {apt.user_phone}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-ink-3">
                    {formatDateTime(apt.scheduled_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: 'emerald' | 'amber' | 'rose';
}) {
  const colors = {
    emerald: 'text-emerald',
    amber: 'text-amber',
    rose: 'text-rose',
  };
  return (
    <Card>
      <p className="text-sm font-bold text-ink-3">{label}</p>
      <p className={`mt-2 text-4xl font-extrabold ${colors[accent]}`}>
        {value.toLocaleString('ar-IQ')}
      </p>
    </Card>
  );
}
