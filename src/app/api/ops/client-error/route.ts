import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { recordSystemError } from '@/lib/ops/system-errors';
import { isNoise } from '@/lib/ops/report-client-error';
import { clientIpFrom } from '@/lib/edge-proxy';

/**
 * POST /api/ops/client-error — خطأٌ في متصفّح مستخدم (رصدُ الأخطاء، 0057).
 *
 * غيرُ مُصادَق (الزائرُ أيضاً يتعطّل)، فهو محدودٌ: 10 لكلّ عنوان في 10 دقائق، وحقولٌ مقصوصة، وسقفُ
 * البصمات الجديدة في القاعدة (300/ساعة). يُجيب 204 دائماً تقريباً — المتصفّحُ لا يفعل شيئاً بالردّ.
 */
const schema = z.object({
  kind: z.enum(['error', 'unhandledrejection', 'boundary']),
  message: z.string().trim().min(1).max(500),
  stack: z.string().max(2000).optional(),
  digest: z.string().max(100).optional(),
  url: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return new NextResponse(null, { status: 400 });
  const { kind, message, stack, digest, url } = parsed.data;
  if (isNoise(message, stack)) return new NextResponse(null, { status: 204 });

  const ip = clientIpFrom(request.headers) ?? 'unknown';
  const rl = await checkRateLimit(`client-error:${ip}`, { max: 10, windowSeconds: 600 });
  if (!rl.allowed) return new NextResponse(null, { status: 429 });

  let userId: string | null = null;
  try {
    const { data } = await (await createClient()).auth.getUser();
    userId = data.user?.id ?? null;
  } catch { /* زائر */ }

  await recordSystemError({
    source: 'client',
    level: kind === 'boundary' ? 'error' : 'warning',
    message,
    path: url ?? null,
    detail: {
      kind,
      stack,
      digest,
      user_id: userId,
      ua: request.headers.get('user-agent')?.slice(0, 200) ?? null,
    },
  });
  return new NextResponse(null, { status: 204 });
}
