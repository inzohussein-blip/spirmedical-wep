import { NextResponse, type NextRequest } from 'next/server';

/**
 * 🔒 لوحةُ الإدارة نافذةٌ منفصلة لا تُدخَل إلّا برابط (طلبُ المالك، 18 تشرين الأول).
 *
 * كان كلُّ زائرٍ يكتب `/admin` يُحوَّل إلى صفحة دخول الإدارة، وrobots.txt يُعلن المسارَ لكلّ زاحف، وحسابُ
 * المدير يدخل من `/login` العامّة كأيّ مستخدم. الآن:
 *   • `/admin` لغير المدير المسجَّل = «الصفحة غير موجودة» (لا تحويلَ يكشفها) — `lib/supabase/middleware.ts`.
 *   • `/login` العامّة ترفض حسابَ الإدارة برسالة «بيانات خاطئة» نفسِها — `signInWithEmail` و`auth/callback`.
 *   • صفحتا الدخول والإنشاء (`/admin-login`، `/admin-register`) تُفتحان بالرابط ذي المفتاح حين يُضبط
 *     `ADMIN_LOGIN_KEY`: `/admin-login?k=<المفتاح>` يضع كعكةً ويُزيل المفتاحَ من الشريط؛ وبدونهما «غير موجودة».
 *     بلا المتغيّر تبقى الصفحتان مفتوحتين كما كانتا (لا قفلَ للمالك بإعدادٍ ناقص).
 */
export const ADMIN_GATE_COOKIE = 'spir_admin_gate';
export const ADMIN_ENTRY_PATHS = ['/admin-login', '/admin-register'] as const;
export const ADMIN_GATE_MAX_AGE = 60 * 60 * 24 * 30;

export function isAdminEntryPath(pathname: string): boolean {
  return ADMIN_ENTRY_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** قيمةُ الكعكة: بصمةُ المفتاح لا المفتاحُ نفسه */
export async function adminGateToken(key: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`spir-admin-gate:${key}`));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('');
}

function sameString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export type AdminGateDecision = 'open' | 'grant' | 'deny';

/**
 * open — لا مفتاحَ مضبوط، أو الكعكةُ صحيحة · grant — المفتاحُ في الرابط صحيح (ضع الكعكة) · deny — «غير موجودة»
 */
export async function decideAdminGate(input: {
  key: string | undefined;
  queryKey: string | null;
  cookie: string | undefined;
}): Promise<AdminGateDecision> {
  const key = input.key?.trim();
  if (!key) return 'open';
  if (input.queryKey && sameString(input.queryKey, key)) return 'grant';
  if (input.cookie && sameString(input.cookie, await adminGateToken(key))) return 'open';
  return 'deny';
}

export const ADMIN_ROLE_NAMES = ['super_admin', 'admin', 'manager', 'support'] as const;
export const isAdminAccountRole = (role: string | null | undefined): boolean =>
  !!role && (ADMIN_ROLE_NAMES as readonly string[]).includes(role);

/** رسالةُ الدخول العامّ لحساب إدارة: نفسُ رسالة البيانات الخاطئة — لا تكشف أنّه حسابُ إدارة */
export const PUBLIC_LOGIN_ADMIN_ERROR = 'البريد أو كلمة المرور خاطئة';

/** «الصفحة غير موجودة» بحالة 404 — لا تحويلَ يكشف أنّ المسارَ موجود */
export function adminNotFound(request: NextRequest): NextResponse {
  const res = NextResponse.rewrite(new URL('/__not-found', request.url), { status: 404 });
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return res;
}
