'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logAdminAction } from '@/lib/admin-audit';
import { isSuperAdmin, type AdminRole } from '@/lib/admin-types';

async function requireSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'unauthorized', supabase: null };

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single();

  if (!isSuperAdmin(profile?.role)) return { ok: false as const, error: 'forbidden', supabase: null };
  return { ok: true as const, user, supabase, callerIsTop: profile?.role === 'super_admin' };
}


/** منحُ «مدير عام» أو المسُّ بمديرٍ عامّ للمدير العامّ وحده (المديرُ كالعامّ في غير ذلك). */
async function topRoleBlocked(
  auth: { supabase: Awaited<ReturnType<typeof createClient>>; callerIsTop: boolean },
  userId: string,
  newRole?: string,
): Promise<string | null> {
  if (auth.callerIsTop) return null;
  if (newRole === 'super_admin') return 'منحُ دور المدير العامّ للمدير العام وحده';
  const { data: target } = await auth.supabase.from('users').select('role').eq('id', userId).single();
  return target?.role === 'super_admin' ? 'تغييرُ دور المدير العامّ للمدير العام وحده' : null;
}

/**
 * تعيين دور إداري لمستخدم (بحث بالهاتف)
 */
export async function promoteToAdmin(phone: string, role: AdminRole) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  // البحث عن المستخدم
  const { data: target } = await auth.supabase
    .from('users')
    .select('id, full_name, role')
    .eq('phone', phone.trim())
    .single();

  if (!target) return { ok: false, error: 'لم يتم العثور على مستخدم بهذا الرقم' };

  // المديرُ كالمدير العامّ في كلّ شيء إلّا هذا: منحُ دور «مدير عام» أو المسُّ بمديرٍ عامّ
  // للمدير العامّ وحده — وإلّا رقّى المديرُ نفسَه أو غيرَه فوق دوره. (كان هنا شرطٌ فارغ.)
  if ((role === 'super_admin' || target.role === 'super_admin') && !auth.callerIsTop) {
    return { ok: false, error: 'منحُ دور المدير العامّ أو تغييرُه للمدير العام وحده' };
  }

  const { error } = await auth.supabase
    .from('users')
    .update({ role })
    .eq('id', target.id);

  if (error) return { ok: false, error: error.message };

  await logAdminAction({
    action_type: 'edit_user',
    target_type: 'user',
    target_id: target.id,
    details: { action: 'promote_to_admin', old_role: target.role, new_role: role },
  });

  revalidatePath('/admin/admins');
  return { ok: true, name: target.full_name };
}

/**
 * إزالة صلاحيات إدارية (تخفيض إلى patient)
 */
export async function revokeAdminRole(userId: string) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  // لا يمكن إزالة نفسك
  if (userId === auth.user!.id) return { ok: false, error: 'لا يمكن إزالة صلاحياتك بنفسك' };
  const blocked = await topRoleBlocked(auth, userId);
  if (blocked) return { ok: false, error: blocked };

  const { error } = await auth.supabase
    .from('users')
    .update({ role: 'patient' })
    .eq('id', userId);

  if (error) return { ok: false, error: error.message };

  await logAdminAction({
    action_type: 'edit_user',
    target_type: 'user',
    target_id: userId,
    details: { action: 'revoke_admin' },
  });

  revalidatePath('/admin/admins');
  return { ok: true };
}

/**
 * تغيير دور admin موجود
 */
export async function changeAdminRole(userId: string, newRole: AdminRole) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  const blocked = await topRoleBlocked(auth, userId, newRole);
  if (blocked) return { ok: false, error: blocked };

  const { error } = await auth.supabase
    .from('users')
    .update({ role: newRole })
    .eq('id', userId);

  if (error) return { ok: false, error: error.message };

  await logAdminAction({
    action_type: 'edit_user',
    target_type: 'user',
    target_id: userId,
    details: { action: 'change_admin_role', new_role: newRole },
  });

  revalidatePath('/admin/admins');
  return { ok: true };
}
