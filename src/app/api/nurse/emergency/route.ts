import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server-service';
import { sendPushToUsers } from '@/lib/services/push';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const emergencySchema = z.object({
  trigger_reason: z.string().trim().min(1, 'سبب الطوارئ مطلوب').max(200),
  description: z.string().trim().max(2000).optional(),
  orderId: z.string().uuid().optional().nullable(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  accuracy_m: z.number().min(0).max(100000).optional(),
});

/**
 * ═══════════════════════════════════════════════════════════════
 * POST /api/nurse/emergency
 * ═══════════════════════════════════════════════════════════════
 *
 * يستقبل طلب الطوارئ الأمني من الممرض داخل منزل المريض.
 * يُنبّه:
 *   - Call Center (admins)
 *   - يحفظ GPS
 *   - يُرسل Push لكل الـ admins
 * ═══════════════════════════════════════════════════════════════
 */

export async function POST(request: NextRequest) {
  const supabase = createClient();

  // ─── 1. تحقق من تسجيل الدخول ───
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'يجب تسجيل الدخول' },
      { status: 401 }
    );
  }

  // ─── 2. تحقق أنه أخصائي ───
  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'specialist') {
    return NextResponse.json(
      { error: 'هذه الميزة للكادر الطبي فقط' },
      { status: 403 }
    );
  }

  // ─── 2.5 حدّ المعدّل (منع إغراق التنبيهات) ───
  const rl = await checkRateLimit(`nurse:emergency:${user.id}`, {
    max: 10,
    windowSeconds: 300,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `طلبات كثيرة، حاول بعد ${rl.retryAfterSeconds} ثانية` },
      { status: 429 }
    );
  }

  // ─── 3. validate body (Zod) ───
  let raw;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = emergencySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || 'بيانات غير صالحة' },
      { status: 400 }
    );
  }
  const body = parsed.data;

  // ─── 4. سجّل في nurse_emergency_logs ───
  const serviceClient = createServiceClient();

  const { data: logEntry, error: logError } = await serviceClient
    .from('nurse_emergency_logs')
    .insert({
      specialist_id: user.id,
      appointment_id: body.orderId || null,
      trigger_reason: body.trigger_reason,
      description: body.description,
      latitude: body.latitude,
      longitude: body.longitude,
      accuracy_m: body.accuracy_m,
      status: 'open',
      contacted_911: false,
      call_center_notified: true,
    })
    .select()
    .single();

  if (logError) {
    logger.error('Nurse emergency log failed', {
      specialist_id: user.id,
      error: logError.message,
    });
    return NextResponse.json(
      { error: 'فشل حفظ السجل' },
      { status: 500 }
    );
  }

  // ─── 5. أرسل Push notifications للـ admins ───
  try {
    const { data: admins } = await serviceClient
      .from('users')
      .select('id')
      .in('role', ['admin', 'super_admin'])
      .limit(20);

    if (admins && admins.length > 0) {
      const adminIds = admins.map((a) => a.id);
      await sendPushToUsers(adminIds, {
        title: '🚨 طوارئ ممرض - استجابة فورية',
        body: `${profile.full_name || 'ممرض'} يحتاج مساعدة عاجلة - ${body.trigger_reason}`,
        url: `/admin44/emergencies/${logEntry.id}`,
        tag: `emergency-${logEntry.id}`,
        data: { urgent: true },
      });
    }
  } catch (err) {
    logger.error('Failed to notify admins', {
      error: err instanceof Error ? err.message : String(err),
    });
    // نتابع رغم ذلك - السجل محفوظ
  }

  // ─── 6. (مستقبلاً) إرسال SMS / WhatsApp / مكالمة آلية ───
  // TODO: تكامل مع Twilio أو ZeroSSL voice calls

  logger.warn('🚨 NURSE EMERGENCY TRIGGERED', {
    log_id: logEntry.id,
    specialist_id: user.id,
    specialist_name: profile.full_name,
    reason: body.trigger_reason,
    has_gps: !!(body.latitude && body.longitude),
  });

  return NextResponse.json({
    success: true,
    log_id: logEntry.id,
    message: 'تم تفعيل بروتوكول الطوارئ وتنبيه مركز العمليات',
  });
}
