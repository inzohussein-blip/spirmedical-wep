/**
 * ════════════════════════════════════════════════════════════════════
 * 📧 EMAIL SERVICE - Resend Integration
 * ════════════════════════════════════════════════════════════════════
 * 
 * يرسل إيميلات احترافية للمرضى والأخصائيين
 * 
 * Setup:
 *   1. Sign up at https://resend.com (مجاني 100/يوم)
 *   2. أنشئ API key
 *   3. أضف RESEND_API_KEY إلى .env.local
 *   4. أضف RESEND_FROM_EMAIL (مثلاً: noreply@spirmedical.iq)
 * ════════════════════════════════════════════════════════════════════
 */

import { logger } from '@/lib/logger';

export type EmailTemplate =
  | 'welcome_patient'
  | 'welcome_specialist'
  | 'appointment_confirmed'
  | 'appointment_reminder'
  | 'rating_request';

interface EmailPayload {
  to: string;
  template: EmailTemplate;
  data: Record<string, string | number>;
}

/**
 * إرسال إيميل عبر Resend API
 */
export async function sendEmail(payload: EmailPayload): Promise<{
  success: boolean;
  error?: string;
  id?: string;
}> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@spirmedical.iq';

  // إذا لم يكن Resend مفعّلاً، فقط سجّل (لا تفشل)
  if (!apiKey) {
    logger.warn('[Email] Resend not configured - skipping email');
    return { success: false, error: 'Email service not configured' };
  }

  // تجاهل الإيميل في development
  if (process.env.NODE_ENV === 'development' && process.env.RESEND_DEV !== 'true') {
    logger.info('[Email] Skipping email in development');
    return { success: true, id: 'dev-mode' };
  }

  try {
    const { subject, html } = buildEmailContent(payload.template, payload.data);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Spir Medical <${fromEmail}>`,
        to: payload.to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('[Email] Resend error:', { detail: error });
      return { success: false, error };
    }

    const result = await response.json();
    return { success: true, id: result.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[Email] Send failed:', { detail: message });
    return { success: false, error: message };
  }
}

/**
 * بناء محتوى الإيميل حسب النوع
 */
function buildEmailContent(
  template: EmailTemplate,
  data: Record<string, string | number>
): { subject: string; html: string } {
  switch (template) {
    case 'welcome_patient':
      return {
        subject: 'مرحباً بك في سباير ميديكال 🎉',
        html: welcomePatientEmail(data),
      };
    case 'welcome_specialist':
      return {
        subject: 'مرحباً بك كأخصائي في سباير ميديكال 👨‍⚕️',
        html: welcomeSpecialistEmail(data),
      };
    case 'appointment_confirmed':
      return {
        subject: '✓ تم تأكيد موعدك',
        html: appointmentConfirmedEmail(data),
      };
    case 'appointment_reminder':
      return {
        subject: '⏰ تذكير: موعدك غداً',
        html: appointmentReminderEmail(data),
      };
    case 'rating_request':
      return {
        subject: '⭐ كيف كانت تجربتك معنا؟',
        html: ratingRequestEmail(data),
      };
    default:
      return { subject: 'إشعار من سباير ميديكال', html: '<p>إشعار</p>' };
  }
}

// ════════════════════════════════════════════════════════════════════
// 📨 Email Templates - بقالب موحّد جميل
// ════════════════════════════════════════════════════════════════════

function emailWrapper(content: string, footerText?: string): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Spir Medical</title>
</head>
<body style="margin:0;padding:0;background:#F4EFE2;font-family:'Tajawal','Segoe UI',Arial,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F4EFE2;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:600px;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0E5C4D 0%,#073B30 100%);padding:32px 24px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,0.15);padding:12px 16px;border-radius:12px;backdrop-filter:blur(10px);">
                <span style="color:#FFFFFF;font-size:24px;font-weight:800;">سباير ميديكال</span>
                <div style="color:rgba(255,255,255,0.85);font-size:11px;margin-top:2px;">Spir Medical</div>
              </div>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding:32px 24px;color:#0F1A1C;line-height:1.7;font-size:14px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background:#F4EFE2;padding:20px 24px;border-top:1px solid #E5DCC1;text-align:center;">
              <div style="color:#666460;font-size:11px;line-height:1.7;">
                ${footerText || 'منصة طبية رقمية متكاملة في العراق'}
                <br />
                <a href="https://spir-medical.com" style="color:#0E5C4D;text-decoration:none;font-weight:700;">spirmedical.iq</a>
                <br />
                <span style="color:#888780;font-size:10px;margin-top:8px;display:inline-block;">
                  © 2026 Spir Medical · جميع الحقوق محفوظة
                </span>
              </div>
            </td>
          </tr>
        </table>
        
        <!-- Unsubscribe note -->
        <table width="100%" style="max-width:600px;margin-top:16px;">
          <tr>
            <td style="text-align:center;color:#888780;font-size:10px;line-height:1.6;">
              تلقّيت هذا الإيميل لأنك مسجّل في سباير ميديكال.<br />
              لإيقاف الإيميلات، يمكنك تعديل التفضيلات من إعدادات حسابك.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function button(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:#0E5C4D;color:#FFFFFF;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:800;font-size:13px;">${text}</a>`;
}

function welcomePatientEmail(data: Record<string, string | number>): string {
  const name = data.name || 'عزيزي';
  return emailWrapper(`
    <h1 style="font-size:22px;font-weight:800;color:#0F1A1C;margin:0 0 16px;">مرحباً ${name}! 🎉</h1>
    <p style="margin:0 0 16px;color:#1F2A2C;">أهلاً بك في عائلة <strong>سباير ميديكال</strong> - منصتك الطبية الذكية في العراق.</p>
    <p style="margin:0 0 20px;color:#1F2A2C;">يمكنك الآن:</p>
    <ul style="margin:0 0 24px;padding-inline-start:20px;color:#1F2A2C;">
      <li style="margin-bottom:8px;">🩸 طلب سحب دم منزلي</li>
      <li style="margin-bottom:8px;">💬 استشارات طبية بالفيديو</li>
      <li style="margin-bottom:8px;">💊 توصيل أدوية</li>
      <li style="margin-bottom:8px;">📋 إدارة سجلك الطبي</li>
      <li>👨‍👩‍👧 إضافة أفراد عائلتك</li>
    </ul>
    <div style="text-align:center;margin:24px 0;">
      ${button('ابدأ الآن ←', 'https://spir-medical.com/dashboard')}
    </div>
    <p style="margin:24px 0 0;color:#888780;font-size:12px;line-height:1.7;">
      📞 الدعم: <strong>122</strong> (24/7)<br />
      💬 مفتوح للأسئلة على المنصة
    </p>
  `);
}

function welcomeSpecialistEmail(data: Record<string, string | number>): string {
  const name = data.name || 'الدكتور';
  return emailWrapper(`
    <h1 style="font-size:22px;font-weight:800;color:#0F1A1C;margin:0 0 16px;">مرحباً د. ${name}! 👨‍⚕️</h1>
    <p style="margin:0 0 16px;">يسعدنا انضمامك لنخبة أخصائيي <strong>سباير ميديكال</strong>.</p>
    <p style="margin:0 0 16px;color:#1F2A2C;"><strong>خطواتك التالية:</strong></p>
    <ol style="margin:0 0 24px;padding-inline-start:20px;color:#1F2A2C;">
      <li style="margin-bottom:8px;">📋 أكمل ملفك المهني (الشهادات، الخبرة)</li>
      <li style="margin-bottom:8px;">📅 حدّد ساعات عملك في صفحة الجدول</li>
      <li style="margin-bottom:8px;">💰 اضبط أسعار الاستشارات</li>
      <li>📷 ارفع صورة شخصية مهنية</li>
    </ol>
    <div style="background:#FBF4E0;border-inline-start:4px solid #B8540C;padding:14px;border-radius:10px;margin:24px 0;">
      <strong style="color:#B8540C;">⚠️ مهم</strong>
      <p style="margin:6px 0 0;color:#854F0B;font-size:13px;">سيتم مراجعة ملفك من قبل فريقنا خلال 24 ساعة قبل تفعيل حسابك.</p>
    </div>
    <div style="text-align:center;margin:24px 0;">
      ${button('أكمل ملفي', 'https://spir-medical.com/specialist/account/edit')}
    </div>
  `);
}

function appointmentConfirmedEmail(data: Record<string, string | number>): string {
  const service = data.service || 'الخدمة';
  const date = data.date || 'قريباً';
  const time = data.time || '';
  return emailWrapper(`
    <h1 style="font-size:22px;font-weight:800;color:#0F1A1C;margin:0 0 16px;">✓ تم تأكيد موعدك</h1>
    <p style="margin:0 0 24px;color:#1F2A2C;">شكراً لك! تم تأكيد طلبك بنجاح.</p>
    
    <div style="background:#F4EFE2;border-radius:12px;padding:20px;margin:0 0 24px;">
      <table width="100%" style="font-size:13px;color:#1F2A2C;">
        <tr>
          <td style="padding:6px 0;color:#666460;width:120px;">الخدمة:</td>
          <td style="padding:6px 0;font-weight:700;">${service}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#666460;">التاريخ:</td>
          <td style="padding:6px 0;font-weight:700;">${date}</td>
        </tr>
        ${time ? `<tr>
          <td style="padding:6px 0;color:#666460;">الوقت:</td>
          <td style="padding:6px 0;font-weight:700;">${time}</td>
        </tr>` : ''}
      </table>
    </div>
    
    <p style="margin:0 0 16px;color:#1F2A2C;"><strong>ما القادم؟</strong></p>
    <ul style="margin:0 0 24px;padding-inline-start:20px;color:#1F2A2C;font-size:13px;">
      <li style="margin-bottom:6px;">سيتواصل معك الأخصائي قبل الموعد بساعة</li>
      <li style="margin-bottom:6px;">يمكنك تتبع الحالة من التطبيق</li>
      <li>الدفع كاش عند الإستلام</li>
    </ul>
    
    <div style="text-align:center;margin:24px 0;">
      ${button('تتبع طلبي', `https://spir-medical.com/appointments/${data.id || ''}/track`)}
    </div>
  `);
}

function appointmentReminderEmail(data: Record<string, string | number>): string {
  const service = data.service || 'الخدمة';
  const time = data.time || 'قريباً';
  return emailWrapper(`
    <h1 style="font-size:22px;font-weight:800;color:#0F1A1C;margin:0 0 16px;">⏰ تذكير: موعدك غداً</h1>
    <p style="margin:0 0 20px;color:#1F2A2C;">لا تنسَ موعدك القادم!</p>
    
    <div style="background:#FBF4E0;border-inline-start:4px solid #B8540C;border-radius:10px;padding:16px;margin:0 0 24px;">
      <div style="font-weight:800;color:#B8540C;margin-bottom:6px;">${service}</div>
      <div style="color:#854F0B;font-size:13px;">${time}</div>
    </div>
    
    <p style="margin:0 0 16px;color:#1F2A2C;"><strong>قبل الموعد:</strong></p>
    <ul style="margin:0 0 24px;padding-inline-start:20px;color:#1F2A2C;font-size:13px;">
      <li style="margin-bottom:6px;">جهّز العنوان والمعلومات الأساسية</li>
      <li style="margin-bottom:6px;">جهّز المبلغ نقداً (إن لزم)</li>
      <li>كن متاحاً للتواصل قبل الموعد بـ 30 دقيقة</li>
    </ul>
    
    <div style="text-align:center;margin:24px 0;">
      ${button('عرض التفاصيل', `https://spir-medical.com/appointments/${data.id || ''}`)}
    </div>
  `);
}

function ratingRequestEmail(data: Record<string, string | number>): string {
  const service = data.service || 'الخدمة';
  return emailWrapper(`
    <h1 style="font-size:22px;font-weight:800;color:#0F1A1C;margin:0 0 16px;">⭐ كيف كانت تجربتك؟</h1>
    <p style="margin:0 0 16px;color:#1F2A2C;">نأمل أن تكون تجربتك مع <strong>${service}</strong> رائعة.</p>
    <p style="margin:0 0 24px;color:#1F2A2C;">تقييمك يساعدنا على تحسين الخدمة ويفيد المرضى الآخرين.</p>
    
    <div style="text-align:center;font-size:32px;margin:24px 0;">
      <span style="color:#B8540C;">⭐ ⭐ ⭐ ⭐ ⭐</span>
    </div>
    
    <div style="text-align:center;margin:24px 0;">
      ${button('قيّم الآن (30 ثانية فقط)', `https://spir-medical.com/appointments/${data.id || ''}/rate`)}
    </div>
    
    <p style="margin:24px 0 0;color:#888780;font-size:11px;text-align:center;">شكراً لاختيارك سباير ميديكال 💚</p>
  `);
}
