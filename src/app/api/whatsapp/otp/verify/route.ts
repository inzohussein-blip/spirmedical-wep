/**
 * POST /api/whatsapp/otp/verify
 * 
 * Body: { phone: string, code: string, purpose?: 'login' | 'verify_phone' | 'sensitive_action' | 'register' }
 * Response: { success: boolean, verified?: boolean, error?: string, remainingAttempts?: number }
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyOtp } from '@/lib/whatsapp/otp-service';
import { checkRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const verifySchema = z.object({
  phone: z.string().regex(/^(\+964|0)?7[0-9]{9}$/, 'رقم هاتف عراقي غير صحيح'),
  code: z.string().regex(/^\d{6}$/, 'الرمز يجب أن يكون 6 أرقام'),
  purpose: z.enum(['login', 'verify_phone', 'sensitive_action', 'register']).optional(),
});

export async function POST(request: Request) {
  try {
    const parsed = verifySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? 'مدخلات غير صحيحة' },
        { status: 400 }
      );
    }
    const { phone, code, purpose } = parsed.data;

    // ─── Rate limit حسب الـ IP (دفاع ضد التخمين عبر أرقام/رموز مختلفة) ───
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const rl = await checkRateLimit(`otp:verify:ip:${ip}`, { max: 20, windowSeconds: 900 });
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: `محاولات كثيرة، حاول بعد ${rl.retryAfterSeconds} ثانية` },
        { status: 429 }
      );
    }

    // ─── Verify OTP ───
    const result = await verifyOtp({
      phone,
      code,
      purpose: purpose || 'login',
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: result.error || 'رمز غير صحيح',
          remainingAttempts: result.remainingAttempts,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      verified: true,
      userId: result.userId,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[OTP/verify] Error:', err);
    return NextResponse.json(
      { success: false, error: 'خطأ في النظام' },
      { status: 500 }
    );
  }
}
