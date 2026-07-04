/**
 * POST /api/whatsapp/otp/send
 * 
 * Body: { phone: string, channel: 'whatsapp' | 'telegram' | 'sms', purpose?: string }
 * Response: { success: boolean, expiresAt?: string, error?: string }
 */

import { NextResponse } from 'next/server';
import { sendOtp, type OtpChannel, type OtpPurpose } from '@/lib/whatsapp/otp-service';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, channel, purpose } = body as {
      phone: string;
      channel: OtpChannel;
      purpose?: OtpPurpose;
    };

    // ─── Validation ───
    if (!phone || !channel) {
      return NextResponse.json(
        { success: false, error: 'phone و channel مطلوبان' },
        { status: 400 }
      );
    }

    if (!['whatsapp', 'telegram', 'sms'].includes(channel)) {
      return NextResponse.json(
        { success: false, error: 'channel غير مدعوم' },
        { status: 400 }
      );
    }

    // ─── Rate limit حسب الـ IP (فوق الحدّ لكل رقم داخل الخدمة) ───
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const rl = await checkRateLimit(`otp:send:ip:${ip}`, {
      max: 10,
      windowSeconds: 900,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `محاولات كثيرة، حاول بعد ${rl.retryAfterSeconds} ثانية`,
        },
        { status: 429 }
      );
    }

    // ─── Get current user (لو مسجّل دخوله) ───
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // ─── Extract IP/UA ───
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // ─── Send OTP ───
    const result = await sendOtp({
      phone,
      channel,
      userId: user?.id,
      purpose: purpose || 'login',
      ipAddress,
      userAgent,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    // لا نُرجع otpId للأمان
    return NextResponse.json({
      success: true,
      channel: result.channel,
      expiresAt: result.expiresAt,
    });
  } catch (err) {
    logger.error('OTP send route error', {
      error: err instanceof Error ? err.message : 'unknown',
    });
    return NextResponse.json(
      { success: false, error: 'خطأ في النظام' },
      { status: 500 }
    );
  }
}
