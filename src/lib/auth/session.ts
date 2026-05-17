/**
 * ═══════════════════════════════════════════════════════════════
 * Authentication Session Helper
 * ═══════════════════════════════════════════════════════════════
 * مكان مركزي لجلب user + profile + التحقق من الصلاحيات
 *
 * يستخدمه:
 *   - (dashboard)/layout.tsx
 *   - (specialist)/layout.tsx
 *   - admin44/layout.tsx
 *   - أي route protected
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { UserSettings } from '@/lib/services/user-settings-types';

export type UserRole =
  | 'patient'
  | 'specialist'
  | 'admin'
  | 'super_admin'
  | 'manager'
  | 'support';

export interface AuthenticatedSession {
  user: { id: string; email?: string | null };
  profile: {
    full_name: string;
    role: UserRole;
    approval_status?: string | null;
    user_settings: UserSettings;
  };
  pinEnabled: boolean;
}

export interface RequireSessionOptions {
  /**
   * الـ roles المسموح لها بفتح الـ route
   * - patient/specialist: أحدهما فقط
   * - admin: أي admin role
   */
  allowedRoles?: UserRole[];
  /**
   * إذا role غير مسموح، يحوّل إلى هذا المسار
   * default: حسب role الفعلي
   */
  redirectOnDenied?: string;
  /**
   * المسار للـ redirect لو غير مسجل دخول
   * default: /login
   */
  redirectOnUnauth?: string;
}

/**
 * Helper رئيسي - يضمن وجود session صحيح
 * يعيد session مع profile جاهزة للاستخدام
 * يعمل redirects تلقائياً
 */
export async function requireSession(
  options: RequireSessionOptions = {}
): Promise<AuthenticatedSession> {
  const {
    allowedRoles,
    redirectOnDenied,
    redirectOnUnauth = '/login',
  } = options;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(redirectOnUnauth);
  }

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, role, approval_status, user_settings')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect(redirectOnUnauth);
  }

  const role = profile.role as UserRole;

  // التحقق من الصلاحيات
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // إذا role غير مسموح، نحوّل لمكان مناسب
    if (redirectOnDenied) {
      redirect(redirectOnDenied);
    }
    // default routing حسب role
    if (role === 'specialist') {
      redirect('/specialist');
    } else if (
      role === 'admin' ||
      role === 'super_admin' ||
      role === 'manager' ||
      role === 'support'
    ) {
      redirect('/admin44');
    } else {
      redirect('/dashboard');
    }
  }

  const settings = (profile.user_settings ?? {}) as UserSettings;
  const pinEnabled = settings.pin_enabled === true && !!settings.pin_hash;

  return {
    user: { id: user.id, email: user.email },
    profile: {
      full_name: profile.full_name ?? 'مستخدم',
      role,
      approval_status: profile.approval_status,
      user_settings: settings,
    },
    pinEnabled,
  };
}
