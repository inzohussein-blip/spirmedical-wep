import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AppointmentsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', user!.id)
    .order('scheduled_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch appointments:', error.message);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">حجوزاتي</h1>
          <p className="text-ink-3">جميع حجوزاتك في مكان واحد</p>
        </div>
        <Link href="/appointments/new">
          <Button>+ حجز جديد</Button>
        </Link>
      </div>

      {!appointments || appointments.length === 0 ? (
        <Card>
          <div className="py-16 text-center">
            <p className="mb-4 text-ink-3">لا توجد حجوزات بعد</p>
            <Link href="/appointments/new">
              <Button variant="secondary">احجز أول خدمة لك</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {appointments.map((apt) => (
            <Card key={apt.id} className="transition-all hover:shadow-md">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-extrabold">{apt.service_type}</h3>
                  <p className="mt-1 text-sm text-ink-3">
                    📅 {formatDateTime(apt.scheduled_at)}
                  </p>
                  <p className="mt-1 text-sm text-ink-3">
                    📍 {apt.address}
                  </p>
                  {apt.notes && (
                    <p className="mt-2 text-sm text-ink-2">{apt.notes}</p>
                  )}
                </div>
                <StatusBadge status={apt.status} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
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
