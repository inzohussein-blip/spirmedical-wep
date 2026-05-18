import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * ═══════════════════════════════════════════════════════════════
 * Service Role Client (V25.3)
 * ═══════════════════════════════════════════════════════════════
 *
 * يتجاوز RLS - يُستخدم فقط في:
 *   - Server actions تحتاج صلاحيات إدارية
 *   - Cron jobs
 *   - Push notification service
 *
 * ⚠️ لا تستخدمه إلا عند الضرورة!
 * ═══════════════════════════════════════════════════════════════
 */

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set - cannot create service client'
    );
  }

  return createSupabaseClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
