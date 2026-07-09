import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * POST /api/analytics/track
 * استقبال الأحداث وحفظها في DB
 *
 * Body: { event: string, properties?: object, timestamp?: number }
 */
const trackSchema = z.object({
  event: z.string().trim().min(1).max(100),
  // نحدّ حجم الخصائص (منع تخزين JSON ضخم من مصدر غير مُصادق)
  properties: z.record(z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const parsed = trackSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
    }
    const { event, properties } = parsed.data;

    // حدّ حجم الخصائص المسلسلة (≤ 8KB)
    if (properties && JSON.stringify(properties).length > 8192) {
      return NextResponse.json({ error: 'properties too large' }, { status: 400 });
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
    await supabase
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
