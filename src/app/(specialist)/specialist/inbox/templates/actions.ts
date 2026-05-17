'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface TemplateInput {
  shortcut: string;
  content: string;
  category?: string;
}

export async function createTemplate(input: TemplateInput) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  if (!input.shortcut.trim() || !input.content.trim()) {
    return { ok: false, error: 'الاختصار والمحتوى إلزاميان' };
  }

  const { error } = await supabase.from('quick_replies').insert({
    specialist_id: user.id,
    shortcut: input.shortcut.trim(),
    content: input.content.trim(),
    category: input.category?.trim() || 'عام',
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath('/specialist/inbox/templates');
  return { ok: true };
}

export async function updateTemplate(id: string, input: TemplateInput) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  const { error } = await supabase
    .from('quick_replies')
    .update({
      shortcut: input.shortcut.trim(),
      content: input.content.trim(),
      category: input.category?.trim() || 'عام',
    })
    .eq('id', id)
    .eq('specialist_id', user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/specialist/inbox/templates');
  return { ok: true };
}

export async function deleteTemplate(id: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  const { error } = await supabase
    .from('quick_replies')
    .delete()
    .eq('id', id)
    .eq('specialist_id', user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/specialist/inbox/templates');
  return { ok: true };
}
