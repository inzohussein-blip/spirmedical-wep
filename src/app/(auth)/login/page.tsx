// تعطيل pre-rendering — searchParams
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { z } from 'zod';

const searchParamsSchema = z.object({
  error: z.string().max(500).optional(),
});

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const params = searchParamsSchema.safeParse(searchParams);
  const error = params.success ? params.data.error : undefined;

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-paper via-paper-3 to-paper-2">
      {/* خلفية ديكورية */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-emerald/8 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-amber/8 blur-3xl" />
      </div>

      {/* رابط العودة */}
      <Link
        href="/"
        className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-ink-2 shadow-sm backdrop-blur-md transition-all hover:bg-white hover:shadow-md sm:right-6 sm:top-6"
      >
        <span className="text-base">←</span>
        <span className="hidden sm:inline">للرئيسية</span>
      </Link>

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

          {/* البطاقة الرئيسية */}
          <div className="rounded-3xl border border-white/50 bg-white/95 p-7 shadow-2xl shadow-ink/10 backdrop-blur-xl">
            {/* العنوان */}
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-extrabold tracking-tight text-ink">
                كيف تود الدخول؟
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-3">
                اختر نوع حسابك للحصول على التجربة المناسبة.
                <br />
                يمكنك تغيير ذلك لاحقاً.
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

            {/* بطاقات اختيار الدور */}
            <div className="flex flex-col gap-3">
              {/* ضيف */}
              <Link
                href="/?guest=1"
                className="group flex items-center gap-4 rounded-2xl border-2 border-ink/10 bg-paper-3 p-4 transition-all hover:border-emerald/30 hover:bg-paper-2 active:scale-[0.98]"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-paper-2 text-2xl">
                  👁
                </div>
                <div className="flex-1 text-right">
                  <div className="text-base font-extrabold text-ink">ضيف</div>
                  <div className="text-xs text-ink-3">للتصفح فقط دون تسجيل</div>
                </div>
                <span className="text-2xl text-ink-4 transition-transform group-hover:translate-x-1">
                  ‹
                </span>
              </Link>

              {/* مراجع / مريض - الافتراضي */}
              <Link
                href="/login/phone?role=patient"
                className="group flex items-center gap-4 rounded-2xl border-2 border-emerald bg-emerald-soft/40 p-4 ring-2 ring-emerald/20 transition-all hover:bg-emerald-soft/60 active:scale-[0.98]"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald text-2xl text-paper-3">
                  ⊕
                </div>
                <div className="flex-1 text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-extrabold text-emerald-deep">
                      مراجع / مريض
                    </span>
                    <span className="rounded-full bg-emerald px-2 py-0.5 text-[10px] font-bold text-paper-3">
                      الأكثر استخداماً
                    </span>
                  </div>
                  <div className="text-xs text-emerald-deep/70">
                    حجز الخدمات وإدارة العائلة
                  </div>
                </div>
                <span className="text-2xl text-emerald transition-transform group-hover:translate-x-1">
                  ‹
                </span>
              </Link>

              {/* أخصائي */}
              <Link
                href="/login/phone?role=specialist"
                className="group flex items-center gap-4 rounded-2xl border-2 border-ink/10 bg-paper-3 p-4 transition-all hover:border-amber/40 hover:bg-paper-2 active:scale-[0.98]"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-soft text-2xl">
                  ⌬
                </div>
                <div className="flex-1 text-right">
                  <div className="text-base font-extrabold text-ink">أخصائي</div>
                  <div className="text-xs text-ink-3">
                    تقديم خدمات طبية للمراجعين
                  </div>
                </div>
                <span className="text-2xl text-ink-4 transition-transform group-hover:translate-x-1">
                  ‹
                </span>
              </Link>
            </div>

            {/* زر الإجراء الرئيسي */}
            <Link
              href="/login/phone?role=patient"
              className="group mt-5 block overflow-hidden rounded-2xl bg-emerald px-6 py-4 text-center text-base font-bold text-paper-3 shadow-lg shadow-emerald/30 transition-all hover:bg-emerald-deep hover:shadow-xl hover:shadow-emerald/40 active:scale-[0.98]"
            >
              <span className="flex items-center justify-center gap-2">
                <span>المتابعة كمراجع</span>
                <span className="transition-transform group-hover:-translate-x-1">
                  ←
                </span>
              </span>
            </Link>

            {/* نسيت الرمز */}
            <div className="mt-5 text-center">
              <Link
                href="/forgot"
                className="text-xs font-bold text-ink-3 underline decoration-dotted underline-offset-4 hover:text-emerald"
              >
                نسيت الرمز؟
              </Link>
            </div>

            {/* الموافقة */}
            <p className="mt-4 text-center text-[11px] leading-relaxed text-ink-4">
              بدخولك، أنت توافق على{' '}
              <Link
                href="#"
                className="font-bold text-emerald underline decoration-2 underline-offset-2"
              >
                شروط الاستخدام
              </Link>{' '}
              و{' '}
              <Link
                href="#"
                className="font-bold text-emerald underline decoration-2 underline-offset-2"
              >
                سياسة الخصوصية
              </Link>
            </p>
          </div>

          {/* مزايا */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-ink-3">
            <span className="flex items-center gap-1.5">
              <span className="text-base">🔒</span>
              <span className="font-bold">مشفّر بالكامل</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-base">⚡</span>
              <span className="font-bold">رمز فوري</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-base">🇮🇶</span>
              <span className="font-bold">خدمة محلية</span>
            </span>
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
