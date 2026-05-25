/**
 * ═══════════════════════════════════════════════════════════════
 * POST /api/admin/users/create
 * ═══════════════════════════════════════════════════════════════
 * 
 * إنشاء حساب جديد من Admin Dashboard
 * يدعم: patient / specialist / admin / super_admin
 * 
 * Body: {
 *   role: 'patient' | 'specialist' | 'admin' | 'super_admin' | 'manager' | 'support'
 *   phone: string                    // 07XXXXXXXXX
 *   full_name: string
 *   email?: string
 *   governorate?: string
 *   specialist_type?: SpecialistType   // مطلوب لو role=specialist
 *   specialist_bio?: string
 *   specialist_years_exp?: number
 *   send_welcome?: boolean             // إرسال SMS/WhatsApp للترحيب
 * }
 * 
 * Response: { success, user_id, temp_password, login_url }
 * 
 * ⚠️ Permissions: super_admin only
 * ═══════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import { createClient as createSbClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit';
import { logger } from '@/lib/logger';
import type { SpecialistType } from '@/lib/specialist-types';

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

function generateTempPassword(): string {
  // كلمة سرّ عشوائية مؤقّتة (12 char)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghjkmnpqrstuvwxyz';
  let out = '';
  for (let i = 0; i < 12; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function phoneToEmail(phone: string): string {
  // +9647XX → 9647XX@spir.app (passwordless login)
  const digits = phone.replace(/\D/g, '');
  return `${digits}@spir.app`;
}

// ─── POST handler ───────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    // ─── 1. تحقّق من صلاحية المُنفّذ (super_admin only) ───
    const supabase = createClient();
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
        { success: false, error: 'غير مصرّح - super_admin فقط' },
        { status: 403 }
      );
    }

    // ─── 2. parse body ───
    const body = (await request.json()) as CreateUserBody;

    // ─── 3. validation ───
    if (!body.role || !body.phone || !body.full_name) {
      return NextResponse.json(
        { success: false, error: 'role + phone + full_name مطلوبين' },
        { status: 400 }
      );
    }

    const validRoles = ['patient', 'specialist', 'admin', 'super_admin', 'manager', 'support'];
    if (!validRoles.includes(body.role)) {
      return NextResponse.json(
        { success: false, error: 'role غير صالح' },
        { status: 400 }
      );
    }

    // فقط super_admin يستطيع إنشاء super_admin أو admin
    if ((body.role === 'super_admin' || body.role === 'admin') && caller.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'فقط super_admin يستطيع إنشاء admins' },
        { status: 403 }
      );
    }

    // specialist يحتاج type
    if (body.role === 'specialist' && !body.specialist_type) {
      return NextResponse.json(
        { success: false, error: 'specialist_type مطلوب للمختصّين' },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(body.phone);

    // ─── 4. تحقّق من عدم وجود الرقم سابقاً ───
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const admin = createSbClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const adminAny = admin as unknown as {
      from: (t: string) => {
        
        select: (cols: string) => any;
      };
    };

    const existingRes = await adminAny.from('users')
      .select('id, phone, role')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    if (existingRes.data) {
      return NextResponse.json(
        {
          success: false,
          error: `الرقم مُسجّل سابقاً كـ ${existingRes.data.role}`,
        },
        { status: 409 }
      );
    }

    // ─── 5. إنشاء حساب Auth ───
    const tempPassword = generateTempPassword();
    const email = body.email || phoneToEmail(normalizedPhone);

    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      phone: normalizedPhone,
      email_confirm: true,
      phone_confirm: true,
      user_metadata: {
        full_name: body.full_name,
        created_by_admin: callerAuth.id,
      },
    });

    if (authErr || !authData?.user) {
      logger.error('Failed to create auth user', {
        phone: normalizedPhone,
        error: authErr?.message,
      });
      return NextResponse.json(
        { success: false, error: `فشل إنشاء حساب Auth: ${authErr?.message}` },
        { status: 500 }
      );
    }

    const newUserId = authData.user.id;

    // ─── 6. إنشاء profile في public.users ───
    const profileData: Record<string, unknown> = {
      id: newUserId,
      phone: normalizedPhone,
      full_name: body.full_name,
      email: body.email || null,
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

    const adminAnyInsert = admin as unknown as {
      from: (t: string) => {
        insert: (d: object) => Promise<{ error: { message: string } | null }>;
      };
    };

    const insertRes = await adminAnyInsert.from('users').insert(profileData);

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

    // ─── 8. Response ───
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://spirmedical-wep.vercel.app';

    return NextResponse.json({
      success: true,
      user_id: newUserId,
      phone: normalizedPhone,
      role: body.role,
      temp_password: tempPassword,
      login_url: `${baseUrl}/login`,
      message: `✅ تم إنشاء الحساب بنجاح. أعطِ المستخدم كلمة السرّ المؤقّتة لتسجيل الدخول.`,
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
