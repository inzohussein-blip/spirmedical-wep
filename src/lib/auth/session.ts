/**
 * ═══════════════════════════════════════════════════════════════
 * Authentication Session Helper (V25.1 — fixes login loops)
 * ═══════════════════════════════════════════════════════════════
 *
 * 🔧 إصلاحات V25.1:
 *   ✅ إذا profile غير موجود → نُنشئه افتراضياً بدلاً من redirect /login (يسبب loop)
 *   ✅ إذا role غير معروف → نعامله كـ 'patient' (آمن)
 *   ✅ ندعم كل أدوار admin بشكل صحيح
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

const ADMIN_ROLES: UserRole[] = ['admin', 'super_admin', 'manager', 'support'];

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
  allowedRoles?: UserRole[];
  redirectOnDenied?: string;
  redirectOnUnauth?: string;
}

/**
 * يحدد المسار المناسب لكل دور
 */
function getDefaultPathForRole(role: UserRole): string {
  if (role === 'specialist') return '/specialist';
  if (ADMIN_ROLES.includes(role)) return '/admin';
  return '/dashboard';
}

/**
 * Helper رئيسي - يضمن وجود session صحيح
 *
 * الفلسفة:
 * - لو user موجود لكن بدون profile → ننشئه افتراضياً (تجنّب loops)
 * - لو role غير مسموح → redirect للمسار المناسب لذلك الدور
 * - لو role غير معروف (null) → عامله كـ 'patient'
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

  // 🔧 V25.1: لو profile غير موجود في DB، أنشئه افتراضياً
  // (يحدث للمستخدمين الجدد قبل اكتمال الـ trigger)
  // ⚠️ مهم: لا نعمل redirect لـ /login هنا (يسبب loop)
  let role: UserRole;
  let fullName: string;
  let approvalStatus: string | null;
  let settings: UserSettings;

  if (!profile) {
    // ننشئ profile جديد
    const { data: newProfile } = await supabase
      .from('users')
      .upsert(
        {
          id: user.id,
          full_name: 'مستخدم جديد',
          role: 'patient',
          phone: user.user_metadata?.phone ?? null,
        },
        { onConflict: 'id' }
      )
      .select('full_name, role, approval_status, user_settings')
      .single();

    role = (newProfile?.role as UserRole) ?? 'patient';
    fullName = newProfile?.full_name ?? 'مستخدم جديد';
    approvalStatus = newProfile?.approval_status ?? null;
    settings = (newProfile?.user_settings ?? {}) as UserSettings;
  } else {
    role = (profile.role as UserRole) ?? 'patient';
    fullName = profile.full_name ?? 'مستخدم';
    approvalStatus = profile.approval_status ?? null;
    settings = (profile.user_settings ?? {}) as UserSettings;
  }

  // التحقق من الصلاحيات
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    if (redirectOnDenied) {
      redirect(redirectOnDenied);
    }
    redirect(getDefaultPathForRole(role));
  }

  const pinEnabled = settings.pin_enabled === true && !!settings.pin_hash;

  return {
    user: { id: user.id, email: user.email },
    profile: {
      full_name: fullName,
      role,
      approval_status: approvalStatus,
      user_settings: settings,
    },
    pinEnabled,
  };
}
