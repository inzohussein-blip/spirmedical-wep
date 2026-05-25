/**
 * POST /api/whatsapp/settings/toggle-otp
 * 
 * Body: { enabled: boolean, preferredChannel?: 'whatsapp' | 'telegram' | 'sms' }
 * 
 * المنطق:
 *   - لو enabled=true ولم يتم التحقق من رقم WhatsApp بعد → 
 *     يجب التحقق أولاً عبر /verify-wa
 *   - لو enabled=false → ببساطة عطّله
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'يجب تسجيل الدخول أولاً' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { enabled, preferredChannel } = body as {
      enabled: boolean;
      preferredChannel?: 'whatsapp' | 'telegram' | 'sms';
    };

    // ─── إذا تفعيل WhatsApp → يجب التحقق من الرقم أولاً ───
    if (enabled && preferredChannel === 'whatsapp') {
      const { data: profile } = await supabase
        .from('users')
        .select('wa_verified')
        .eq('id', user.id)
        .single();

      if (!profile?.wa_verified) {
        return NextResponse.json(
          {
            success: false,
            error: 'يجب التحقق من رقم WhatsApp أولاً',
            requiresVerification: true,
          },
          { status: 400 }
        );
      }
    }

    // ─── تحديث ───
    const updates: Record<string, any> = {
      wa_otp_enabled: enabled,
    };

    if (preferredChannel) {
      updates.preferred_otp_channel = preferredChannel;
    }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'فشل التحديث' },
        { status: 500 }
      );
    }

    // ─── سجّل في audit_logs ───
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: enabled ? 'enable_wa_otp' : 'disable_wa_otp',
      entity_type: 'user_settings',
      entity_id: user.id,
      changes: { enabled, preferredChannel },
    });

    return NextResponse.json({ success: true, enabled, preferredChannel });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[Settings/toggle-otp] Error:', err);
    return NextResponse.json(
      { success: false, error: 'خطأ في النظام' },
      { status: 500 }
    );
  }
}
