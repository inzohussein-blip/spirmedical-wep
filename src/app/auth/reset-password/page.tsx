import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ResetPasswordForm from './ResetPasswordForm';

// ═══════════════════════════════════════════════════════════
// 🔑 صفحة تعيين كلمة مرور جديدة (هبوط رابط الاستعادة)
// ═══════════════════════════════════════════════════════════
// كان `requestPasswordReset` يوجّه إلى `/auth/reset-password` — وهو مسار
// **غير موجود** في الشجرة، فكان رابط الاستعادة يفضي إلى 404 ولا سبيل
// لمستخدمي البريد لاستعادة حساباتهم إطلاقاً (صفحة «نسيت الرمز؟» تقبل
// رقم هاتف فقط، ومستخدم البريد هاتفه نائبٌ مؤقّت `+temp_`).
//
// نتبادل الرمز هنا في الخادم — لا عبر `/auth/callback` — كي لا يخطف
// توجيهُ «أكمل ملفك» رحلةَ الاستعادة (هاتف مستخدم البريد نائب دائماً).

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'تعيين كلمة مرور جديدة · سباير ميديكال',
  description: 'اختر كلمة مرور جديدة لحسابك',
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { code?: string; error_description?: string };
}) {
  const supabase = createClient();

  // رابط الاستعادة يصل بـ`?code=` (تدفّق PKCE) — نبادله بجلسة
  if (searchParams.code) {
    await supabase.auth.exchangeCodeForSession(searchParams.code);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const linkProblem = searchParams.error_description || (!user ? 'expired' : null);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-700 mb-2">كلمة مرور جديدة</h1>
          <p className="text-gray-600">
            {linkProblem ? 'الرابط غير صالح' : 'اختر كلمة مرور جديدة لحسابك'}
          </p>
        </div>

        {linkProblem ? (
          <div className="bg-white p-6 rounded-lg shadow text-center space-y-4">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              انتهت صلاحية رابط الاستعادة أو سبق استخدامه.
            </div>
            <Link
              href="/forgot"
              className="inline-block w-full bg-emerald-600 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-700"
            >
              اطلب رابطاً جديداً
            </Link>
          </div>
        ) : (
          <ResetPasswordForm />
        )}

        <div className="text-center mt-6 text-sm text-gray-600">
          <Link href="/login" className="text-emerald-700 hover:underline">
            العودة لتسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
}
