'use server';

import { createClient } from '@/lib/supabase/server';
import { isAdminRole } from '@/lib/admin-types';
import { logAdminAction } from '@/lib/admin-audit';
import { toCSV } from '@/lib/csv-export';
import { SPECIALIST_META } from '@/lib/specialist-types';

async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'unauthorized' };

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!isAdminRole(profile?.role)) return { ok: false as const, error: 'forbidden' };
  return { ok: true as const, supabase };
}

/**
 * تصدير قائمة المرضى كـ CSV
 */
export async function exportPatientsCSV(): Promise<{ ok: true; csv: string; filename: string } | { ok: false; error: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { data: patients } = await auth.supabase
    .from('users')
    .select('full_name, phone, email, governorate, created_at, is_suspended')
    .eq('role', 'patient')
    .order('created_at', { ascending: false });

  await logAdminAction({
    action_type: 'export_report',
    target_type: 'patients',
    details: { count: patients?.length ?? 0 },
  });

  const csv = toCSV(patients ?? [], [
    { key: 'full_name', label: 'الاسم' },
    { key: 'phone', label: 'الهاتف' },
    { key: 'email', label: 'البريد' },
    { key: 'governorate', label: 'المحافظة' },
    { key: 'created_at', label: 'تاريخ التسجيل' },
    { key: 'is_suspended', label: 'معلّق' },
  ]);

  return {
    ok: true,
    csv,
    filename: `patients-${new Date().toISOString().slice(0, 10)}.csv`,
  };
}

/**
 * تصدير قائمة الاختصاصيين
 */
export async function exportSpecialistsCSV(): Promise<{ ok: true; csv: string; filename: string } | { ok: false; error: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { data: specialists } = await auth.supabase
    .from('users')
    .select('full_name, phone, email, governorate, specialist_type, approval_status, specialist_years_exp, created_at')
    .eq('role', 'specialist')
    .order('created_at', { ascending: false });

  await logAdminAction({
    action_type: 'export_report',
    target_type: 'specialists',
    details: { count: specialists?.length ?? 0 },
  });

  const rows = (specialists ?? []).map((s) => ({
    ...s,
    specialist_type_label: s.specialist_type ? SPECIALIST_META[s.specialist_type as keyof typeof SPECIALIST_META]?.label : '',
  }));

  const csv = toCSV(rows, [
    { key: 'full_name', label: 'الاسم' },
    { key: 'phone', label: 'الهاتف' },
    { key: 'email', label: 'البريد' },
    { key: 'specialist_type_label', label: 'الاختصاص' },
    { key: 'governorate', label: 'المحافظة' },
    { key: 'specialist_years_exp', label: 'سنوات الخبرة' },
    { key: 'approval_status', label: 'الحالة' },
    { key: 'created_at', label: 'تاريخ التسجيل' },
  ]);

  return {
    ok: true, csv,
    filename: `specialists-${new Date().toISOString().slice(0, 10)}.csv`,
  };
}

/**
 * تصدير الطلبات في فترة محددة
 */
export async function exportOrdersCSV(fromDate: string, toDate: string): Promise<{ ok: true; csv: string; filename: string } | { ok: false; error: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { data: orders } = await auth.supabase
    .from('appointments')
    .select(`
      id, service_type, scheduled_at, status, address, created_at,
      required_specialist_type, user_id, assigned_specialist_id
    `)
    .gte('created_at', fromDate)
    .lte('created_at', `${toDate}T23:59:59`)
    .order('created_at', { ascending: false });

  // أسماء المستخدمين
  const userIds = Array.from(new Set([
    ...(orders ?? []).map((o) => o.user_id),
    ...(orders ?? []).map((o) => o.assigned_specialist_id).filter(Boolean) as string[],
  ]));

  const { data: usersData } = userIds.length > 0
    ? await auth.supabase.from('users').select('id, full_name, phone').in('id', userIds)
    : { data: [] };

  const usersMap = new Map((usersData ?? []).map((u) => [u.id, u]));

  await logAdminAction({
    action_type: 'export_report',
    target_type: 'orders',
    details: { count: orders?.length ?? 0, from: fromDate, to: toDate },
  });

  const rows = (orders ?? []).map((o) => {
    const patient = usersMap.get(o.user_id);
    const specialist = o.assigned_specialist_id ? usersMap.get(o.assigned_specialist_id) : null;
    return {
      id: o.id.slice(0, 8),
      service_type: o.service_type,
      patient_name: patient?.full_name ?? '',
      patient_phone: patient?.phone ?? '',
      specialist_name: specialist?.full_name ?? '',
      scheduled_at: o.scheduled_at,
      status: o.status,
      address: o.address ?? '',
      required_type: o.required_specialist_type ?? '',
    };
  });

  const csv = toCSV(rows, [
    { key: 'id', label: 'الرقم' },
    { key: 'service_type', label: 'الخدمة' },
    { key: 'patient_name', label: 'اسم المريض' },
    { key: 'patient_phone', label: 'هاتف المريض' },
    { key: 'specialist_name', label: 'الاختصاصي' },
    { key: 'scheduled_at', label: 'موعد الجلسة' },
    { key: 'status', label: 'الحالة' },
    { key: 'address', label: 'العنوان' },
    { key: 'required_type', label: 'النوع المطلوب' },
  ]);

  return {
    ok: true, csv,
    filename: `orders-${fromDate}-to-${toDate}.csv`,
  };
}
