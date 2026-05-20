// ═══════════════════════════════════════════════════════════════
// 📊 Admin: Analytics Dashboard (V25.11)
// ═══════════════════════════════════════════════════════════════
// عرض إحصائيات الأحداث من analytics_events
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AnalyticsClient from './AnalyticsClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Analytics - Admin' };

interface EventStat {
  event_name: string;
  total: number;
  unique_users: number;
}

interface DailyStat {
  event_date: string;
  total: number;
  unique_users: number;
}

export default async function AdminAnalyticsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) redirect('/dashboard');

  // ─── جلب الإحصائيات (آخر 30 يوم) ───
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // إحصائيات لكل حدث
  const { data: events } = await supabase
    .from('analytics_events')
    .select('event_name, user_id')
    .gte('created_at', thirtyDaysAgo);

  // تجميع
  const eventStats: Record<string, { total: number; users: Set<string> }> = {};
  (events || []).forEach((e) => {
    if (!eventStats[e.event_name]) {
      eventStats[e.event_name] = { total: 0, users: new Set() };
    }
    eventStats[e.event_name].total++;
    if (e.user_id) eventStats[e.event_name].users.add(e.user_id);
  });

  const stats: EventStat[] = Object.entries(eventStats)
    .map(([name, data]) => ({
      event_name: name,
      total: data.total,
      unique_users: data.users.size,
    }))
    .sort((a, b) => b.total - a.total);

  // إحصائيات الأسبوع الماضي - بالأيام
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentEvents } = await supabase
    .from('analytics_events')
    .select('event_name, user_id, created_at')
    .gte('created_at', sevenDaysAgo);

  // تجميع لكل يوم
  const dailyMap: Record<string, { total: number; users: Set<string> }> = {};
  (recentEvents || []).forEach((e) => {
    const date = new Date(e.created_at).toISOString().split('T')[0];
    if (!dailyMap[date]) {
      dailyMap[date] = { total: 0, users: new Set() };
    }
    dailyMap[date].total++;
    if (e.user_id) dailyMap[date].users.add(e.user_id);
  });

  const daily: DailyStat[] = Object.entries(dailyMap)
    .map(([date, data]) => ({
      event_date: date,
      total: data.total,
      unique_users: data.users.size,
    }))
    .sort((a, b) => a.event_date.localeCompare(b.event_date));

  // إحصائيات عامة
  const [
    { count: totalUsers },
    { count: totalAppointments },
    { count: totalConsultations },
    { count: totalDoctors },
    { count: activeSubscriptions },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('appointments').select('*', { count: 'exact', head: true }),
    supabase.from('consultations').select('*', { count: 'exact', head: true }),
    supabase.from('doctors').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('doctor_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
  ]);

  return (
    <AnalyticsClient
      stats={stats}
      daily={daily}
      totals={{
        users: totalUsers ?? 0,
        appointments: totalAppointments ?? 0,
        consultations: totalConsultations ?? 0,
        doctors: totalDoctors ?? 0,
        subscriptions: activeSubscriptions ?? 0,
        events: events?.length ?? 0,
      }}
    />
  );
}
