'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * ════════════════════════════════════════════════════════════════════
 * ⭐ V25.47: Universal Service Favorites
 * ════════════════════════════════════════════════════════════════════
 */

export type ServiceType = 'hospital' | 'dental' | 'optical' | 'pharmacy' | 'doctor' | 'mental_health' | 'nutritionist' | 'physio';

/**
 * مقطع المسار الفعلي لكل نوع.
 *
 * ⚠️ كان يُشتقّ بإضافة حرف `s` (`${serviceType}s`)، وهو صحيحٌ لنوعين فقط
 * (hospital/doctor) وخاطئ للستّة الباقية: `pharmacys` و`mental_healths`
 * و`nutritionists` و`dentals` و`opticals` و`physios` — لا وجود لأيٍّ منها.
 * فكان `revalidatePath` يُبطِل ذاكرة مسارٍ غير موجود، وتبقى صفحة التفاصيل
 * على حالتها القديمة بعد التبديل.
 */
const SERVICE_PATH_SEGMENT: Record<ServiceType, string> = {
  hospital: 'hospitals',
  dental: 'dental',
  optical: 'optical',
  pharmacy: 'pharmacies',
  doctor: 'doctors',
  mental_health: 'mental-health',
  nutritionist: 'nutrition',
  physio: 'physio',
};

export async function toggleServiceFavorite(serviceType: ServiceType, serviceId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  
  const supabaseAny = supabase as unknown as {
    from: (t: string) => {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          eq: (col: string, val: string) => {
            eq: (col: string, val: string) => {
              single: () => Promise<{ data: { id: string } | null }>;
            };
          };
        };
      };
      delete: () => { eq: (col: string, val: string) => Promise<{ error: unknown }> };
      insert: (d: object) => Promise<{ error: { message: string } | null }>;
    };
  };

  // هل موجود؟
  const { data: existing } = await supabaseAny
    .from('service_favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('service_type', serviceType)
    .eq('service_id', serviceId)
    .single();

  if (existing) {
    // احذف
    await supabaseAny
      .from('service_favorites')
      .delete()
      .eq('id', existing.id);
    
    revalidatePath('/account/favorites');
    revalidatePath(`/services/${SERVICE_PATH_SEGMENT[serviceType]}/${serviceId}`);
    return { ok: true, favorited: false };
  } else {
    // أضف
    const { error } = await supabaseAny
      .from('service_favorites')
      .insert({ 
        user_id: user.id, 
        service_type: serviceType,
        service_id: serviceId,
      });
    
    if (error) return { ok: false, error: error.message };
    
    revalidatePath('/account/favorites');
    revalidatePath(`/services/${SERVICE_PATH_SEGMENT[serviceType]}/${serviceId}`);
    return { ok: true, favorited: true };
  }
}

export async function checkIsFavorite(serviceType: ServiceType, serviceId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  
  const supabaseAny = supabase as unknown as {
    from: (t: string) => {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          eq: (col: string, val: string) => {
            eq: (col: string, val: string) => {
              single: () => Promise<{ data: { id: string } | null }>;
            };
          };
        };
      };
    };
  };

  const { data } = await supabaseAny
    .from('service_favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('service_type', serviceType)
    .eq('service_id', serviceId)
    .single();

  return !!data;
}
