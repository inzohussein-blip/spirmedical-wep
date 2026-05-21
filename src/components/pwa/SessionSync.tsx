'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  savePersistedSession,
  clearPersistedSession,
  isPWAInstalled,
} from '@/lib/pwa';
import { clearUserCacheInSW } from '@/lib/logout-cleanup';

/**
 * SessionSync (V25.23)
 *
 * يُزامن session info مع localStorage بشكل دائم للـ PWA.
 * هذا يسمح بـ:
 *   - Auto-login فوري عند فتح التطبيق (بدون انتظار Supabase)
 *   - معرفة المستخدم حتى لو فقدت الـ network
 *   - تجربة "تطبيق حقيقي" لا ينسى الـ user
 *
 * يعمل في الـ background ولا يعرض شيئاً.
 */
export default function SessionSync() {
  useEffect(() => {
    const supabase = createClient();

    // 1. عند فتح التطبيق - نتفقد إذا في session
    const syncCurrentSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('full_name, phone, role')
          .eq('id', user.id)
          .single();

        if (profile) {
          savePersistedSession({
            userId: user.id,
            role: profile.role,
            fullName: profile.full_name || '',
            phone: profile.phone || '',
            savedAt: Date.now(),
          });
        }
      } else {
        clearPersistedSession();
      }
    };

    syncCurrentSession();

    // 2. الاستماع لتغييرات الـ auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // نُحفّظ session info
          const { data: profile } = await supabase
            .from('users')
            .select('full_name, phone, role')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            savePersistedSession({
              userId: session.user.id,
              role: profile.role,
              fullName: profile.full_name || '',
              phone: profile.phone || '',
              savedAt: Date.now(),
            });
          }
        } else if (event === 'SIGNED_OUT') {
          // 🎯 V25.26: تنظيف شامل عند logout
          clearPersistedSession();
          clearUserCacheInSW().catch(() => { /* ignore */ });
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // نُحدّث الـ timestamp
          const existing = JSON.parse(localStorage.getItem('spir-session-info') || 'null');
          if (existing) {
            savePersistedSession({
              ...existing,
              savedAt: Date.now(),
            });
          }
        }
      }
    );

    // 3. عند return للـ app (PWA focus event)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isPWAInstalled()) {
        // نُجدّد الـ session في الخلفية
        supabase.auth.getSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null;
}
