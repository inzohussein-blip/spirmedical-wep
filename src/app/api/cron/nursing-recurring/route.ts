import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server-service';
import { logger } from '@/lib/logger';

/**
 * ═══════════════════════════════════════════════════════════════
 * 🔄 Cron: توليد المواعيد الدورية للتمريض (V25.6)
 * ═══════════════════════════════════════════════════════════════
 * يعمل يومياً (مرّة واحدة في 6 صباحاً)
 * يُنشئ المواعيد القادمة للكورسات الدورية المُفعّلة
 *
 * المنطق:
 *   1. يبحث عن طلبات appointments فيها recurring_schedule.enabled = true
 *   2. لو الطلب ضمن فترة الكورس (لم ينتهِ end_date)
 *   3. لو ما زال هناك مواعيد لازمة (حسب الفترة الزمنية)
 *   4. يُنشئ مواعيد جديدة تلقائياً
 * ═══════════════════════════════════════════════════════════════
 */

export const dynamic = 'force-dynamic';

interface RecurringSchedule {
  enabled: boolean;
  interval_hours: number;
  end_date?: string;
}

export async function GET(request: Request) {
  // ─── 1. تحقق من CRON_SECRET ───
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // fail-closed: بدون CRON_SECRET مضبوط ومطابق، المسار مرفوض (لا endpoint عام).
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    logger.warn('Unauthorized cron access');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  // ─── 2. جلب الطلبات الدورية المفعّلة ───
  const { data: recurringOrders, error } = await supabase
    .from('appointments')
    .select(`
      id, user_id, service_type, scheduled_at,
      address, notes, recurring_schedule,
      nurse_gender_preference, allergy_form, prescription_image_url,
      infectious_disease_alert,
      location_lat, location_lng,
      duration_minutes, status
    `)
    .not('recurring_schedule', 'is', null)
    .in('status', ['completed', 'confirmed'])
    .gte('scheduled_at', new Date(Date.now() - 7 * 86400000).toISOString());

  if (error) {
    logger.error('Failed to fetch recurring orders', { error: error.message });
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  let createdCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  // ─── 3. معالجة كل طلب ───
  for (const order of (recurringOrders || [])) {
    const schedule = order.recurring_schedule as RecurringSchedule | null;
    if (!schedule?.enabled) {
      skippedCount++;
      continue;
    }

    // هل انتهى الكورس؟
    if (schedule.end_date && schedule.end_date < today) {
      skippedCount++;
      continue;
    }

    try {
      // حساب الموعد القادم
      const lastScheduled = new Date(order.scheduled_at);
      const intervalMs = schedule.interval_hours * 60 * 60 * 1000;
      const nextScheduled = new Date(lastScheduled.getTime() + intervalMs);

      // لو الموعد القادم في المستقبل البعيد (>48 ساعة)، لا حاجة لإنشائه الآن
      if (nextScheduled.getTime() > now.getTime() + 48 * 60 * 60 * 1000) {
        skippedCount++;
        continue;
      }

      // لو الموعد القادم في الماضي البعيد (>24 ساعة)، تخطّاه
      if (nextScheduled.getTime() < now.getTime() - 24 * 60 * 60 * 1000) {
        skippedCount++;
        continue;
      }

      // تحقق ما إذا كان موجوداً مسبقاً
      const { data: existingNext } = await supabase
        .from('appointments')
        .select('id')
        .eq('user_id', order.user_id)
        .eq('service_type', order.service_type)
        .gte('scheduled_at', new Date(nextScheduled.getTime() - 30 * 60 * 1000).toISOString())
        .lte('scheduled_at', new Date(nextScheduled.getTime() + 30 * 60 * 1000).toISOString())
        .limit(1);

      if (existingNext && existingNext.length > 0) {
        skippedCount++;
        continue;
      }

      // ─── إنشاء الموعد الجديد ───
      const { error: insertError } = await supabase
        .from('appointments')
        .insert({
          user_id: order.user_id,
          service_type: order.service_type,
          scheduled_at: nextScheduled.toISOString(),
          address: order.address,
          notes: `${order.notes || ''}\n\n[🔄 موعد دوري] أُنشئ تلقائياً من جدولة كل ${schedule.interval_hours} ساعة`,
          duration_minutes: order.duration_minutes,
          status: 'pending',
          recurring_schedule: schedule,
          nurse_gender_preference: order.nurse_gender_preference,
          allergy_form: order.allergy_form,
          prescription_image_url: order.prescription_image_url,
          infectious_disease_alert: order.infectious_disease_alert,
          location_lat: order.location_lat,
          location_lng: order.location_lng,
          required_specialist_type: 'nurse',
        } as never);

      if (insertError) {
        errors.push(`Order ${order.id}: ${insertError.message}`);
      } else {
        createdCount++;
      }
    } catch (err) {
      errors.push(`Order ${order.id}: ${err instanceof Error ? err.message : 'unknown'}`);
    }
  }

  logger.info('Recurring nursing cron completed', {
    total: recurringOrders?.length || 0,
    created: createdCount,
    skipped: skippedCount,
    errors: errors.length,
  });

  return NextResponse.json({
    success: true,
    total: recurringOrders?.length || 0,
    created: createdCount,
    skipped: skippedCount,
    errors,
  });
}
