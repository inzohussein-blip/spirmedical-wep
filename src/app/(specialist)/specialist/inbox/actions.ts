'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { notifyNewMessage } from '@/lib/services/push-templates';

/**
 * إنشاء محادثة جديدة بين مريض وأخصائي
 */
export async function createChat(specialistId: string, appointmentId?: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'يجب تسجيل الدخول' };

  // تحقق إذا كانت المحادثة موجودة
  const { data: existing } = await supabase
    .from('chats')
    .select('id')
    .eq('patient_id', user.id)
    .eq('specialist_id', specialistId)
    .maybeSingle();

  if (existing) {
    return { chatId: existing.id };
  }

  // إنشاء محادثة جديدة
  const { data: newChat, error } = await supabase
    .from('chats')
    .insert({
      patient_id: user.id,
      specialist_id: specialistId,
      appointment_id: appointmentId,
      status: 'open',
      priority: 'normal',
      tags: [],
    })
    .select('id')
    .single();

  if (error) return { error: error.message };

  // رسالة نظام للبدء
  await supabase.from('messages').insert({
    chat_id: newChat.id,
    sender_id: user.id,
    type: 'system',
    content: 'بدأت المحادثة',
    is_read: true,
  });

  revalidatePath('/messages');
  revalidatePath('/specialist/inbox');

  return { chatId: newChat.id };
}

/**
 * إرسال رسالة
 */
export async function sendMessage(
  chatId: string,
  content: string,
  type: 'text' | 'image' | 'file' | 'audio' = 'text',
  attachmentUrl?: string,
  attachmentName?: string
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'يجب تسجيل الدخول' };
  if (!content.trim() && !attachmentUrl) {
    return { error: 'الرسالة فارغة' };
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      chat_id: chatId,
      sender_id: user.id,
      type,
      content: content.trim(),
      attachment_url: attachmentUrl,
      attachment_name: attachmentName,
      is_read: false,
    })
    .select('*')
    .single();

  if (error) return { error: error.message };

  // ✨ V25.4: Push notification للمستلم
  try {
    // جلب بيانات الشات + اسم المرسِل
    const { data: chat } = await supabase
      .from('chats')
      .select('patient_id, specialist_id')
      .eq('id', chatId)
      .single();

    if (chat) {
      // تحديد المستلم (الطرف الآخر)
      const recipientId =
        user.id === chat.patient_id ? chat.specialist_id : chat.patient_id;

      // جلب اسم المرسِل
      const { data: senderProfile } = await supabase
        .from('users')
        .select('full_name, role')
        .eq('id', user.id)
        .single();

      const senderName =
        senderProfile?.full_name ||
        (senderProfile?.role === 'specialist' ? 'الأخصائي' : 'المريض');

      // تجهيز preview (للنص + مرفقات)
      const preview =
        type === 'text'
          ? content.trim().slice(0, 80)
          : type === 'image'
            ? '📷 صورة'
            : type === 'file'
              ? '📎 ملف'
              : type === 'audio'
                ? '🎤 رسالة صوتية'
                : 'رسالة جديدة';

      notifyNewMessage(recipientId, {
        senderName,
        preview,
        threadId: chatId,
      }).catch((err) => console.error('Push new message failed:', err));
    }
  } catch (err) {
    console.error('Push notification error:', err);
  }

  revalidatePath(`/messages/${chatId}`);
  revalidatePath(`/specialist/inbox/${chatId}`);

  return { message: data };
}

/**
 * تعليم الرسائل كمقروءة
 */
export async function markChatAsRead(chatId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'يجب تسجيل الدخول' };

  // تحديث الرسائل
  await supabase
    .from('messages')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('chat_id', chatId)
    .neq('sender_id', user.id)
    .eq('is_read', false);

  // إعادة تعيين العداد
  const { data: chat } = await supabase
    .from('chats')
    .select('patient_id, specialist_id')
    .eq('id', chatId)
    .single();

  if (chat) {
    const isPatient = user.id === chat.patient_id;
    await supabase
      .from('chats')
      .update(isPatient
        ? { patient_unread_count: 0 }
        : { specialist_unread_count: 0 }
      )
      .eq('id', chatId);
  }

  return { success: true };
}

/**
 * تحديث حالة المحادثة (open/pending/resolved/archived)
 */
export async function updateChatStatus(chatId: string, status: 'open' | 'pending' | 'resolved' | 'archived') {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'يجب تسجيل الدخول' };

  const { error } = await supabase
    .from('chats')
    .update({
      status,
      closed_at: status === 'resolved' || status === 'archived' ? new Date().toISOString() : null,
    })
    .eq('id', chatId)
    .eq('specialist_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/specialist/inbox');
  return { success: true };
}

/**
 * pin/unpin محادثة
 */
export async function toggleChatPin(chatId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'يجب تسجيل الدخول' };

  const { data: chat } = await supabase
    .from('chats')
    .select('is_pinned')
    .eq('id', chatId)
    .single();

  if (!chat) return { error: 'محادثة غير موجودة' };

  const { error } = await supabase
    .from('chats')
    .update({ is_pinned: !chat.is_pinned })
    .eq('id', chatId);

  if (error) return { error: error.message };

  revalidatePath('/specialist/inbox');
  revalidatePath('/messages');
  return { success: true };
}

/**
 * تحديث أولوية المحادثة
 */
export async function updateChatPriority(chatId: string, priority: 'low' | 'normal' | 'high' | 'urgent') {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'يجب تسجيل الدخول' };

  const { error } = await supabase
    .from('chats')
    .update({ priority })
    .eq('id', chatId)
    .eq('specialist_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/specialist/inbox');
  return { success: true };
}
