import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * POST /api/analytics/track
 * استقبال الأحداث وحفظها في DB
 *
 * Body: { event: string, properties?: object, timestamp?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, properties } = body;

    if (!event || typeof event !== 'string') {
      return NextResponse.json({ error: 'event required' }, { status: 400 });
    }

    // ─── Rate limit حسب الـ IP (منع إغراق DB — endpoint غير مُصادق) ───
    const forwardedForRl = request.headers.get('x-forwarded-for');
    const rlIp = forwardedForRl
      ? forwardedForRl.split(',')[0].trim()
      : request.headers.get('x-real-ip') || 'unknown';
    const rl = await checkRateLimit(`analytics:${rlIp}`, {
      max: 120,
      windowSeconds: 60,
    });
    if (!rl.allowed) {
      // فشل صامت — لا نُعطّل التطبيق بسبب التحليلات
      return NextResponse.json({ ok: false }, { status: 429 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // ─── جلب IP + UA ───
    const userAgent = request.headers.get('user-agent') || null;
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : null;

    // ─── حفظ ───
    await (supabase as unknown as {
      from: (t: string) => { insert: (d: Record<string, unknown>) => Promise<unknown> }
    })
      .from('analytics_events')
      .insert({
        event_name: event,
        user_id: user?.id ?? null,
        session_id: (properties?.session_id as string) ?? null,
        properties: properties ?? null,
        user_agent: userAgent,
        ip_address: ipAddress,
      });

    return NextResponse.json({ ok: true }, { status: 204 });
  } catch {
    // Fail silently - analytics shouldn't break the app
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
