import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server-service';
import { sendPushToUsers } from '@/lib/services/push';
import { logger } from '@/lib/logger';

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

  // ─── 3. validate body ───
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

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
    message: 'تم تفعيل بروتوكول الطوارئ - يتم التواصل معك الآن',
  });
}
