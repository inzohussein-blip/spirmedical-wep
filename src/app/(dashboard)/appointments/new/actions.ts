'use server';

import { createClient } from '@/lib/supabase/server';
import { appointmentSchema } from '@/lib/validations/appointment';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function createAppointment(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'يجب تسجيل الدخول أولاً' };
  }

  const data = {
    service_type: formData.get('service_type') as string,
    scheduled_at: formData.get('scheduled_at') as string,
    address: formData.get('address') as string,
    notes: (formData.get('notes') as string) || undefined,
  };

  const validation = appointmentSchema.safeParse(data);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const { error } = await supabase.from('appointments').insert({
    ...validation.data,
    user_id: user.id,
    status: 'pending',
  });

  if (error) {
    console.error('Create appointment error:', error.message);
    return { error: 'فشل إنشاء الحجز، حاول مرة أخرى' };
  }

  revalidatePath('/dashboard');
  revalidatePath('/appointments');
  redirect('/appointments');
}
