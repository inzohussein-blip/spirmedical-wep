import { NextResponse, type NextRequest } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * 🚨 بريدٌ للمالك حين يتعطّل عملٌ مُجدوَل.
 *
 * في 25 أيلول فشلت رسائلُ واتساب كلُّها بـ«Authentication Error»، ولم يعلم
 * أحدٌ إلّا بقراءة الطابور يدويّاً. الكرون يعمل مرّةً في اليوم، فبريدٌ عند كلّ
 * عطلٍ لا يُغرق أحداً — وصمتٌ عند السلامة.
 *
 * عبر Resend مباشرةً بنصٍّ عاديّ (لا قوالب `sendEmail`: تنبيهُ تشغيلٍ لا رسالةُ
 * مستخدم). لا يرمي أبداً، ويصمت إن غاب `RESEND_API_KEY` أو `ADMIN_OWNER_EMAIL`
 * — التنبيهُ لا يجوز أن يُسقط العملَ الذي ينبّه عنه.
 */
export async function alertOwner(subject: string, lines: string[]): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_OWNER_EMAIL;
  if (!apiKey || !to) {
    logger.warn('[alertOwner] not configured — alert not emailed', { subject });
    return false;
  }
  const from = process.env.RESEND_FROM_EMAIL || 'noreply@spir-medical.com';
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `Spir Medical Ops <${from}>`,
        to,
        subject: `[Spir] ${subject}`,
        text: [...lines, '', `الوقت: ${new Date().toISOString()}`].join('\n'),
      }),
    });
    if (!res.ok) logger.error('[alertOwner] resend rejected', { status: res.status });
    return res.ok;
  } catch (err) {
    logger.error('[alertOwner] send failed', { error: err instanceof Error ? err.message : String(err) });
    return false;
  }
}

type Handler = (req: NextRequest) => Promise<Response>;

/**
 * يلفّ مسارَ كرون: استجابةُ 5xx أو استثناءٌ مرميّ → بريدٌ للمالك.
 * 401 (سرٌّ خاطئ) ليس عطلاً في العمل فلا يُنبَّه عنه.
 */
export function withCronAlert(name: string, handler: Handler): Handler {
  return async (req) => {
    try {
      const res = await handler(req);
      if (res.status >= 500) {
        let detail = '';
        try { detail = (await res.clone().text()).slice(0, 500); } catch { /* ignore */ }
        await alertOwner(`فشل الكرون ${name}`, [`المسار: ${req.nextUrl.pathname}`, `الحالة: ${res.status}`, `التفاصيل: ${detail}`]);
      }
      return res;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await alertOwner(`انهار الكرون ${name}`, [`المسار: ${req.nextUrl.pathname}`, `الخطأ: ${message}`]);
      logger.error('cron crashed', { name, error: message });
      return NextResponse.json({ error: 'cron_crashed' }, { status: 500 });
    }
  };
}
