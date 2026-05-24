'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * ════════════════════════════════════════════════════════════════════
 * 💄 V25.49: Cosmetic Product Actions
 * ════════════════════════════════════════════════════════════════════
 */

// ─── Wishlist ───
export async function toggleCosmeticWishlist(productId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  
  const supabaseAny = supabase as unknown as {
    from: (t: string) => {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          eq: (col: string, val: string) => {
            single: () => Promise<{ data: { id: string } | null }>;
          };
        };
      };
      delete: () => { eq: (col: string, val: string) => Promise<{ error: unknown }> };
      insert: (d: object) => Promise<{ error: { message: string } | null }>;
    };
  };

  const { data: existing } = await supabaseAny
    .from('cosmetic_wishlist')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .single();

  if (existing) {
    await supabaseAny.from('cosmetic_wishlist').delete().eq('id', existing.id);
    revalidatePath(`/services/cosmetic/${productId}`);
    revalidatePath('/account/cosmetic-wishlist');
    return { ok: true, added: false };
  } else {
    const { error } = await supabaseAny
      .from('cosmetic_wishlist')
      .insert({ user_id: user.id, product_id: productId });
    
    if (error) return { ok: false, error: error.message };
    
    revalidatePath(`/services/cosmetic/${productId}`);
    revalidatePath('/account/cosmetic-wishlist');
    return { ok: true, added: true };
  }
}

// ─── Submit Review ───
interface ReviewInput {
  product_id: string;
  rating: number;
  effectiveness_rating?: number;
  value_rating?: number;
  scent_rating?: number;
  title?: string;
  comment?: string;
  would_recommend?: boolean;
}

export async function submitCosmeticReview(input: ReviewInput) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  if (input.rating < 1 || input.rating > 5) {
    return { ok: false, error: 'التقييم يجب أن يكون بين 1 و 5' };
  }

  
  const supabaseAny = supabase as unknown as {
    from: (t: string) => {
      upsert: (d: object, opts?: object) => Promise<{ error: { message: string } | null }>;
    };
  };

  const { error } = await supabaseAny
    .from('cosmetic_product_reviews')
    .upsert({
      user_id: user.id,
      product_id: input.product_id,
      rating: input.rating,
      effectiveness_rating: input.effectiveness_rating || null,
      value_rating: input.value_rating || null,
      scent_rating: input.scent_rating || null,
      title: input.title || null,
      comment: input.comment || null,
      would_recommend: input.would_recommend ?? true,
      is_public: true,
    }, {
      onConflict: 'user_id,product_id',
    });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/services/cosmetic/${input.product_id}`);
  return { ok: true };
}
