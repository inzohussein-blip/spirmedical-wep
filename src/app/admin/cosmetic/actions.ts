'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * ════════════════════════════════════════════════════════════════════
 * 💄 V26.1: Cosmetic Admin Actions
 * ════════════════════════════════════════════════════════════════════
 */

async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return null;
  }
  return supabase;
}

async function updateProduct(id: string, updates: object) {
  const supabase = await requireAdmin();
  if (!supabase) return { ok: false, error: 'unauthorized' };

  // updates حمولة عامّة (object)؛ cast حدّي على generics الـ Update
  const { error } = await supabase
    .from('cosmetic_products')
    .update(updates as never)
    .eq('id', id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/cosmetic');
  revalidatePath('/services/cosmetic');
  return { ok: true };
}

export async function toggleActiveProduct(id: string, active: boolean) {
  return updateProduct(id, { is_active: active });
}

export async function toggleStockProduct(id: string, inStock: boolean) {
  return updateProduct(id, { is_in_stock: inStock });
}

export async function toggleRecommendedProduct(id: string, recommended: boolean) {
  return updateProduct(id, { is_recommended: recommended });
}
