import { NextResponse } from 'next/server';
import { getWaVerifyConfig, handleInboundMessage, verifySignature } from '@/lib/whatsapp/inbound-verify';

/**
 * POST /api/whatsapp/inbound — رسالةٌ واردة من بوّابة Baileys (Railway).
 *
 * موقَّعٌ بـHMAC (`x-spir-timestamp` + `x-spir-signature`) بسرٍّ مشترك: البوّابةُ لا تحمل
 * مفتاحَ قاعدة، فإن اختُرقت لا يُكشف إلّا هذا السرّ (يُبدَّل). المنطقُ في `inbound-verify`.
 * Meta تصل عبر `/api/whatsapp/webhook` إلى الدالّة نفسها.
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

  // المفتاحُ مطفأ: تُستلم الرسالةُ ولا تُعالَج (البوّابةُ لا تعيد المحاولة)
  if (cfg.mode === 'off' || cfg.provider !== 'baileys') {
    return NextResponse.json({ result: 'disabled' });
  }

  let body: { from?: string; text?: string };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  const result = await handleInboundMessage({ from: body.from, text: body.text, provider: 'baileys' });
  return NextResponse.json({ result });
}
