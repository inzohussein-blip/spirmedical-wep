// تعطيل pre-rendering — searchParams
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { z } from 'zod';
import { sendOtp } from '../login/actions';

const searchParamsSchema = z.object({
  error: z.string().max(500).optional(),
});

export default function ForgotPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const params = searchParamsSchema.safeParse(searchParams);
  const error = params.success ? params.data.error : undefined;

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-paper via-paper-3 to-paper-2">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-emerald/8 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-amber/8 blur-3xl" />
      </div>

      <Link
        href="/login"
        className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-ink-2 shadow-sm backdrop-blur-md transition-all hover:bg-white hover:shadow-md sm:right-6 sm:top-6"
      >
        <span className="text-base">←</span>
        <span className="hidden sm:inline">العودة</span>
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
          </div>

          {/* البطاقة */}
          <div className="rounded-3xl border border-white/50 bg-white/95 p-7 shadow-2xl shadow-ink/10 backdrop-blur-xl">
            <div className="mb-5 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-amber/20 blur-lg" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-soft text-3xl">
                  🔑
                </div>
              </div>
            </div>

            <div className="mb-6 text-center">
              <h2 className="text-2xl font-extrabold tracking-tight text-ink">
                نسيت الرمز؟
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-3">
                لا تقلق! أدخل رقم هاتفك المُسجّل وسنُرسل لك
                <br />
                رمز جديد لاستعادة الدخول.
              </p>
            </div>

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

            <form action={sendOtp} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label htmlFor="phone" className="text-sm font-bold text-ink-2">
                  رقم الهاتف المُسجّل
                </label>

                <div className="group flex overflow-hidden rounded-2xl border-2 border-ink/10 bg-paper-3 transition-all duration-200 focus-within:border-emerald focus-within:ring-4 focus-within:ring-emerald/10">
                  <div className="flex shrink-0 items-center gap-2 border-l border-ink/10 bg-paper-2/60 px-4">
                    <span className="text-2xl leading-none">🇮🇶</span>
                    <span dir="ltr" className="font-mono text-sm font-bold text-ink-2">
                      +964
                    </span>
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    placeholder="7XX XXX XXXX"
                    dir="ltr"
                    required
                    autoComplete="tel"
                    autoFocus
                    pattern="0?7[0-9]{9}"
                    className="flex-1 bg-transparent px-4 py-4 text-left text-base font-medium text-ink outline-none placeholder:text-ink-4"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="group mt-1 overflow-hidden rounded-2xl bg-emerald px-6 py-4 text-base font-bold text-paper-3 shadow-lg shadow-emerald/30 transition-all duration-200 hover:bg-emerald-deep hover:shadow-xl hover:shadow-emerald/40 active:scale-[0.98]"
              >
                <span className="flex items-center justify-center gap-2">
                  <span>إرسال رمز جديد</span>
                  <span className="transition-transform group-hover:-translate-x-1">
                    ←
                  </span>
                </span>
              </button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-ink/10" />
            </div>

            <div className="text-center">
              <p className="text-sm text-ink-3">
                تذكّرت رمزك؟{' '}
                <Link
                  href="/login"
                  className="font-bold text-emerald underline decoration-2 underline-offset-2"
                >
                  العودة لتسجيل الدخول
                </Link>
              </p>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-ink-4">
            © ٢٠٢٦ سباير ميديكال — جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </main>
  );
}
