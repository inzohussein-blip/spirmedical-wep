'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * البحث عن دواء وجلب الصيدليات المتوفر فيها
 */
export async function searchMedicationAvailability(
  query: string,
  cityFilter: string | null
) {
  const supabase = createClient();

  // 1. البحث في الكتالوج
  const { data: medications } = await supabase
    .from('medications')
    .select('id, name_ar, name_en, generic_name, manufacturer, strength, image_url')
    .or(`name_ar.ilike.%${query}%,name_en.ilike.%${query}%,generic_name.ilike.%${query}%`)
    .limit(10);

  if (!medications || medications.length === 0) {
    return [];
  }

  const medIds = medications.map((m) => m.id);

  // 2. جلب الـ inventory المتوفّر
  const { data: inventory } = await supabase
    .from('pharmacy_inventory')
    .select(`
      id,
      medication_id,
      is_available,
      custom_price,
      brand_variant,
      notes,
      pharmacy:pharmacies (
        id,
        name,
        city,
        district,
        phone,
        is_24h,
        is_active
      )
    `)
    .in('medication_id', medIds)
    .eq('is_available', true);

  if (!inventory) return [];

  // 3. تنظيم النتائج
  const results: Array<{
    medication: typeof medications[0];
    available_pharmacies: Array<{
      inventory_id: string;
      pharmacy_id: string;
      pharmacy_name: string;
      city: string;
      district: string;
      phone: string;
      is_24h: boolean;
      custom_price: number | null;
      brand_variant: string | null;
      notes: string | null;
    }>;
  }> = [];

  for (const med of medications) {
    const pharmaciesForMed = inventory
      .filter((i) => {
        if (i.medication_id !== med.id) return false;
        // Type assertion للتعامل مع join
        const pharmacy = i.pharmacy as unknown as { is_active: boolean; city: string } | null;
        if (!pharmacy || !pharmacy.is_active) return false;
        if (cityFilter && pharmacy.city !== cityFilter) return false;
        return true;
      })
      .map((i) => {
        const pharmacy = i.pharmacy as unknown as {
          id: string;
          name: string;
          city: string;
          district: string;
          phone: string;
          is_24h: boolean;
        };
        return {
          inventory_id: i.id,
          pharmacy_id: pharmacy.id,
          pharmacy_name: pharmacy.name,
          city: pharmacy.city,
          district: pharmacy.district,
          phone: pharmacy.phone,
          is_24h: pharmacy.is_24h,
          custom_price: i.custom_price,
          brand_variant: i.brand_variant,
          notes: i.notes,
        };
      });

    if (pharmaciesForMed.length > 0) {
      results.push({
        medication: med,
        available_pharmacies: pharmaciesForMed,
      });

      // زيادة عداد البحث
      await supabase.rpc('increment_search_count' as never, { med_id: med.id } as never).then(() => {
        // ignore errors silently
      });
    }
  }

  // 4. تسجيل عملية البحث (تحليلات)
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('medication_searches').insert({
      user_id: user?.id ?? null,
      search_query: query,
      medication_id: results[0]?.medication.id ?? null,
      city_filter: cityFilter,
      results_count: results.length,
      found_any_available: results.length > 0,
    });
  } catch {
    // ignore analytics errors
  }

  return results;
}
