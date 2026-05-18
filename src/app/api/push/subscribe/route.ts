import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

/**
 * POST /api/push/subscribe
 *
 * يستقبل PushSubscription من المتصفح ويحفظها في DB
 *
 * Body:
 *   {
 *     endpoint: string,
 *     keys: { p256dh: string, auth: string },
 *     userAgent?: string
 *   }
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'يجب تسجيل الدخول' },
      { status: 401 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400 }
    );
  }

  // Validate
  if (
    !body.endpoint ||
    !body.keys?.p256dh ||
    !body.keys?.auth
  ) {
    return NextResponse.json(
      { error: 'بيانات الاشتراك غير مكتملة' },
      { status: 400 }
    );
  }

  // تحديد label للجهاز من user agent
  const userAgent = body.userAgent || request.headers.get('user-agent') || '';
  const deviceLabel = detectDeviceLabel(userAgent);

  // upsert (لو موجود endpoint بنفس الـ user، نُحدّثه)
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id: user.id,
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        user_agent: userAgent,
        device_label: deviceLabel,
        is_active: true,
        last_used_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,endpoint' }
    );

  if (error) {
    logger.error('Push subscribe failed', {
      user_id: user.id,
      error: error.message,
    });
    return NextResponse.json(
      { error: 'فشل حفظ الاشتراك' },
      { status: 500 }
    );
  }

  logger.info('Push subscription saved', {
    user_id: user.id,
    device: deviceLabel,
  });

  return NextResponse.json({ success: true });
}

function detectDeviceLabel(ua: string): string {
  const lower = ua.toLowerCase();
  let device = 'جهاز غير معروف';
  let browser = '';

  // Device
  if (/iphone/.test(lower)) device = 'iPhone';
  else if (/ipad/.test(lower)) device = 'iPad';
  else if (/android/.test(lower)) device = 'Android';
  else if (/windows/.test(lower)) device = 'Windows';
  else if (/mac/.test(lower)) device = 'Mac';

  // Browser
  if (/edg\//.test(lower)) browser = 'Edge';
  else if (/chrome/.test(lower)) browser = 'Chrome';
  else if (/safari/.test(lower)) browser = 'Safari';
  else if (/firefox/.test(lower)) browser = 'Firefox';

  return browser ? `${device} · ${browser}` : device;
}
