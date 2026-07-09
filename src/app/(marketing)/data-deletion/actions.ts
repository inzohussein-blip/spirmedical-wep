'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { logAuditEvent } from '@/lib/audit';

// 📧 إيميل الشركة الذي يستقبل طلبات حذف البيانات
const COMPANY_EMAIL = 'inzohussein@gmail.com';

function getIp(): string {
  const h = headers();
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * ════════════════════════════════════════════════════════════════════
 * 🗑️ طلب حذف البيانات (Meta-compliant)
 * ════════════════════════════════════════════════════════════════════
 *
 * آلية صارمة:
 *   - لا حذف تلقائي. الطلب يُرسل لإيميل الشركة فقط.
 *   - المالك يراجع الهوية يدوياً ثم ينفّذ الحذف.
 *   - rate-limited لمنع الإساءة.
 *   - يتطلّب عدّة حقول + سبب + تأكيد صريح.
 *
 * هذا يلبّي شرط Meta (آلية حذف فعّالة) مع حماية صارمة ضد الحذف العَرَضي.
 * ════════════════════════════════════════════════════════════════════
 */
export async function submitDeletionRequest(formData: FormData) {
  const fullName = String(formData.get('fullName') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const phone = String(formData.get('phone') ?? '').trim();
  const reason = String(formData.get('reason') ?? '').trim();
  const confirmText = String(formData.get('confirmText') ?? '').trim();
  const acknowledge = formData.get('acknowledge') === 'on';

  // ─── تحقّقات صارمة ───
  if (fullName.length < 3) {
    redirect('/data-deletion?error=' + encodeURIComponent('الاسم الكامل مطلوب'));
  }
  if (!email.includes('@') || email.length < 6) {
    redirect('/data-deletion?error=' + encodeURIComponent('بريد إلكتروني صالح مطلوب'));
  }
  if (phone.replace(/\D/g, '').length < 10) {
    redirect('/data-deletion?error=' + encodeURIComponent('رقم هاتف صالح مطلوب للتحقّق من الهوية'));
  }
  if (reason.length < 10) {
    redirect('/data-deletion?error=' + encodeURIComponent('يرجى ذكر سبب الطلب (10 أحرف على الأقل)'));
  }
  // يجب كتابة عبارة التأكيد حرفياً
  if (confirmText !== 'أؤكد حذف بياناتي') {
    redirect('/data-deletion?error=' + encodeURIComponent('يجب كتابة عبارة التأكيد حرفياً: أؤكد حذف بياناتي'));
  }
  if (!acknowledge) {
    redirect('/data-deletion?error=' + encodeURIComponent('يجب الإقرار بأنّ الحذف نهائي'));
  }

  // ─── rate limit صارم: 2 طلبات/ساعة لكل IP ───
  const ip = getIp();
  const rl = await checkRateLimit(`data-deletion:${ip}`, { max: 2, windowSeconds: 3600 });
  if (!rl.allowed) {
    redirect('/data-deletion?error=' + encodeURIComponent('عدد كبير من المحاولات. حاول بعد ساعة.'));
  }

  // ─── أرسل الطلب لإيميل الشركة ───
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@spir-medical.com';
  const requestId = `DEL-${Date.now().toString(36).toUpperCase()}`;
  const submittedAt = new Date().toISOString();

  if (apiKey) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: `Spir Medical <${fromEmail}>`,
          to: COMPANY_EMAIL,
          reply_to: email,
          subject: `🗑️ طلب حذف بيانات — ${requestId}`,
          html: `<div dir="rtl" style="font-family:sans-serif;line-height:1.8">
            <h2 style="color:#A82E3D">طلب حذف بيانات جديد</h2>
            <p style="background:#fef2f2;padding:12px;border-radius:8px;border:1px solid #fecaca">
              ⚠️ <b>إجراء صارم:</b> تحقّق من هوية مقدّم الطلب قبل تنفيذ أيّ حذف.
            </p>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:6px;font-weight:700">رقم الطلب</td><td style="padding:6px">${requestId}</td></tr>
              <tr><td style="padding:6px;font-weight:700">الاسم</td><td style="padding:6px">${fullName}</td></tr>
              <tr><td style="padding:6px;font-weight:700">البريد</td><td style="padding:6px">${email}</td></tr>
              <tr><td style="padding:6px;font-weight:700">الهاتف</td><td style="padding:6px">${phone}</td></tr>
              <tr><td style="padding:6px;font-weight:700">السبب</td><td style="padding:6px">${reason}</td></tr>
              <tr><td style="padding:6px;font-weight:700">التاريخ</td><td style="padding:6px">${submittedAt}</td></tr>
              <tr><td style="padding:6px;font-weight:700">IP</td><td style="padding:6px">${ip}</td></tr>
            </table>
            <p style="margin-top:16px;color:#6b7280;font-size:13px">
              للتنفيذ: تحقّق من تطابق الهاتف/البريد مع حساب فعلي، ثم احذف يدوياً عبر Supabase
              خلال 30 يوماً (سياسة الاحتفاظ).
            </p>
          </div>`,
        }),
      });
    } catch (err) {
      logger.error('deletion request email failed', {
        requestId,
        error: err instanceof Error ? err.message : String(err),
      });
      // لا نُفشل الطلب — نسجّله على الأقل
    }
  } else {
    logger.warn('RESEND_API_KEY missing — deletion request logged only', { requestId, email, phone });
  }

  // احفظ الطلب بشكل دائم في سجلّ التدقيق (متاح للأدمن) — لا نكتفي بالإيميل/اللوج
  // حتى لا يضيع الطلب لو غاب Resend (التزام امتثال).
  await logAuditEvent({
    action: 'data_deletion_requested',
    entity_type: 'data_deletion_request',
    entity_id: requestId,
    metadata: { fullName, email, phone, reason, ip, submittedAt },
  });

  logger.info('data deletion request received', { requestId, email, phone, ip, submittedAt });

  redirect('/data-deletion?success=' + encodeURIComponent(requestId));
}
