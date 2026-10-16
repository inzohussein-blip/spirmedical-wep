/**
 * ═══════════════════════════════════════════════════════════════
 * POST /api/admin/users/create — إنشاء حسابٍ من لوحة الإدارة
 * ═══════════════════════════════════════════════════════════════
 *
 * ما كان مكسوراً (قِيس على الإنتاج، 16 تشرين الأول):
 *  ① **كلُّ إنشاءٍ يفشل.** مُشغِّل `handle_new_user` على `auth.users` يُدرج صفَّ
 *    `public.users` لحظةَ إنشاء حساب الدخول، ثمّ كان هذا المسار يُدرجه ثانيةً بـ`insert`
 *    فيسقط بمفتاحٍ مكرَّر، ويحذف حسابَ الدخول. الآن `upsert` على المعرّف.
 *  ② **حسابُ هاتفٍ بلا رمز دخول:** أوّلُ من يكتب رقمه بأيّ ستّة أرقام «يمتلكه» (claimed).
 *    الآن يُضبط رمزٌ مؤقّتٌ فوراً (أو رابطُ تفعيلٍ عبر واتساب).
 *  ③ **بريدٌ اختياريّ يكسر الدخول:** كان يصير بريدَ الدخول، فيرفض «الرقم + الرمز» الحسابَ.
 *    المريضُ والمختصّ يدخلان بالرقم دائماً (بريدٌ اصطناعيّ + كلمةُ سرٍّ مشتقّة كما في
 *    التسجيل الذاتيّ)، والبريدُ يُحفظ في الملفّ فقط. الإدارةُ وحدها تدخل بالبريد.
 *  ④ كلمةُ السرّ المؤقّتة كانت من `Math.random`.
 * ═══════════════════════════════════════════════════════════════
 */

import { notifyServiceWaitlist } from '@/lib/service-waitlist';
// البريدُ الاصطناعيّ نفسُه الذي يستعمله دخولُ الهاتف: كان هنا `@spir.app`،
// فحسابٌ تُنشئه الإدارة لا يطابقه دخولُ الرمز فيُنشئ حساباً يتيماً بلا ملفّ.
import { derivePhonePassword, phoneToEmail } from '@/lib/auth/phone-credentials';
import { generateTemporaryPin, setLoginPin } from '@/lib/auth/login-pin';
import { isWaVerifyAvailable } from '@/lib/whatsapp/inbound-verify';
import { resetPinUrl } from '@/lib/whatsapp/share';
import { randomInt } from 'crypto';
import { isEmail } from '@/lib/validations/is-email';
import { SITE_ORIGIN } from '@/lib/seo/origin';
import { NextResponse } from 'next/server';
import { createClient as createSbClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { toSpecialistType, type SpecialistType } from '@/lib/specialist-types';

export const dynamic = 'force-dynamic';

// ─── Validation ─────────────────────────────────────────────────

interface CreateUserBody {
  role: 'patient' | 'specialist' | 'admin' | 'super_admin' | 'manager' | 'support';
  phone: string;
  full_name: string;
  email?: string;
  governorate?: string;
  specialist_type?: SpecialistType;
  specialist_bio?: string;
  specialist_years_exp?: number;
  send_welcome?: boolean;
}

function normalizePhone(phone: string): string {
  // 07XXXXXXXXX → +9647XXXXXXXXX
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('964')) return `+${digits}`;
  if (digits.startsWith('07')) return `+964${digits.slice(1)}`;
  if (digits.startsWith('7')) return `+964${digits}`;
  return phone;
}

/** كلمةُ سرٍّ مؤقّتة لحساب إدارة (يدخل بالبريد) — عشوائيّةٌ تشفيريّاً */
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghjkmnpqrstuvwxyz';
  let out = '';
  for (let i = 0; i < 14; i++) out += chars[randomInt(chars.length)];
  return out;
}

/** المريضُ والمختصّ يدخلان بالرقم + رمز الدخول؛ الإدارةُ بالبريد وكلمة السرّ */
const PHONE_ROLES = new Set(['patient', 'specialist']);
const ROLE_AR: Record<string, string> = {
  patient: 'مريض', specialist: 'مختصّ', admin: 'مدير', super_admin: 'مدير عام', manager: 'مشرف', support: 'دعم',
};

// ─── POST handler ───────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    // ─── 1. تحقّق من صلاحية المُنفّذ (super_admin only) ───
    const supabase = await createClient();
    const { data: { user: callerAuth } } = await supabase.auth.getUser();

    if (!callerAuth) {
      return NextResponse.json(
        { success: false, error: 'يجب تسجيل الدخول' },
        { status: 401 }
      );
    }

    const { data: caller } = await supabase
      .from('users')
      .select('role')
      .eq('id', callerAuth.id)
      .single();

    if (!caller || !['super_admin', 'admin'].includes(caller.role)) {
      return NextResponse.json(
        { success: false, error: 'غير مصرّح — للإدارة فقط' },
        { status: 403 }
      );
    }

    // ─── 2. parse body ───
    const body = (await request.json()) as CreateUserBody;

    // ─── 3. validation ───
    if (!body.role || !body.phone || !body.full_name) {
      return NextResponse.json(
        { success: false, error: 'نوعُ الحساب ورقمُ الهاتف والاسمُ مطلوبة' },
        { status: 400 }
      );
    }

    const validRoles = ['patient', 'specialist', 'admin', 'super_admin', 'manager', 'support'];
    if (!validRoles.includes(body.role)) {
      return NextResponse.json(
        { success: false, error: 'نوعُ الحساب غير صالح' },
        { status: 400 }
      );
    }

    // المديرُ ينشئ مديراً ومشرفاً ودعماً؛ والمديرُ العامّ وحده ينشئ مديراً عامّاً (لا ترقيةَ فوق الذات)
    if (body.role === 'super_admin' && caller.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'إنشاءُ مديرٍ عامٍّ للمدير العام وحده' },
        { status: 403 }
      );
    }

    // specialist يحتاج type
    if (body.role === 'specialist' && !toSpecialistType(body.specialist_type)) {
      return NextResponse.json(
        { success: false, error: 'اختر تخصّصَ المختصّ' },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(body.phone);
    if (!/^\+9647\d{9}$/.test(normalizedPhone)) {
      return NextResponse.json(
        { success: false, error: 'رقم الهاتف غير صالح — مثال: 07712345678' },
        { status: 400 }
      );
    }

    const phoneLogin = PHONE_ROLES.has(body.role);
    const email = body.email?.trim().toLowerCase() || null;
    if (email && !isEmail(email)) {
      return NextResponse.json({ success: false, error: 'البريد الإلكتروني غير صالح' }, { status: 400 });
    }
    if (!phoneLogin && !email) {
      return NextResponse.json(
        { success: false, error: 'حسابُ الإدارة يدخل بالبريد — البريدُ مطلوب' },
        { status: 400 }
      );
    }

    // ─── 4. تحقّق من عدم وجود الرقم سابقاً ───
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const admin = createSbClient<Database>(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const existingRes = await admin.from('users')
      .select('id, phone, role')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    if (existingRes.data) {
      return NextResponse.json(
        {
          success: false,
          error: `هذا الرقم مسجّلٌ سابقاً (${ROLE_AR[existingRes.data.role] ?? existingRes.data.role})`,
          existing_user_id: existingRes.data.id,
          existing_role: existingRes.data.role,
        },
        { status: 409 }
      );
    }

    // ─── 5. إنشاء حساب Auth ───
    // حسابُ الهاتف: بريدٌ اصطناعيّ وكلمةُ سرٍّ مشتقّة — ما يتوقّعه دخولُ «الرقم + الرمز»
    const tempPassword = phoneLogin ? null : generateTempPassword();
    const authEmail = phoneLogin ? phoneToEmail(normalizedPhone) : email!;

    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email: authEmail,
      password: tempPassword ?? derivePhonePassword(normalizedPhone),
      email_confirm: true,
      // الدورُ في البيانات الوصفيّة: مُشغِّلُ handle_new_user يُنشئ الصفَّ به
      user_metadata: {
        full_name: body.full_name,
        role: body.role,
        phone: normalizedPhone,
        created_by_admin: callerAuth.id,
      },
    });

    if (authErr || !authData?.user) {
      logger.error('Failed to create auth user', {
        phone: normalizedPhone,
        error: authErr?.message,
      });
      const taken = /already|registered|exists/i.test(authErr?.message ?? '');
      return NextResponse.json(
        {
          success: false,
          error: taken
            ? phoneLogin
              ? 'لهذا الرقم حسابُ دخولٍ قائم — ابحث عنه في المرضى أو المختصّين'
              : 'هذا البريد مستعملٌ لحسابٍ آخر'
            : `فشل إنشاء حساب الدخول: ${authErr?.message ?? 'خطأ غير معروف'}`,
        },
        { status: taken ? 409 : 500 }
      );
    }

    const newUserId = authData.user.id;

    // ─── 6. إنشاء profile في public.users ───
    const profileData: Record<string, unknown> = {
      id: newUserId,
      phone: normalizedPhone,
      full_name: body.full_name,
      email,
      role: body.role,
      governorate: body.governorate || null,
      created_at: new Date().toISOString(),
    };

    // حقول إضافية للمختصّ
    if (body.role === 'specialist') {
      profileData.specialist_type = body.specialist_type;
      profileData.approval_status = 'approved'; // approved مباشرة لأنّه من admin
      profileData.specialist_bio = body.specialist_bio || null;
      profileData.specialist_years_exp = body.specialist_years_exp || null;
    } else if (body.role === 'patient') {
      profileData.approval_status = 'approved';
    } else {
      // admins
      profileData.approval_status = 'approved';
    }

    // profileData حمولة ديناميكية (حقول تختلف حسب الدور)؛ cast حدّي على generics الـ Insert
    // upsert لا insert: مُشغِّلُ handle_new_user أدرج الصفَّ للتوّ (كان هذا يُسقط كلَّ إنشاء)
    const insertRes = await admin.from('users').upsert(profileData as never, { onConflict: 'id' });

    if (insertRes.error) {
      // rollback - حذف auth user
      await admin.auth.admin.deleteUser(newUserId);
      logger.error('Failed to insert user profile', {
        phone: normalizedPhone,
        error: insertRes.error.message,
      });
      return NextResponse.json(
        { success: false, error: `فشل إنشاء profile: ${insertRes.error.message}` },
        { status: 500 }
      );
    }

    // مختصٌّ معتمَدٌ فوراً قد يفتح نوعاً كان بلا مختصّ — أخطِر قائمةَ انتظاره (0048)
    if (body.role === 'specialist' && body.specialist_type) {
      await notifyServiceWaitlist(body.specialist_type).catch((e) =>
        logger.warn('waitlist notify failed', { error: e instanceof Error ? e.message : String(e) }));
    }

    // ─── 7. Audit log ───
    await logAuditEvent({
      action: 'admin.user_created',
      user_id: callerAuth.id,
      metadata: {
        created_user_id: newUserId,
        created_user_role: body.role,
        created_user_phone: normalizedPhone,
        specialist_type: body.specialist_type,
      },
    });

    logger.info('Admin created user', {
      created_by: callerAuth.id,
      new_user_id: newUserId,
      role: body.role,
      phone: normalizedPhone,
    });

    // ─── 8. بيانات الدخول ───
    const baseUrl = SITE_ORIGIN;
    let tempPin: string | null = null;
    if (phoneLogin) {
      // بلا رمزٍ كان أوّلُ من يكتب الرقمَ يمتلك الحساب — رمزٌ مؤقّتٌ يُغلق ذلك فوراً
      tempPin = generateTemporaryPin();
      if (!(await setLoginPin(newUserId, tempPin))) tempPin = null;
    }
    const activationUrl = phoneLogin && (await isWaVerifyAvailable().catch(() => false))
      ? resetPinUrl(baseUrl, normalizedPhone)
      : null;

    return NextResponse.json({
      success: true,
      user_id: newUserId,
      phone: normalizedPhone,
      full_name: body.full_name,
      role: body.role,
      login_method: phoneLogin ? 'phone_pin' : 'email_password',
      email: phoneLogin ? undefined : authEmail,
      temp_pin: tempPin ?? undefined,
      temp_password: tempPassword ?? undefined,
      login_url: phoneLogin ? `${baseUrl}/login/phone` : `${baseUrl}/admin-login`,
      activation_url: activationUrl ?? undefined,
      warning: phoneLogin && !tempPin ? 'تعذّر ضبط رمز الدخول — أنشئه من صفحة الحساب' : undefined,
    });
  } catch (err) {
    logger.error('User creation exception', {
      error: err instanceof Error ? err.message : 'unknown',
    });
    return NextResponse.json(
      { success: false, error: 'خطأ في النظام' },
      { status: 500 }
    );
  }
}
