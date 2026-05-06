import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { formatDateTime } from '@/lib/utils';

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // إحصاءات
  const { count: totalCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id);

  const { count: upcomingCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .in('status', ['pending', 'confirmed'])
    .gte('scheduled_at', new Date().toISOString());

  const { count: completedCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .eq('status', 'completed');

  // آخر ٥ حجوزات
  const { data: recent } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', user!.id)
    .order('scheduled_at', { ascending: false })
    .limit(5);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">لوحة التحكم</h1>
          <p className="text-ink-3">مرحباً بعودتك إلى سباير ميديكال</p>
        </div>
        <Link href="/appointments/new">
          <Button>+ حجز جديد</Button>
        </Link>
      </div>

      {/* الإحصاءات */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="إجمالي الحجوزات" value={totalCount ?? 0} accent="emerald" />
        <StatCard label="الحجوزات القادمة" value={upcomingCount ?? 0} accent="amber" />
        <StatCard label="الحجوزات المكتملة" value={completedCount ?? 0} accent="rose" />
      </div>

      {/* الحجوزات الأخيرة */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-extrabold">آخر الحجوزات</h2>
          <Link href="/appointments" className="text-sm font-bold text-emerald hover:underline">
            عرض الكل ←
          </Link>
        </div>
        <CardContent>
          {!recent || recent.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-ink-3">لا توجد حجوزات بعد</p>
              <Link href="/appointments/new" className="mt-4 inline-block">
                <Button variant="secondary">احجز أول خدمة لك</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-ink/5">
              {recent.map((apt) => (
                <Link
                  key={apt.id}
                  href={`/appointments/${apt.id}`}
                  className="-mx-6 flex items-center justify-between px-6 py-4 hover:bg-paper-2"
                >
                  <div>
                    <div className="font-bold">{apt.service_type}</div>
                    <div className="text-sm text-ink-3">
                      {formatDateTime(apt.scheduled_at)}
                    </div>
                  </div>
                  <StatusBadge status={apt.status} />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    pending: { label: 'قيد الانتظار', className: 'bg-amber-soft text-amber' },
    confirmed: { label: 'مؤكّد', className: 'bg-emerald-soft text-emerald' },
    in_progress: { label: 'قيد التنفيذ', className: 'bg-amber-soft text-amber' },
    completed: { label: 'مكتمل', className: 'bg-emerald-soft text-emerald' },
    cancelled: { label: 'ملغى', className: 'bg-rose-soft text-rose' },
  };
  const item = map[status] ?? { label: status, className: 'bg-paper-2 text-ink-3' };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${item.className}`}>
      {item.label}
    </span>
  );
}
