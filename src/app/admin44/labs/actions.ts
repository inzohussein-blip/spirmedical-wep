'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * ═══════════════════════════════════════════════════════════════
 * 🩸 V25.43: Partner Labs Admin Actions
 * ═══════════════════════════════════════════════════════════════
 */

interface LabFormData {
  name_ar: string;
  name_en: string;
  city: string;
  governorate: string;
  phone: string;
  specialties: string[];
  is_active: boolean;
  is_featured: boolean;
}

async function ensureAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized', supabase, user: null };
  
  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single();
  
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return { ok: false, error: 'permission_denied', supabase, user: null };
  }
  
  return { ok: true, supabase, user };
}

export async function upsertLab(labId: string | undefined, data: LabFormData) {
  const check = await ensureAdmin();
  if (!check.ok || !check.supabase) return { ok: false, error: check.error };

  
  const supabaseAny = check.supabase as unknown as {
    from: (t: string) => {
      insert: (d: object) => Promise<{ error: { message: string } | null }>;
      update: (d: object) => { eq: (col: string, val: string) => Promise<{ error: { message: string } | null }> };
    };
  };

  const labData = {
    name_ar: data.name_ar.trim(),
    name_en: data.name_en.trim() || null,
    city: data.city,
    governorate: data.governorate || null,
    phone: data.phone || null,
    specialties: data.specialties.length > 0 ? data.specialties : null,
    is_active: data.is_active,
    is_featured: data.is_featured,
  };

  if (labId) {
    const { error } = await supabaseAny
      .from('partner_labs')
      .update(labData)
      .eq('id', labId);
    
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabaseAny
      .from('partner_labs')
      .insert(labData);
    
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath('/admin44/labs');
  return { ok: true };
}

export async function toggleLabActive(labId: string) {
  const check = await ensureAdmin();
  if (!check.ok || !check.supabase) return { ok: false, error: check.error };

  
  const supabaseAny = check.supabase as unknown as {
    from: (t: string) => {
      select: (cols: string) => { eq: (col: string, val: string) => { single: () => Promise<{ data: { is_active: boolean } | null }> } };
      update: (d: object) => { eq: (col: string, val: string) => Promise<{ error: unknown }> };
    };
  };

  const { data: lab } = await supabaseAny
    .from('partner_labs')
    .select('is_active')
    .eq('id', labId)
    .single();

  if (!lab) return { ok: false, error: 'not_found' };

  await supabaseAny
    .from('partner_labs')
    .update({ is_active: !lab.is_active })
    .eq('id', labId);

  revalidatePath('/admin44/labs');
  return { ok: true };
}

export async function toggleLabFeatured(labId: string) {
  const check = await ensureAdmin();
  if (!check.ok || !check.supabase) return { ok: false, error: check.error };

  
  const supabaseAny = check.supabase as unknown as {
    from: (t: string) => {
      select: (cols: string) => { eq: (col: string, val: string) => { single: () => Promise<{ data: { is_featured: boolean } | null }> } };
      update: (d: object) => { eq: (col: string, val: string) => Promise<{ error: unknown }> };
    };
  };

  const { data: lab } = await supabaseAny
    .from('partner_labs')
    .select('is_featured')
    .eq('id', labId)
    .single();

  if (!lab) return { ok: false, error: 'not_found' };

  await supabaseAny
    .from('partner_labs')
    .update({ is_featured: !lab.is_featured })
    .eq('id', labId);

  revalidatePath('/admin44/labs');
  return { ok: true };
}

export async function deleteLab(labId: string) {
  const check = await ensureAdmin();
  if (!check.ok || !check.supabase) return { ok: false, error: check.error };

  
  const supabaseAny = check.supabase as unknown as {
    from: (t: string) => {
      delete: () => { eq: (col: string, val: string) => Promise<{ error: { message: string } | null }> };
    };
  };

  const { error } = await supabaseAny
    .from('partner_labs')
    .delete()
    .eq('id', labId);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin44/labs');
  return { ok: true };
}
