import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

/**
 * Supabase client للاستخدام من جانب المتصفح (Client Components).
 * V25.23: تحسينات Persistent Auth
 *
 * - autoRefreshToken: يجدّد الـ token تلقائياً قبل انتهائه
 * - persistSession: يحفظ الجلسة في localStorage (تبقى للأبد)
 * - detectSessionInUrl: لإكمال OAuth callback
 * - flowType: 'pkce' آمن أكثر
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        // 🔑 Custom storage key للـ PWA - يبقى بعد التحديث
        storageKey: 'spir-medical-auth',
      },
      global: {
        // 🔄 Auto-retry على الـ network errors
        fetch: async (url, options) => {
          let retries = 0;
          const maxRetries = 2;

          while (retries <= maxRetries) {
            try {
              const res = await fetch(url, options);
              return res;
            } catch (err) {
              retries++;
              if (retries > maxRetries) throw err;
              await new Promise((r) => setTimeout(r, 1000 * retries));
            }
          }
          throw new Error('Fetch failed after retries');
        },
      },
    }
  );
}
