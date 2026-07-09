import { NextResponse, type NextRequest } from 'next/server';
import { processNotificationQueue } from '@/lib/notifications-processor';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Vercel: max 60s

/**
 * معالجة طابور الإشعارات.
 *
 * المصادقة: `x-cron-secret` / `?secret=` أو Authorization: Bearer $CRON_SECRET.
 *
 * ملاحظة مهمّة: Vercel Cron يستدعي المسار بـ **GET**، لذا تعالج GET الطابور أيضاً
 * (كان السابق GET = فحص صحّة فقط، فالكرون اليومي لم يكن يعالج شيئاً إطلاقاً).
 * كما يستعمل المعالج service client (RLS يحجب anon تحت الكرون).
 */
function authorize(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // fail-closed
  const headerSecret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret');
  const authHeader = req.headers.get('authorization');
  return authHeader === `Bearer ${secret}` || headerSecret === secret;
}

async function handle(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const result = await processNotificationQueue(100);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ...result, timestamp: new Date().toISOString() });
}

export async function POST(req: NextRequest) {
  return handle(req);
}

export async function GET(req: NextRequest) {
  return handle(req);
}
