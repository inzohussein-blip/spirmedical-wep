import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

export interface LogActionInput {
  action_type: string;
  target_type?: string;
  target_id?: string;
  details?: Record<string, unknown>;
}

/**
 * تسجيل عملية إدارية في admin_actions
 * يستدعى من server actions الإدارية
 */
export async function logAdminAction(input: LogActionInput): Promise<void> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const hdrs = headers();
    const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim()
            ?? hdrs.get('x-real-ip')
            ?? null;

    await supabase.from('admin_actions').insert({
      admin_id: user.id,
      action_type: input.action_type,
      target_type: input.target_type ?? null,
      target_id: input.target_id ?? null,
      details: (input.details ?? null) as never,
      ip_address: ip,
    });
  } catch (err) {
    // لا نريد فشل تسجيل audit يكسر العملية الأصلية
    console.error('logAdminAction failed:', err);
  }
}
