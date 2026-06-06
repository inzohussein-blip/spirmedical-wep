/**
 * OTP Service — إرسال والتحقق
 * يدعم 3 قنوات: WhatsApp, Telegram, SMS
 */

import { createAdminClient } from '@/lib/supabase/server';
import { sendOtpMessage, normalizePhone } from './meta-client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export type OtpChannel = 'whatsapp' | 'telegram' | 'sms';
export type OtpPurpose = 'login' | 'verify_phone' | 'sensitive_action' | 'register';

export interface SendOtpResult {
  success: boolean;
  otpId?: string;
  channel?: OtpChannel;
  error?: string;
  code?: string;        // رمز فني مختصر للتشخيص (مثل DB_INSERT_42501)
  expiresAt?: string;
  retryAfter?: number;
}

export interface VerifyOtpResult {
  success: boolean;
  userId?: string;
  error?: string;
  remainingAttempts?: number;
}

// ─── Constants ───
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5;
const MAX_VERIFY_ATTEMPTS = 5;
const MAX_OTPS_PER_HOUR = 5;

/**
 * توليد رمز OTP عشوائي (6 أرقام)
 */
function generateOtp(): string {
  // crypto.randomInt آمن أكثر من Math.random
  const code = crypto.randomInt(100000, 1000000);
  return code.toString().padStart(OTP_LENGTH, '0');
}

/**
 * Hash OTP باستخدام bcrypt (لا نخزّن الرمز الأصلي)
 */
async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, 8); // 8 rounds سريع للـ OTP (مو password)
}

async function verifyOtpHash(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}

/**
 * فحص rate limiting: هل المستخدم طلب >5 OTPs في آخر ساعة؟
 */
async function checkRateLimit(phone: string): Promise<{
  allowed: boolean;
  retryAfter?: number;
}> {
  const supabase = createAdminClient();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from('whatsapp_otp')
    .select('*', { count: 'exact', head: true })
    .eq('phone', phone)
    .gte('created_at', oneHourAgo);

  if (error) {
    // eslint-disable-next-line no-console
    console.error('[OTP] Rate limit check failed:', error);
    return { allowed: true }; // fail open في حالة خطأ DB
  }

  if ((count || 0) >= MAX_OTPS_PER_HOUR) {
    return {
      allowed: false,
      retryAfter: 3600,
    };
  }

  return { allowed: true };
}

// ═══════════════════════════════════════════════════════════════════
// 📤 إرسال OTP
// ═══════════════════════════════════════════════════════════════════

export async function sendOtp(params: {
  phone: string;
  channel: OtpChannel;
  userId?: string;
  purpose?: OtpPurpose;
  ipAddress?: string;
  userAgent?: string;
}): Promise<SendOtpResult> {
  const { phone, channel, userId, purpose = 'login', ipAddress, userAgent } = params;

  // ─── 1. تطبيع رقم الهاتف ───
  const normalized = normalizePhone(phone);
  if (normalized.length < 10) {
    return { success: false, error: 'رقم الهاتف غير صحيح', code: 'PHONE_INVALID' };
  }

  // ─── 2. Rate limiting ───
  const rateCheck = await checkRateLimit(normalized);
  if (!rateCheck.allowed) {
    return {
      success: false,
      error: 'تجاوزت الحد الأقصى للمحاولات. حاول بعد ساعة.',
      code: 'RATE_LIMIT',
      retryAfter: rateCheck.retryAfter,
    };
  }

  // ─── 3. توليد OTP ───
  const otp = generateOtp();
  const otpHash = await hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // ─── 4. حفظ في DB ───
  // نولّد UUID مسبقاً لتجنّب مشاكل insert().select().single()
  const otpId = crypto.randomUUID();
  const supabase = createAdminClient();
  const { error: dbError } = await supabase
    .from('whatsapp_otp')
    .insert({
      id: otpId,
      phone: normalized,
      user_id: userId,
      otp_hash: otpHash,
      channel,
      status: 'pending',
      purpose,
      ip_address: ipAddress,
      user_agent: userAgent,
      expires_at: expiresAt.toISOString(),
    });

  if (dbError) {
    // eslint-disable-next-line no-console
    console.error('[OTP] DB insert failed:', dbError);
    const pgCode = dbError?.code ? `DB_${dbError.code}` : 'DB_INSERT';
    return { success: false, error: 'فشل حفظ الرمز', code: pgCode };
  }

  const otpRecord = { id: otpId };

  // ─── 5. إرسال عبر القناة المطلوبة ───
  let sendResult: { success: boolean; messageId?: string; error?: string; errorCode?: number };

  switch (channel) {
    case 'whatsapp':
      sendResult = await sendOtpMessage(normalized, otp);
      break;

    case 'telegram':
      // TODO: استخدم Telegram bot الموجود
      sendResult = await sendOtpViaTelegram(normalized, otp);
      break;

    case 'sms':
      // TODO: تكامل مع مزود SMS عراقي
      sendResult = await sendOtpViaSms(normalized, otp);
      break;

    default:
      return { success: false, error: 'قناة غير مدعومة', code: 'CHANNEL_UNSUPPORTED' };
  }

  // ─── 6. تحديث حالة OTP في DB ───
  await supabase
    .from('whatsapp_otp')
    .update({
      status: sendResult.success ? 'sent' : 'failed',
      provider_message_id: sendResult.messageId,
    })
    .eq('id', otpRecord.id);

  if (!sendResult.success) {
    return { success: false, error: sendResult.error || 'فشل الإرسال', code: sendResult.errorCode ? `META_${sendResult.errorCode}` : 'SEND_FAILED' };
  }

  return {
    success: true,
    otpId: otpRecord.id,
    channel,
    expiresAt: expiresAt.toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════════
// ✅ التحقق من OTP
// ═══════════════════════════════════════════════════════════════════

export async function verifyOtp(params: {
  phone: string;
  code: string;
  purpose?: OtpPurpose;
}): Promise<VerifyOtpResult> {
  const { phone, code, purpose = 'login' } = params;

  const normalized = normalizePhone(phone);
  if (!/^\d{6}$/.test(code)) {
    return { success: false, error: 'الرمز يجب أن يكون 6 أرقام' };
  }

  const supabase = createAdminClient();

  // ─── 1. ابحث عن آخر OTP نشط ───
  const { data: otp, error: findError } = await supabase
    .from('whatsapp_otp')
    .select('id, otp_hash, expires_at, verify_attempts, status, user_id')
    .eq('phone', normalized)
    .eq('purpose', purpose)
    .in('status', ['sent', 'pending'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (findError || !otp) {
    return { success: false, error: 'لم يتم العثور على رمز نشط' };
  }

  // ─── 2. تحقق من الصلاحية ───
  if (new Date(otp.expires_at) < new Date()) {
    await supabase
      .from('whatsapp_otp')
      .update({ status: 'expired' })
      .eq('id', otp.id);
    return { success: false, error: 'انتهت صلاحية الرمز' };
  }

  // ─── 3. تحقق من عدد المحاولات ───
  if (otp.verify_attempts >= MAX_VERIFY_ATTEMPTS) {
    await supabase
      .from('whatsapp_otp')
      .update({ status: 'failed' })
      .eq('id', otp.id);
    return {
      success: false,
      error: 'تجاوزت الحد الأقصى للمحاولات',
      remainingAttempts: 0,
    };
  }

  // ─── 4. زد عداد المحاولات ───
  await supabase
    .from('whatsapp_otp')
    .update({ verify_attempts: otp.verify_attempts + 1 })
    .eq('id', otp.id);

  // ─── 5. قارن الـ hash ───
  const isValid = await verifyOtpHash(code, otp.otp_hash);

  if (!isValid) {
    return {
      success: false,
      error: 'الرمز غير صحيح',
      remainingAttempts: MAX_VERIFY_ATTEMPTS - otp.verify_attempts - 1,
    };
  }

  // ─── 6. ✅ نجح — تحديث الحالة ───
  await supabase
    .from('whatsapp_otp')
    .update({
      status: 'verified',
      verified_at: new Date().toISOString(),
    })
    .eq('id', otp.id);

  // إذا كان purpose = verify_phone، حدّث المستخدم
  if (purpose === 'verify_phone' && otp.user_id) {
    await supabase
      .from('users')
      .update({
        wa_verified: true,
        wa_verified_at: new Date().toISOString(),
      })
      .eq('id', otp.user_id);
  }

  return {
    success: true,
    userId: otp.user_id || undefined,
  };
}

// ═══════════════════════════════════════════════════════════════════
// 🔄 Channel fallback handlers (placeholder)
// ═══════════════════════════════════════════════════════════════════

async function sendOtpViaTelegram(
  phone: string,
  otp: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // TODO: تكامل مع Telegram bot الموجود
  // يحتاج user_telegram_links لربط الرقم بالحساب
  // eslint-disable-next-line no-console
  console.warn(`[Telegram] Would send OTP ${otp} to ${phone}`);
  return { success: false, error: 'Telegram OTP غير مفعّل بعد' };
}

async function sendOtpViaSms(
  phone: string,
  otp: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // TODO: تكامل مع مزود SMS عراقي (Asiacell/Zain/etc)
  // eslint-disable-next-line no-console
  console.warn(`[SMS] Would send OTP ${otp} to ${phone}`);
  return { success: false, error: 'SMS غير مفعّل بعد' };
}
