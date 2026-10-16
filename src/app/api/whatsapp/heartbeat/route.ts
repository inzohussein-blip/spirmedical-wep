import { NextResponse } from 'next/server';
import { getWaVerifyConfig, recordHeartbeat, verifySignature } from '@/lib/whatsapp/inbound-verify';

/**
 * POST /api/whatsapp/heartbeat — نبضةُ البوّابة كلَّ دقيقة (`{ connected, detail }`).
 * غيابُها دقيقتين يُخفي زرَّ واتساب (`isWaVerifyAvailable`) ويظهر في صحّة التشغيل.
 */
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const cfg = getWaVerifyConfig();
  if (!cfg.secret) return NextResponse.json({ error: 'disabled' }, { status: 503 });

  const raw = await request.text();
  const ok = verifySignature(
    cfg.secret,
    request.headers.get('x-spir-timestamp'),
    request.headers.get('x-spir-signature'),
    raw,
  );
  if (!ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: { connected?: unknown; detail?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  const detail = body.detail && typeof body.detail === 'object' ? (body.detail as Record<string, unknown>) : {};
  await recordHeartbeat('baileys', body.connected === true, detail);
  return NextResponse.json({ ok: true, mode: cfg.mode });
}
