/**
 * POST /api/whatsapp/otp/verify
 * 
 * Body: { phone: string, code: string, purpose?: 'login' | 'verify_phone' | 'sensitive_action' | 'register' }
 * Response: { success: boolean, verified?: boolean, error?: string, remainingAttempts?: number }
 */

import { NextResponse } from 'next/server';
import { verifyOtp, type OtpPurpose } from '@/lib/whatsapp/otp-service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, code, purpose } = body as {
      phone: string;
      code: string;
      purpose?: OtpPurpose;
    };

    // ─── Validation ───
    if (!phone || !code) {
      return NextResponse.json(
        { success: false, error: 'phone و code مطلوبان' },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { success: false, error: 'الرمز يجب أن يكون 6 أرقام' },
        { status: 400 }
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
