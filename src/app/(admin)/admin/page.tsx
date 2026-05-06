import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { formatDateTime } from '@/lib/utils';

export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // التحقق من دور الأدمن (إضافي للـ middleware)
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user!.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  // إحصاءات عامة
  const { count: usersCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  const { count: appointmentsCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true });

  const { count: pendingCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  // آخر ١٠ حجوزات على المنصة
  const { data: recentAppointments } = await supabase
    .from('appointments')
    .select('*, users!inner(full_name, phone)')
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <div className="space-y-8">
      <div>
        <span className="inline-block rounded-full bg-amber px-3 py-1 text-xs font-bold text-paper-3">
          🔒 لوحة الإدارة
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">إدارة المنصة</h1>
        <p className="text-ink-3">نظرة عامة على نشاط سباير ميديكال</p>
      </div>

      {/* الإحصاءات العامة */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm font-bold text-ink-3">إجمالي المستخدمين</p>
          <p className="mt-2 text-4xl font-extrabold text-emerald">
            {(usersCount ?? 0).toLocaleString('ar-IQ')}
          </p>
        </Card>
        <Card>
          <p className="text-sm font-bold text-ink-3">إجمالي الحجوزات</p>
          <p className="mt-2 text-4xl font-extrabold text-amber">
            {(appointmentsCount ?? 0).toLocaleString('ar-IQ')}
          </p>
        </Card>
        <Card>
          <p className="text-sm font-bold text-ink-3">قيد الانتظار</p>
          <p className="mt-2 text-4xl font-extrabold text-rose">
            {(pendingCount ?? 0).toLocaleString('ar-IQ')}
          </p>
        </Card>
      </div>

      {/* آخر الحجوزات على المنصة */}
      <Card>
        <h2 className="mb-4 text-xl font-extrabold">آخر الحجوزات</h2>
        {!recentAppointments || recentAppointments.length === 0 ? (
          <p className="py-8 text-center text-ink-3">لا توجد حجوزات بعد</p>
        ) : (
          <div className="-mx-6 divide-y divide-ink/5">
            {recentAppointments.map((apt: any) => (
              <div key={apt.id} className="px-6 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-bold">{apt.service_type}</div>
                    <div className="text-sm text-ink-3">
                      {apt.users?.full_name ?? 'مستخدم'} ·{' '}
                      <span dir="ltr" className="font-mono">
                        {apt.users?.phone}
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
