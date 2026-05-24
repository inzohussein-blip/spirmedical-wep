'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * ════════════════════════════════════════════════════════════════════
 * ⭐ V25.47: Universal Service Favorites
 * ════════════════════════════════════════════════════════════════════
 */

export type ServiceType = 'hospital' | 'dental' | 'optical' | 'pharmacy' | 'doctor';

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
    revalidatePath(`/services/${serviceType}s/${serviceId}`);
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
    revalidatePath(`/services/${serviceType}s/${serviceId}`);
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
