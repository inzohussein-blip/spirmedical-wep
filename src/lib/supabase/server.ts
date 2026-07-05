import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

/**
 * Supabase client للاستخدام من جانب الخادم.
 * يقرأ ويكتب الـ session من cookies.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Supabase environment variables missing. ' +
        'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  const cookieStore = cookies();

  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    // PKCE مطابق للعميل — يضمن أن exchangeCodeForSession يجد الـ code-verifier
    // المخزّن في الكوكيز أثناء OAuth (Google).
    auth: { flowType: 'pkce' },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component — تجاهل (middleware يُحدّث الـ session)
        }
      },
    },
  });
}

/**
 * Supabase client بـ Service Role Key — للعمليات الحساسة من جانب الخادم.
 * ⚠️ لا تستخدمه إلا حيث ضروري — يتجاوز RLS!
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      'Supabase admin environment variables missing. ' +
        'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  return createServerClient<Database>(supabaseUrl, serviceKey, {
    cookies: {
      getAll: () => [],
      setAll: () => {},
    },
  });
}
