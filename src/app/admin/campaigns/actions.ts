'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function verifyAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'غير مصرّح' };

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return { ok: false, error: 'غير مصرّح' };
  }
  return { ok: true, supabase, userId: user.id };
}

export interface CampaignInput {
  name: string;
  description: string | null;
  type: 'whatsapp' | 'sms' | 'push' | 'email';
  message_content: string;
  target_segment: {
    governorate?: string;
    has_chronic?: boolean;
    role?: string;
    tags?: string[];
  };
  scheduled_for: string | null;
}

export async function createCampaign(input: CampaignInput) {
  const auth = await verifyAdmin();
  if (!auth.ok || !auth.supabase) return { success: false, error: auth.error };

  const status = input.scheduled_for ? 'scheduled' : 'draft';

  const { data, error } = await auth.supabase
    .from('campaigns')
    .insert({
      ...input,
      status,
      created_by: auth.userId,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/campaigns');
  return { success: true, campaign: data };
}

export async function updateCampaign(id: string, input: Partial<CampaignInput>) {
  const auth = await verifyAdmin();
  if (!auth.ok || !auth.supabase) return { success: false, error: auth.error };

  const { error } = await auth.supabase
    .from('campaigns')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/campaigns');
  return { success: true };
}

export async function deleteCampaign(id: string) {
  const auth = await verifyAdmin();
  if (!auth.ok || !auth.supabase) return { success: false, error: auth.error };

  const { data: campaign } = await auth.supabase
    .from('campaigns')
    .select('status')
    .eq('id', id)
    .single();

  if (campaign && ['sending', 'sent'].includes(campaign.status)) {
    return { success: false, error: 'لا يمكن حذف حملة مُرسَلة' };
  }

  const { error } = await auth.supabase.from('campaigns').delete().eq('id', id);
  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/campaigns');
  return { success: true };
}

export async function sendCampaign(id: string) {
  const auth = await verifyAdmin();
  if (!auth.ok || !auth.supabase) return { success: false, error: auth.error };

  const { data: campaign } = await auth.supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single();

  if (!campaign) return { success: false, error: 'الحملة غير موجودة' };
  if (campaign.status === 'sent') return { success: false, error: 'مُرسلة بالفعل' };

  let query = auth.supabase.from('users').select('id, phone').eq('role', 'user');

  const segment = campaign.target_segment as Record<string, unknown>;
  if (segment.governorate) {
    query = query.eq('governorate', segment.governorate as string);
  }

  const { data: targetUsers } = await query;

  if (!targetUsers || targetUsers.length === 0) {
    await auth.supabase.from('campaigns').update({
      status: 'failed',
      recipients_count: 0,
    }).eq('id', id);
    return { success: false, error: 'لا يوجد جمهور يطابق المعايير' };
  }

  await auth.supabase.from('campaigns').update({
    status: 'sending',
    recipients_count: targetUsers.length,
  }).eq('id', id);

  const queueRecords = targetUsers.map((u) => ({
    user_id: u.id,
    notification_type: campaign.type,
    payload: {
      title: campaign.name,
      body: campaign.message_content,
      campaign_id: id,
    },
    status: 'pending' as const,
    scheduled_for: new Date().toISOString(),
  }));

  const batchSize = 100;
  let successCount = 0;
  for (let i = 0; i < queueRecords.length; i += batchSize) {
    const batch = queueRecords.slice(i, i + batchSize);
    const { error } = await (auth.supabase as unknown as {
      from: (t: string) => { insert: (d: unknown[]) => Promise<{ error: { message: string } | null }> };
    }).from('notification_queue').insert(batch);
    if (!error) successCount += batch.length;
  }

  await auth.supabase.from('campaigns').update({
    status: 'sent',
    sent_at: new Date().toISOString(),
    success_count: successCount,
  }).eq('id', id);

  revalidatePath('/admin/campaigns');
  return {
    success: true,
    recipients: targetUsers.length,
    queued: successCount,
  };
}
