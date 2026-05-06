import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-ink/10 bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald font-serif-italic text-2xl font-medium text-paper-3">
              س
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-base font-extrabold">Spir Medical</span>
              <span className="text-xs text-ink-3">سباير ميديكال</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden rounded-lg px-4 py-2 text-sm font-bold text-ink-2 hover:bg-paper-2 sm:inline-block"
            >
              تسجيل دخول
            </Link>
            <Link href="/login">
              <Button size="sm">ادخل التطبيق ←</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-soft px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-deep">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald" />
            منصة طبية رقمية · العراق
          </span>
          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight md:text-7xl">
            الرعاية الصحية،
            <br />
            <span className="font-serif-italic font-medium text-emerald">
              بين يديك
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-ink-2 md:text-xl">
            من سحب الدم في بيتك، إلى استشارة طبية فورية، وحتى إدارة أدوية والدتك
            من بُعد. سباير ميديكال يجمع كل ما تحتاجه طبياً في تطبيق واحد.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg">ابدأ الآن ←</Button>
            </Link>
            <Link href="#features">
              <Button variant="secondary" size="lg">
                ▷ شاهد كيف يعمل
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-ink py-8 text-paper-3">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 text-center md:grid-cols-4">
          <div>
            <div className="text-2xl font-extrabold">١٤ خدمة</div>
            <div className="text-xs text-paper-3/60">طبية متكاملة</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold">١٨ محافظة</div>
            <div className="text-xs text-paper-3/60">في كل العراق</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold">٣ لغات</div>
            <div className="text-xs text-paper-3/60">عربي · إنكليزي · كردي</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold">٢٤/٧</div>
            <div className="text-xs text-paper-3/60">دعم على مدار الساعة</div>
          </div>
        </div>
      </section>

      {/* Features placeholder */}
      <section id="features" className="px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-extrabold md:text-4xl">
            خدماتنا الـ١٤
          </h2>
          <p className="mb-12 text-ink-2">
            كل ما تحتاجه طبياً في تطبيق واحد
          </p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              'سحب دم منزلي',
              'فحوصات مختبرية',
              'استشارات طبية',
              'صيدليات',
              'تمريض منزلي',
              'حجز مستشفيات',
              'طوارئ SOS',
              'السجل الطبي',
            ].map((service) => (
              <div
                key={service}
                className="rounded-xl border border-ink/10 bg-white p-6 transition-all hover:border-emerald hover:shadow-lg"
              >
                <div className="text-sm font-bold">{service}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink px-6 py-24 text-center text-paper-3">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 text-4xl font-extrabold md:text-5xl">
            صحة عائلتك،
            <br />
            <span className="font-serif-italic font-medium text-amber-soft">
              على بُعد نقرة
            </span>
          </h2>
          <p className="mb-10 text-lg text-paper-3/75">
            انضم لآلاف العائلات العراقية. التحميل مجاني، التسجيل بدقيقة.
          </p>
          <Link href="/login">
            <Button size="lg" className="bg-amber text-paper-3 hover:bg-amber-deep">
              ادخل التطبيق الآن ←
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ink border-t border-paper-3/10 py-12 text-paper-3">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-paper-3 font-serif-italic text-2xl text-emerald">
                س
              </div>
              <span className="text-lg font-extrabold">Spir Medical</span>
            </div>
            <p className="text-sm text-paper-3/60">
              © ٢٠٢٦ Spir Medical · سباير ميديكال · جميع الحقوق محفوظة
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
