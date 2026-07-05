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
        // ملاحظة: لا نُخصّص storageKey — @supabase/ssr يخزّن الجلسة و PKCE
        // code-verifier في كوكيز باسم افتراضي (sb-<ref>-auth-token) يقرأه
        // كل من الخادم والـ middleware. تخصيص المفتاح هنا فقط كان يكسر
        // exchangeCodeForSession (الخادم لا يجد الـ verifier) ويمنع العميل
        // من قراءة جلسات كتبها الخادم.
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
