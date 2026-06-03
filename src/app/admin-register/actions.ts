'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isSuperAdmin } from '@/lib/admin-types';
import { logAuditEvent } from '@/lib/audit';
import { logger } from '@/lib/logger';

const OWNER_EMAIL = 'inzohussein@gmail.com';

function isNextRedirect(err: unknown): boolean {
  return (
    err instanceof Error &&
    'digest' in err &&
    String((err as { digest?: string }).digest).includes('NEXT_REDIRECT')
  );
}

async function notifyOwner(subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@spir-medical.com';
  if (!apiKey) {
    logger.warn('RESEND_API_KEY missing — skipping owner notification');
    return;
  }
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `Spir Medical <${fromEmail}>`,
        to: OWNER_EMAIL,
        subject,
        html,
      }),
    });
  } catch (err) {
    logger.error('owner notification failed', { error: err instanceof Error ? err.message : String(err) });
  }
}

export async function requestAdminAccess(formData: FormData) {
  const fullName = String(formData.get('fullName') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const reason = String(formData.get('reason') ?? '').trim();

  if (fullName.length < 3) redirect('/admin-register?error=' + encodeURIComponent('الاسم قصير جداً'));
  if (!email.includes('@')) redirect('/admin-register?error=' + encodeURIComponent('بريد إلكتروني غير صالح'));
  if (password.length < 8) redirect('/admin-register?error=' + encodeURIComponent('كلمة المرور 8 أحرف على الأقل'));

  const supabase = createClient();

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role: 'patient' } },
    });

    if (error || !data.user) {
      const msg = error?.message.includes('already') ? 'هذا البريد مُسجّل مسبقاً' : 'تعذّر إنشاء الحساب';
      redirect('/admin-register?error=' + encodeURIComponent(msg));
    }

    const userId = data.user!.id;

    // 🔧 استخدم admin client (service_role) لتجاوز RLS — المستخدم الجديد بلا جلسة بعد
    const admin = createAdminClient() as unknown as { from: (t: string) => any };
    await admin.from('users').update({ full_name: fullName, approval_status: 'pending' }).eq('id', userId);

    await admin.from('admin_requests').insert({
      user_id: userId,
      full_name: fullName,
      email,
      requested_role: 'support',
      reason: reason || null,
      status: 'pending',
    });

    await notifyOwner(
      `👑 طلب صلاحية أدمن جديد — ${fullName}`,
      `<div dir="rtl" style="font-family:sans-serif">
        <h2>طلب صلاحية أدمن جديد</h2>
        <p><b>الاسم:</b> ${fullName}</p>
        <p><b>البريد:</b> ${email}</p>
        <p><b>السبب:</b> ${reason || '—'}</p>
        <p><a href="https://spir-medical.com/admin44/admins/requests">مراجعة الطلبات</a></p>
      </div>`
    );
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    logger.error('admin request failed', { email, error: err instanceof Error ? err.message : String(err) });
    redirect('/admin-register?error=' + encodeURIComponent('حدث خطأ غير متوقّع'));
  }

  redirect('/admin-register?success=1');
}

export async function approveAdminRequest(formData: FormData) {
  const requestId = String(formData.get('requestId') ?? '');
  const grantedRole = String(formData.get('role') ?? 'support');

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin-login');

  const { data: me } = await supabase.from('users').select('role').eq('id', user!.id).single();
  if (!isSuperAdmin(me?.role)) redirect('/admin44?error=' + encodeURIComponent('الموافقة تتطلّب صلاحية مدير عام'));

  const sb = supabase as unknown as { from: (t: string) => any };
  const { data: req } = await sb
    .from('admin_requests')
    .select('user_id, email, full_name')
    .eq('id', requestId)
    .single();

  if (!req) redirect('/admin44/admins/requests?error=' + encodeURIComponent('الطلب غير موجود'));

  const validRole = ['support', 'manager', 'admin'].includes(grantedRole) ? grantedRole : 'support';

  await sb.from('users').update({ role: validRole, approval_status: 'approved' }).eq('id', req!.user_id);
  await sb
    .from('admin_requests')
    .update({ status: 'approved', reviewed_by: user!.id, reviewed_at: new Date().toISOString() })
    .eq('id', requestId);

  logAuditEvent({
    user_id: user!.id,
    action: 'admin_request_approved',
    entity_type: 'admin_requests',
    entity_id: requestId,
    metadata: { granted_role: validRole, approved_email: req!.email },
  }).catch(() => {});

  redirect('/admin44/admins/requests?approved=1');
}

export async function rejectAdminRequest(formData: FormData) {
  const requestId = String(formData.get('requestId') ?? '');

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin-login');

  const { data: me } = await supabase.from('users').select('role').eq('id', user!.id).single();
  if (!isSuperAdmin(me?.role)) redirect('/admin44?error=' + encodeURIComponent('الرفض يتطلّب صلاحية مدير عام'));

  const sb = supabase as unknown as { from: (t: string) => any };
  await sb
    .from('admin_requests')
    .update({ status: 'rejected', reviewed_by: user!.id, reviewed_at: new Date().toISOString() })
    .eq('id', requestId);

  redirect('/admin44/admins/requests?rejected=1');
}
