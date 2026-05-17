'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logAdminAction } from '@/lib/admin-audit';
import { isAdminRole } from '@/lib/admin-types';

async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'unauthorized', supabase: null };

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single();

  if (!isAdminRole(profile?.role)) return { ok: false as const, error: 'forbidden', supabase: null };
  return { ok: true as const, user, supabase };
}

export async function createCoupon(
  code: string,
  description: string,
  discountType: 'percentage' | 'fixed',
  discountValue: number,
  validUntil: string | null,
  maxUses: number | null
) {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!code.trim()) return { ok: false, error: 'الكود فارغ' };
  if (discountValue <= 0) return { ok: false, error: 'قيمة الخصم يجب أن تكون موجبة' };
  if (discountType === 'percentage' && discountValue > 100) return { ok: false, error: 'النسبة لا تتجاوز 100%' };

  const { error } = await auth.supabase.from('coupons').insert({
    code: code.trim().toUpperCase(),
    description: description.trim() || null,
    discount_type: discountType,
    discount_value: discountValue,
    valid_until: validUntil ? new Date(validUntil).toISOString() : null,
    max_uses: maxUses ?? null,
    created_by: auth.user!.id,
  });

  if (error) {
    if (error.code === '23505') return { ok: false, error: 'هذا الكود موجود مسبقاً' };
    return { ok: false, error: error.message };
  }

  await logAdminAction({
    action_type: 'create_coupon',
    target_type: 'coupon',
    details: { code, discount_type: discountType, discount_value: discountValue },
  });

  revalidatePath('/admin44/coupons');
  return { ok: true };
}

export async function toggleCouponActive(couponId: string, isActive: boolean) {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase
    .from('coupons')
    .update({ is_active: isActive })
    .eq('id', couponId);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin44/coupons');
  return { ok: true };
}

export async function deleteCoupon(couponId: string) {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase.from('coupons').delete().eq('id', couponId);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin44/coupons');
  return { ok: true };
}
