/**
 * /api/whatsapp/webhook — OTP Edition
 * 
 * GET  → verification challenge من Meta (مرة واحدة عند setup)
 * POST → معالجة delivery status فقط (sent/delivered/read/failed)
 * 
 * 🔧 نسخة مُبسّطة: لا تعالج رسائل واردة من المرضى (للـ Bot لاحقاً)
 */

import { NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/whatsapp/meta-client';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════════════════
// GET: Verification challenge من Meta
// ═══════════════════════════════════════════════════════════════════
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const expectedToken = process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === expectedToken) {
    return new Response(challenge, { status: 200 });
  }

  return new Response('Forbidden', { status: 403 });
}

// ═══════════════════════════════════════════════════════════════════
// POST: Events من Meta
// ═══════════════════════════════════════════════════════════════════
export async function POST(request: Request) {
  // ─── 1. Verify signature ───
  const rawBody = await request.text();
  const signature = request.headers.get('x-hub-signature-256');

  if (!verifyWebhookSignature(rawBody, signature)) {
    console.warn('[Webhook] Invalid signature');
    return new Response('Unauthorized', { status: 401 });
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  // ─── 2. تحقق من الـ structure ───
  if (body.object !== 'whatsapp_business_account') {
    return NextResponse.json({ ok: true }); // ignore
  }

  // ─── 3. عالج status updates فقط ───
  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== 'messages') continue;

      const value = change.value;

      // معالجة status updates (sent/delivered/read/failed)
      if (value.statuses?.length) {
        for (const status of value.statuses) {
          try {
            await processStatusUpdate(status);
          } catch (err) {
            console.error('[Webhook] Error processing status:', err);
          }
        }
      }

      // ملاحظة: الرسائل الواردة (value.messages) تُتجاهل حالياً
      // ستُعالج عند إضافة البوت في مرحلة مستقبلية
      if (value.messages?.length) {
        console.warn(
          `[Webhook] Received ${value.messages.length} message(s) - bot not enabled yet`
        );
      }
    }
  }

  // Meta يتوقع 200 OK خلال 5 ثوانٍ
  return NextResponse.json({ ok: true });
}

// ═══════════════════════════════════════════════════════════════════
// 📊 معالجة status update
// ═══════════════════════════════════════════════════════════════════
async function processStatusUpdate(status: any): Promise<void> {
  const supabase = createClient();
  const messageId = status.id;
  const newStatus = status.status; // sent | delivered | read | failed

  const timestamp = status.timestamp
    ? new Date(parseInt(status.timestamp) * 1000).toISOString()
    : new Date().toISOString();

  // حدّث الـ whatsapp_otp
  const otpUpdates: Record<string, any> = {};

  if (newStatus === 'delivered') {
    otpUpdates.delivered_at = timestamp;
  } else if (newStatus === 'read') {
    otpUpdates.read_at = timestamp;
    if (!otpUpdates.delivered_at) {
      otpUpdates.delivered_at = timestamp;
    }
  } else if (newStatus === 'failed') {
    otpUpdates.status = 'failed';
  }

  if (Object.keys(otpUpdates).length > 0) {
    await supabase
      .from('whatsapp_otp')
      .update(otpUpdates)
      .eq('provider_message_id', messageId);
  }

  // حدّث الـ notification_queue إذا موجود
  const notifUpdates: Record<string, any> = {};

  if (newStatus === 'delivered' || newStatus === 'read') {
    notifUpdates.status = 'sent';
    notifUpdates.sent_at = timestamp;
  } else if (newStatus === 'failed') {
    notifUpdates.status = 'failed';
    notifUpdates.failed_at = new Date().toISOString();
    notifUpdates.error_message = status.errors?.[0]?.message;
  }

  if (Object.keys(notifUpdates).length > 0) {
    await supabase
      .from('notification_queue')
      .update(notifUpdates)
      .eq('provider_message_id', messageId);
  }
}
