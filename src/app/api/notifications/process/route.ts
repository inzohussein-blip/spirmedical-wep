import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendWhatsApp } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Vercel: max 60s

/**
 * POST /api/notifications/process
 *
 * يقرأ من notification_queue ويرسل الرسائل المستحقة.
 *
 * المصادقة: عبر header `x-cron-secret` أو Vercel Cron Authorization.
 *
 * يُستدعى:
 * 1. عبر Vercel Cron Job كل دقيقة (vercel.json)
 * 2. يدوياً من admin بـ POST عادي
 *
 * Returns: { processed, succeeded, failed }
 */
export async function POST(req: NextRequest) {
  // === Authentication ===
  const cronSecret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret');
  const authHeader = req.headers.get('authorization');

  const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  const hasValidSecret = cronSecret && cronSecret === process.env.CRON_SECRET;

  if (!isVercelCron && !hasValidSecret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = createClient();
  const now = new Date().toISOString();

  // === جلب الرسائل المستحقة ===
  // pending + scheduled_for <= now + attempts < max_attempts
  // limit: 20 في كل دفعة (لتجنب timeout)
  const { data: messages, error: fetchError } = await supabase
    .from('notification_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', now)
    .lt('attempts', 3)
    .order('scheduled_for', { ascending: true })
    .limit(20);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!messages || messages.length === 0) {
    return NextResponse.json({ processed: 0, succeeded: 0, failed: 0 });
  }

  let succeeded = 0;
  let failed = 0;

  // === معالجة كل رسالة ===
  for (const msg of messages) {
    // علّمها كـ "sending" أولاً (atomic update)
    const { data: claimedRow } = await supabase
      .from('notification_queue')
      .update({
        status: 'sending',
        attempts: msg.attempts + 1,
      })
      .eq('id', msg.id)
      .eq('status', 'pending')  // فقط لو ما زالت pending
      .select('id')
      .single();

    if (!claimedRow) continue; // أحد آخر سبقنا

    // إرسل حسب القناة
    let sendResult: { ok: boolean; messageId?: string; error?: string; provider?: string };

    if (msg.channel === 'whatsapp') {
      sendResult = await sendWhatsApp({
        to: msg.recipient_phone,
        body: msg.body,
      });
    } else {
      // SMS و Push لاحقاً
      sendResult = {
        ok: false,
        error: `channel ${msg.channel} not implemented`,
      };
    }

    // حدّث الحالة
    if (sendResult.ok) {
      await supabase
        .from('notification_queue')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          provider: sendResult.provider ?? null,
          provider_message_id: sendResult.messageId ?? null,
        })
        .eq('id', msg.id);

      succeeded++;
    } else {
      const isMaxReached = msg.attempts + 1 >= msg.max_attempts;

      await supabase
        .from('notification_queue')
        .update({
          status: isMaxReached ? 'failed' : 'pending',
          failed_at: isMaxReached ? new Date().toISOString() : null,
          error_message: sendResult.error?.substring(0, 500) ?? 'unknown',
          provider: sendResult.provider ?? null,
        })
        .eq('id', msg.id);

      failed++;
    }
  }

  return NextResponse.json({
    processed: messages.length,
    succeeded,
    failed,
    timestamp: new Date().toISOString(),
  });
}

/**
 * GET للـ health check
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    info: 'POST to this endpoint to process the notification queue',
    provider: process.env.WHATSAPP_PROVIDER ?? 'mock',
  });
}
