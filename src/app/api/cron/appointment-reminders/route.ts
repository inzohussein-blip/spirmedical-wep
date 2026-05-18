import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server-service';
import { notifyAppointmentReminder } from '@/lib/services/push-templates';
import { logger } from '@/lib/logger';

/**
 * ═══════════════════════════════════════════════════════════════
 * Vercel Cron: تذكيرات المواعيد (V25.3)
 * ═══════════════════════════════════════════════════════════════
 *
 * يعمل كل 15 دقيقة:
 *   ابحث عن مواعيد بعد ساعة (نافذة 50-70 دقيقة)
 *   أرسل push reminder للمريض
 *
 * Setup في vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/appointment-reminders",
 *     "schedule": "*\u2009/15 * * * *"
 *   }]
 * }
 *
 * Authentication: يتحقق من CRON_SECRET header
 * ═══════════════════════════════════════════════════════════════
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // 1. التحقق من Vercel Cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServiceClient();

    // 2. ابحث عن مواعيد خلال 50-70 دقيقة (نافذة ±10 من ساعة قادمة)
    const now = new Date();
    const lowerBound = new Date(now.getTime() + 50 * 60 * 1000);
    const upperBound = new Date(now.getTime() + 70 * 60 * 1000);

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(
        'id, user_id, service_type, scheduled_at, status, reminder_sent_at'
      )
      .gte('scheduled_at', lowerBound.toISOString())
      .lte('scheduled_at', upperBound.toISOString())
      .in('status', ['confirmed', 'pending'])
      .is('reminder_sent_at', null);

    if (error) {
      logger.error('Cron: failed to fetch appointments', {
        error: error.message,
      });
      return NextResponse.json(
        { error: 'Failed to fetch appointments' },
        { status: 500 }
      );
    }

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        message: 'No appointments to remind',
      });
    }

    // 3. أرسل push لكل موعد
    let sent = 0;
    let failed = 0;

    await Promise.all(
      appointments.map(async (appt) => {
        try {
          const scheduledAt = new Date(appt.scheduled_at);
          const minutesUntil = Math.round(
            (scheduledAt.getTime() - now.getTime()) / (60 * 1000)
          );

          await notifyAppointmentReminder(appt.user_id, {
            orderId: appt.id,
            serviceName: appt.service_type,
            minutesBefore: minutesUntil,
          });

          // وضع علامة "تم إرسال التذكير"
          await supabase
            .from('appointments')
            .update({ reminder_sent_at: now.toISOString() } as never)
            .eq('id', appt.id);

          sent++;
        } catch (err) {
          failed++;
          logger.error('Cron: reminder failed', {
            appointment_id: appt.id,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      })
    );

    logger.info('Cron: appointment reminders sent', {
      total: appointments.length,
      sent,
      failed,
    });

    return NextResponse.json({
      success: true,
      total: appointments.length,
      sent,
      failed,
    });
  } catch (err) {
    logger.error('Cron: unexpected error', {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
