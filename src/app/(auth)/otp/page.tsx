// تعطيل pre-rendering — هذه الصفحة تستخدم searchParams
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { verifyOtp } from '../login/actions';

const searchParamsSchema = z.object({
  phone: z.string().min(10).max(20),
  error: z.string().max(500).optional(),
});

export default function OtpPage({
  searchParams,
}: {
  searchParams: { phone?: string; error?: string };
}) {
  const params = searchParamsSchema.safeParse(searchParams);
  if (!params.success) redirect('/login');

  const { phone, error } = params.data;

  // إخفاء جزء من الرقم لإظهاره (privacy)
  const maskedPhone =
    phone.length > 6
      ? phone.slice(0, 4) + ' ●●● ' + phone.slice(-3)
      : phone;

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-paper via-paper-3 to-paper-2">
      {/* خلفية ديكورية */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-emerald/8 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-amber/8 blur-3xl" />
        <div className="absolute right-1/4 top-1/2 h-64 w-64 rounded-full bg-emerald-soft/30 blur-3xl" />
      </div>

      {/* رابط العودة */}
      <Link
        href="/login"
        className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-ink-2 shadow-sm backdrop-blur-md transition-all hover:bg-white hover:shadow-md sm:right-6 sm:top-6"
      >
        <span className="text-base">←</span>
        <span className="hidden sm:inline">تغيير الرقم</span>
      </Link>

      {/* الحاوية الرئيسية */}
      <div className="relative flex min-h-screen items-center justify-center px-5 py-12">
        <div className="mx-auto w-full max-w-md">
          {/* الشعار */}
          <div className="mb-8 flex flex-col items-center gap-4 text-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl bg-emerald/20 blur-xl" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald font-serif-italic text-5xl font-medium text-paper-3 shadow-2xl shadow-emerald/40">
                س
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-ink">
                Spir Medical
              </h1>
              <p className="text-sm text-ink-3">سباير ميديكال</p>
            </div>
          </div>

          {/* بطاقة OTP */}
          <div className="rounded-3xl border border-white/50 bg-white/95 p-7 shadow-2xl shadow-ink/10 backdrop-blur-xl">
            {/* أيقونة SMS */}
            <div className="mb-5 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-emerald/20 blur-lg" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-soft text-3xl">
                  💬
                </div>
              </div>
            </div>

            {/* العنوان */}
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-extrabold tracking-tight text-ink">
                تحقّق من رقمك
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-3">
                أرسلنا رمزاً مكوّناً من ٦ أرقام إلى
              </p>
              <p
                dir="ltr"
                className="mt-2 inline-block rounded-xl bg-paper-2 px-3 py-1.5 font-mono text-sm font-bold text-ink"
              >
                {maskedPhone}
              </p>
            </div>

            {/* رسالة الخطأ */}
            {error && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-3 rounded-2xl border border-rose/20 bg-rose-soft/60 px-4 py-3 text-sm font-bold text-rose"
              >
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-rose text-xs text-white">
                  !
                </span>
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* النموذج */}
            <form action={verifyOtp} className="flex flex-col gap-5">
              <input type="hidden" name="phone" value={phone} />

              <div className="flex flex-col gap-2">
                <label htmlFor="token" className="sr-only">
                  رمز التحقق
                </label>
                <input
                  id="token"
                  type="text"
                  name="token"
                  placeholder="000000"
                  dir="ltr"
                  inputMode="numeric"
                  maxLength={6}
                  minLength={6}
                  pattern="\d{6}"
                  required
                  autoComplete="one-time-code"
                  autoFocus
                  className="rounded-2xl border-2 border-ink/10 bg-paper-3 px-4 py-5 text-center font-mono text-3xl font-bold tracking-[0.5em] text-ink outline-none transition-all duration-200 placeholder:text-ink-4 focus:border-emerald focus:ring-4 focus:ring-emerald/10"
                />
              </div>

              {/* زر التحقق */}
              <button
                type="submit"
                className="group relative overflow-hidden rounded-2xl bg-emerald px-6 py-4 text-base font-bold text-paper-3 shadow-lg shadow-emerald/30 transition-all duration-200 hover:bg-emerald-deep hover:shadow-xl hover:shadow-emerald/40 active:scale-[0.98]"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span>تحقّق وادخل</span>
                  <span className="transition-transform group-hover:-translate-x-1">
                    ←
                  </span>
                </span>
              </button>
            </form>

            {/* الفاصل */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-ink/10" />
              <span className="text-xs font-bold text-ink-4">إعادة الإرسال</span>
              <div className="h-px flex-1 bg-ink/10" />
            </div>

            {/* رابط إعادة الإرسال */}
            <p className="text-center text-sm text-ink-3">
              لم يصلك الرمز؟{' '}
              <Link
                href="/login"
                className="font-bold text-emerald underline decoration-2 underline-offset-2"
              >
                إعادة الإرسال
              </Link>
            </p>
          </div>

          {/* تنبيه انتهاء الصلاحية */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-ink-3">
            <span className="text-base">⏱</span>
            <span className="font-bold">الرمز ينتهي خلال ٥ دقائق</span>
          </div>

          {/* الفوتر */}
          <p className="mt-8 text-center text-xs text-ink-4">
            © ٢٠٢٦ سباير ميديكال — جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </main>
  );
}
