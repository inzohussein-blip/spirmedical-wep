'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * تحقق من ملكية الصيدلية + الـ inventory
 */
async function verifyOwnership(inventoryId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'غير مصرّح' };

  const { data: item } = await supabase
    .from('pharmacy_inventory')
    .select(`
      id,
      pharmacy:pharmacies (
        owner_user_id
      )
    `)
    .eq('id', inventoryId)
    .single();

  if (!item) return { ok: false, error: 'العنصر غير موجود' };

  // Type assertion للتعامل مع join
  const pharmacy = item.pharmacy as unknown as { owner_user_id: string } | null;
  if (!pharmacy || pharmacy.owner_user_id !== user.id) {
    return { ok: false, error: 'لا تملك هذه الصيدلية' };
  }

  return { ok: true, supabase, userId: user.id };
}

/**
 * تبديل حالة التوفّر (متوفر <-> غير متوفر)
 */
export async function toggleMedicationAvailability(
  inventoryId: string,
  newValue: boolean
) {
  const auth = await verifyOwnership(inventoryId);
  if (!auth.ok || !auth.supabase) return { success: false, error: auth.error };

  const updates: Record<string, unknown> = {
    is_available: newValue,
    updated_at: new Date().toISOString(),
  };

  if (!newValue) {
    updates.marked_unavailable_at = new Date().toISOString();
  }

  const { error } = await auth.supabase
    .from('pharmacy_inventory')
    .update(updates)
    .eq('id', inventoryId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/specialist/pharmacy');
  revalidatePath('/services/pharmacies');
  return { success: true };
}

/**
 * إضافة دواء لكتالوج الصيدلية
 */
export async function addMedicationToInventory(
  pharmacyId: string,
  medicationId: string
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'غير مصرّح' };

  // تحقق من ملكية الصيدلية
  const { data: pharmacy } = await supabase
    .from('pharmacies')
    .select('owner_user_id')
    .eq('id', pharmacyId)
    .single();

  if (!pharmacy || pharmacy.owner_user_id !== user.id) {
    return { success: false, error: 'لا تملك هذه الصيدلية' };
  }

  // تحقق أنه غير موجود مسبقاً
  const { data: existing } = await supabase
    .from('pharmacy_inventory')
    .select('id')
    .eq('pharmacy_id', pharmacyId)
    .eq('medication_id', medicationId)
    .maybeSingle();

  if (existing) {
    return { success: false, error: 'الدواء موجود بالفعل في الكتالوج' };
  }

  const { error } = await supabase
    .from('pharmacy_inventory')
    .insert({
      pharmacy_id: pharmacyId,
      medication_id: medicationId,
      is_available: true,
    });

  if (error) return { success: false, error: error.message };

  revalidatePath('/specialist/pharmacy');
  return { success: true };
}

/**
 * تحديث تفاصيل العنصر (السعر/البديل/الملاحظات)
 */
export async function updateInventoryItem(
  inventoryId: string,
  updates: {
    custom_price?: number | null;
    brand_variant?: string | null;
    notes?: string | null;
  }
) {
  const auth = await verifyOwnership(inventoryId);
  if (!auth.ok || !auth.supabase) return { success: false, error: auth.error };

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.custom_price !== undefined) updateData.custom_price = updates.custom_price;
  if (updates.brand_variant !== undefined) updateData.brand_variant = updates.brand_variant;
  if (updates.notes !== undefined) updateData.notes = updates.notes;

  const { error } = await auth.supabase
    .from('pharmacy_inventory')
    .update(updateData)
    .eq('id', inventoryId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/specialist/pharmacy');
  return { success: true };
}

/**
 * حذف دواء من الكتالوج
 */
export async function removeFromInventory(inventoryId: string) {
  const auth = await verifyOwnership(inventoryId);
  if (!auth.ok || !auth.supabase) return { success: false, error: auth.error };

  const { error } = await auth.supabase
    .from('pharmacy_inventory')
    .delete()
    .eq('id', inventoryId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/specialist/pharmacy');
  return { success: true };
}
