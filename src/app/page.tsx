import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LandingMobileMenu from '@/components/landing/MobileMenu';
import LandingFAQ from '@/components/landing/FAQ';
import LandingStats from '@/components/landing/Stats';
import { ARTICLES } from '@/lib/data/blog-articles';
import { FreeMedicalMapWrapper } from '@/components/ui/FreeMedicalMapWrapper';
import type { MapMarker } from '@/types/location';
import { SITE_TYPE, getAppUrl } from '@/lib/site-config';

export const metadata = {
  title: 'سباير ميديكال · Spir Medical — منصة طبية رقمية متكاملة في العراق',
  description: 'الرعاية الصحية بين يديك · ١٥ خدمة طبية · في كل المحافظات العراقية',
};

export const dynamic = 'force-dynamic';

// ============================================================
// البيانات الثابتة
// ============================================================

const TESTIMONIALS = [
  {
    id: 1,
    name: 'أم محمد',
    location: 'بغداد · الكرادة',
    rating: 5,
    text: 'احتجت سحب دم لوالدي المسن ووصل الفني خلال ساعة. الخدمة احترافية والأسعار معقولة. أنصح بها كل العائلات.',
    avatar: 'م',
    color: 'emerald',
  },
  {
    id: 2,
    name: 'د. علي الحسيني',
    location: 'البصرة · طبيب باطنية',
    rating: 5,
    text: 'كأخصائي، سباير ميديكال غيّر طريقة تواصلي مع المرضى. أستطيع متابعة حالاتهم وكتابة الوصفات بسهولة.',
    avatar: 'ع',
    color: 'amber',
  },
  {
    id: 3,
    name: 'فاطمة الموسوي',
    location: 'النجف',
    rating: 5,
    text: 'كنت أبحث عن طبيب لطفلي ليلاً، وجدت طبيب أطفال متاح للاستشارة الفورية. خدمة رائعة!',
    avatar: 'ف',
    color: 'rose',
  },
  {
    id: 4,
    name: 'أبو حسن',
    location: 'أربيل',
    rating: 5,
    text: 'طبيب العائلة المخصص ميزة ممتازة، طبيب يتابعنا أنا وعائلتي طوال السنة بسعر معقول جداً.',
    avatar: 'ح',
    color: 'emerald',
  },
  {
    id: 5,
    name: 'مريم الكربلائي',
    location: 'كربلاء',
    rating: 5,
    text: 'السجل الطبي المؤرشف ساعدني كثيراً، كل تحاليلي ووصفاتي محفوظة وأشاركها مع طبيبي بضغطة.',
    avatar: 'م',
    color: 'amber',
  },
  {
    id: 6,
    name: 'سامر الجبوري',
    location: 'الموصل',
    rating: 4,
    text: 'سهولة الحجز ودقة المواعيد ميزة كبيرة. خدمة الطوارئ في التطبيق أنقذت ابني وقت الحاجة.',
    avatar: 'س',
    color: 'rose',
  },
];

const FAQ_ITEMS = [
  {
    q: 'كم تكلفة سحب الدم المنزلي؟',
    a: 'الأسعار تُحدد حسب نوع الخدمة والتحاليل المطلوبة، ويتم الاتفاق عليها مباشرة مع الاختصاصي. الدفع نقداً عند الاستلام. لا توجد رسوم خفية.',
  },
  {
    q: 'هل بياناتي الطبية آمنة؟',
    a: 'نعم، كل البيانات مُشفّرة بتقنية AES-256 (نفس مستوى البنوك). لا نشاركها مع أي طرف ثالث. أنت المتحكّم الوحيد بسجلك الطبي.',
  },
  {
    q: 'في كم محافظة تعملون؟',
    a: 'نعمل حالياً في 18 محافظة عراقية، مع تغطية كاملة في بغداد، البصرة، أربيل، الموصل، النجف، كربلاء، السليمانية، وغيرها.',
  },
  {
    q: 'كيف أحجز موعد فحص؟',
    a: 'سجّل برقم هاتفك العراقي (15 ثانية)، اختر الخدمة (سحب دم، عيادة، إلخ)، حدد الموقع والوقت المناسب. ستصلك رسالة تأكيد فوراً.',
  },
  {
    q: 'هل أحتاج وصفة طبية للأدوية؟',
    a: 'بعض الأدوية تتطلب وصفة طبية رسمية. التطبيق يدير الوصفات ضمن سجلك الطبي ويُعلمك عند انتهائها.',
  },
  {
    q: 'هل يوجد فترة تجريبية مجانية للباقات؟',
    a: 'نعم! نقدّم 7 أيام تجربة مجانية لباقات Pro والعائلة الذهبية، دون الحاجة لبطاقة دفع. ألغِ في أي وقت.',
  },
  {
    q: 'كيف يعمل طبيب العائلة المخصص؟',
    a: 'بعد الاشتراك بباقة العائلة، نعيّن طبيب أسرة متخصص يتابع كل أفراد عائلتك، يقدم استشارات فورية ويرافق رحلتكم الصحية على مدار العام.',
  },
  {
    q: 'ماذا أفعل في حالة طوارئ؟',
    a: 'اضغط زر SOS في التطبيق أو اتصل بالإسعاف 122. التطبيق يحوي دليل إسعافات أولية لـ 6 حالات طارئة.',
  },
];

const TRUST_BADGES = [
  { icon: '🔒', title: 'AES-256', desc: 'تشفير عسكري' },
  { icon: '🏥', title: 'معتمد طبياً', desc: 'وزارة الصحة العراقية' },
  { icon: '🇮🇶', title: 'صناعة عراقية', desc: 'بُني في بغداد' },
  { icon: '🛡️', title: 'SSL Pinned', desc: 'حماية البيانات' },
];

const ACTIVE_CITIES = [
  { name: 'بغداد', doctors: 85, labs: 24, lat: 33.3152, lng: 44.3661 },
  { name: 'البصرة', doctors: 32, labs: 12, lat: 30.5085, lng: 47.7804 },
  { name: 'أربيل', doctors: 28, labs: 10, lat: 36.1901, lng: 44.0094 },
  { name: 'الموصل', doctors: 22, labs: 8, lat: 36.3489, lng: 43.1577 },
  { name: 'النجف', doctors: 18, labs: 7, lat: 31.9997, lng: 44.3296 },
  { name: 'كربلاء', doctors: 15, labs: 6, lat: 32.6149, lng: 44.0245 },
  { name: 'السليمانية', doctors: 14, labs: 5, lat: 35.5556, lng: 45.4351 },
  { name: 'كركوك', doctors: 12, labs: 4, lat: 35.4681, lng: 44.3923 },
];

// 🗺️ Markers للخريطة - مشتقة من ACTIVE_CITIES
const COVERAGE_MARKERS: MapMarker[] = ACTIVE_CITIES.map((c, i) => ({
  id: `city-${i}`,
  lat: c.lat,
  lng: c.lng,
  title: c.name,
  subtitle: `${c.doctors} طبيب · ${c.labs} مختبر`,
  variant: i === 0 ? 'specialist' : i < 4 ? 'lab' : 'pharmacy',
  popup: `خدماتنا متاحة في ${c.name}`,
}));

const BLOG_POSTS = [
  {
    icon: '❤️',
    category: 'صحة القلب',
    title: '10 نصائح يومية لصحة قلب سليم',
    excerpt: 'الفحص الدوري، التغذية، والنشاط البدني - كل ما تحتاج معرفته.',
    readTime: '5 دقائق',
    date: '15 مايو',
  },
  {
    icon: '🩺',
    category: 'الفحوصات الدورية',
    title: 'متى يجب إجراء فحص شامل؟',
    excerpt: 'دليلك لمواعيد الفحوصات المختبرية حسب العمر والحالة الصحية.',
    readTime: '7 دقائق',
    date: '10 مايو',
  },
  {
    icon: '👶',
    category: 'صحة الأطفال',
    title: 'جدول التطعيمات الإلزامية في العراق',
    excerpt: 'كل التطعيمات التي يحتاجها طفلك من الولادة حتى المدرسة.',
    readTime: '6 دقائق',
    date: '5 مايو',
  },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: { source?: string; utm_source?: string };
}) {
  // 🎯 V25.35: لو هذا App site → /dashboard (middleware يتولّى الأمر)
  // لكن نُضيف safety check هنا
  if (SITE_TYPE === 'app') {
    redirect('/dashboard');
  }

  // ─── 🎯 V25.23: Smart PWA Routing ───
  // عند فتح PWA من home screen، نوجّه المستخدم مباشرة
  const isPWA = searchParams.source === 'pwa' || searchParams.utm_source === 'homescreen';

  if (isPWA) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // مستخدم مُسجّل → /dashboard مباشرة
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'specialist') {
        redirect('/specialist');
      } else if (['admin', 'super_admin', 'manager', 'support'].includes(profile?.role || '')) {
        redirect('/admin44');
      } else {
        redirect('/dashboard');
      }
    } else {
      // 🎯 V25.24: غير مُسجّل → /gate (يعرض خياري: تسجيل دخول / حساب جديد)
      redirect('/gate');
    }
  }

  // غير PWA → الموقع التسويقي العادي
  return (
    <main className="landing">
      {/* ============ NAV (Sticky + Mobile Menu) ============ */}
      <nav className="landing-nav landing-nav-sticky">
        <div className="landing-nav-inner">
          <Link href="/" className="landing-logo">
            <div className="landing-logo-mark">س</div>
            <div className="landing-logo-text">
              <strong>Spir Medical</strong>
              <span>سباير ميديكال</span>
            </div>
          </Link>

          {/* روابط Desktop */}
          <div className="landing-nav-links">
            <a href="#services" className="landing-nav-link-section">الخدمات</a>
            <a href="#how-it-works" className="landing-nav-link-section">كيف يعمل</a>
            <a href="#coverage-map" className="landing-nav-link-section">التغطية</a>
            <a href="#install" className="landing-nav-link-section">التطبيق</a>
            <Link href="/blog" className="landing-nav-link-section">المدونة</Link>
            <a href="#testimonials" className="landing-nav-link-section">آراء المستخدمين</a>
            <a href="#faq" className="landing-nav-link-section">الأسئلة</a>
            <a href="#doctors" className="landing-nav-link-section">للأطباء</a>
          </div>

          <div className="landing-nav-actions">
            {/* Language Switcher */}
            <div className="landing-lang-switcher">
              <button type="button" className="landing-lang-btn" aria-label="اختر اللغة">
                <span aria-hidden="true">🌐</span>
                <span>AR</span>
              </button>
              <div className="landing-lang-menu">
                <button type="button" className="active">
                  <span aria-hidden="true">🇮🇶</span>
                  <span>العربية</span>
                </button>
                <button type="button">
                  <span aria-hidden="true">🇬🇧</span>
                  <span>English</span>
                  <span className="landing-lang-soon">قريباً</span>
                </button>
                <button type="button">
                  <span aria-hidden="true">🟢</span>
                  <span>کوردی</span>
                  <span className="landing-lang-soon">قريباً</span>
                </button>
              </div>
            </div>

            <Link href="/login" className="landing-nav-link">
              تسجيل دخول
            </Link>
            <Link href="/gate" className="landing-nav-cta">
              ادخل التطبيق ←
            </Link>

            <LandingMobileMenu />
          </div>
        </div>
      </nav>

      {/* ============ HERO (مع mockup حقيقي) ============ */}
      <section className="landing-hero">
        <div className="landing-hero-bg" aria-hidden="true"></div>
        <div className="landing-wrap">
          <div className="landing-hero-grid">
            <div className="landing-hero-text">
              <span className="landing-eyebrow">
                <span className="dot"></span>
                <span>صناعة عراقية</span>
                <span className="landing-eyebrow-flag" aria-hidden="true">
                  <span className="landing-flag-red" />
                  <span className="landing-flag-white" />
                  <span className="landing-flag-black" />
                </span>
                <span className="landing-eyebrow-sep">·</span>
                <span>18 محافظة</span>
                <span className="landing-eyebrow-sep">·</span>
                <span>24/7</span>
              </span>
              <h1 className="landing-h1">
                الرعاية الصحية،
                <br />
                <span className="landing-h1-italic">بين يديك</span>
              </h1>
              <p className="landing-lede">
                من سحب الدم في بيتك، إلى استشارة طبية فورية، وحتى إدارة أدوية
                والدتك من بُعد. سباير ميديكال يجمع كل ما تحتاجه طبياً في تطبيق
                واحد.
              </p>
              <div className="landing-hero-ctas">
                <Link href="/gate" className="landing-cta-primary">
                  ابدأ الآن ←
                </Link>
                <Link href="/guest" className="landing-cta-secondary">
                  ▷ شاهد كيف يعمل
                </Link>
              </div>

              {/* App Store Badges */}
              <div className="landing-app-badges">
                <button type="button" className="landing-app-badge" aria-label="Download on the App Store - coming soon">
                  <span aria-hidden="true" className="landing-app-icon">🍎</span>
                  <span className="landing-app-text">
                    <span className="landing-app-small">Download on the</span>
                    <span className="landing-app-big">App Store</span>
                  </span>
                  <span className="landing-app-soon">قريباً</span>
                </button>
                <button type="button" className="landing-app-badge" aria-label="Get it on Google Play - coming soon">
                  <span aria-hidden="true" className="landing-app-icon">▶</span>
                  <span className="landing-app-text">
                    <span className="landing-app-small">GET IT ON</span>
                    <span className="landing-app-big">Google Play</span>
                  </span>
                  <span className="landing-app-soon">قريباً</span>
                </button>
              </div>
            </div>

            {/* Hero Visual - Phone Mockup */}
            <div className="landing-hero-visual">
              <div className="landing-phone-frame">
                <div className="landing-phone-notch" aria-hidden="true"></div>
                <div className="landing-phone-screen">
                  {/* Phone Header */}
                  <div className="landing-phone-header">
                    <div className="landing-phone-avatar">س</div>
                    <div className="landing-phone-greeting">
                      <div className="landing-phone-hello">مساء الخير</div>
                      <div className="landing-phone-name">صديقنا 👋</div>
                    </div>
                    <div className="landing-phone-bell" aria-hidden="true">
                      🔔
                      <span className="landing-phone-bell-dot" aria-hidden="true"></span>
                    </div>
                  </div>

                  {/* Phone Search */}
                  <div className="landing-phone-search">
                    <div className="landing-phone-search-icon" aria-hidden="true">🔍</div>
                    <span>ابحث عن خدمة أو تحليل...</span>
                  </div>

                  {/* Phone Pills */}
                  <div className="landing-phone-pills">
                    <span className="landing-phone-pill">🩸 سحب دم + تحاليل</span>
                    <span className="landing-phone-pill">💬 استشارة</span>
                    <span className="landing-phone-pill">💊 صيدلية</span>
                  </div>

                  {/* Phone Stories */}
                  <div className="landing-phone-stories">
                    <div className="landing-phone-story story-1">
                      <div className="landing-phone-story-inner">💉</div>
                    </div>
                    <div className="landing-phone-story story-2">
                      <div className="landing-phone-story-inner">🩺</div>
                    </div>
                    <div className="landing-phone-story story-3">
                      <div className="landing-phone-story-inner">💊</div>
                    </div>
                    <div className="landing-phone-story story-4">
                      <div className="landing-phone-story-inner">🍎</div>
                    </div>
                    <div className="landing-phone-story story-5">
                      <div className="landing-phone-story-inner">🚑</div>
                    </div>
                  </div>

                  {/* Phone Promo Card */}
                  <div className="landing-phone-promo">
                    <div className="landing-phone-promo-content">
                      <span className="landing-phone-promo-tag">جديد</span>
                      <div className="landing-phone-promo-title">خدمات منزلية</div>
                      <div className="landing-phone-promo-sub">سحب دم · إبر · بأسرع وقت</div>
                    </div>
                    <span className="landing-phone-promo-icon" aria-hidden="true">🏠</span>
                  </div>

                  {/* Phone Featured */}
                  <div className="landing-phone-featured">
                    <div className="landing-phone-featured-icon">🩸</div>
                    <div className="landing-phone-featured-text">
                      <div className="landing-phone-featured-title">سحب الدم والتحاليل</div>
                      <div className="landing-phone-featured-meta">الخدمة الأساسية</div>
                    </div>
                    <span className="landing-phone-featured-arrow">←</span>
                  </div>
                </div>
              </div>

              {/* Floating Cards حول الهاتف */}
              <div className="landing-float-card landing-float-card-1">
                <div className="landing-float-icon">⚡</div>
                <div>
                  <div className="landing-float-title">خلال ساعتين</div>
                  <div className="landing-float-sub">وصول سريع</div>
                </div>
              </div>
              <div className="landing-float-card landing-float-card-2">
                <div className="landing-float-icon">⭐</div>
                <div>
                  <div className="landing-float-title">4.8 / 5</div>
                  <div className="landing-float-sub">+1,200 تقييم</div>
                </div>
              </div>
              <div className="landing-float-card landing-float-card-3">
                <div className="landing-float-icon">🔒</div>
                <div>
                  <div className="landing-float-title">آمن 100%</div>
                  <div className="landing-float-sub">AES-256</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ STATS (إحصائيات كبيرة مع Animation) ============ */}
      <LandingStats />

      {/* ============ SERVICES ============ */}
      <section id="services" className="landing-services-section">
        <div className="landing-wrap">
          <div className="landing-section-head">
            <span className="landing-eyebrow">الخدمات</span>
            <h2 className="landing-h2">
              ١٤ خدمة طبية،
              <br />
              <span className="landing-italic">في تطبيق واحد</span>
            </h2>
            <p className="landing-section-lede">
              كل ما يحتاجه العراقي طبياً، من فحص الدم في البيت إلى استشارة فورية
              مع أخصائي.
            </p>
          </div>

          <div className="landing-services-grid">
            <div className="landing-service">
              <div className="landing-service-icon emerald">🩸</div>
              <h3>سحب دم منزلي</h3>
              <p>فني مختبر معتمد يأتي لباب بيتك، مع أدوات معقّمة وتقارير رقمية.</p>
            </div>
            <div className="landing-service">
              <div className="landing-service-icon emerald">🧪</div>
              <h3>فحوصات مختبرية</h3>
              <p>+٢٠٠ فحص متاح، نتائج خلال ٢٤ ساعة، أسعار شفافة.</p>
            </div>
            <div className="landing-service">
              <div className="landing-service-icon amber">🏥</div>
              <h3>حجز مستشفيات</h3>
              <p>+٤٠ مستشفى شريك، احجز ميعادك من التطبيق دون انتظار.</p>
            </div>
            <div className="landing-service">
              <div className="landing-service-icon amber">👩‍⚕️</div>
              <h3>تمريض منزلي</h3>
              <p>عناية مستمرة لكبار السن أو المرضى، فترات يومية أو ٢٤ ساعة.</p>
            </div>
            <div className="landing-service">
              <div className="landing-service-icon emerald">📞</div>
              <h3>استشارات طبية</h3>
              <p>أكثر من ٢٠ تخصص، استشر طبيباً عبر الشات أو المكالمة المرئية.</p>
            </div>
            <div className="landing-service">
              <div className="landing-service-icon emerald">💊</div>
              <h3>صيدليات وأدوية</h3>
              <p>اطلب أدويتك من البيت، توصيل سريع وأسعار منافسة.</p>
            </div>
            <div className="landing-service">
              <div className="landing-service-icon rose">🚨</div>
              <h3>طوارئ SOS</h3>
              <p>زر طوارئ يُرسل موقعك ومعلوماتك الطبية فوراً للإسعاف.</p>
            </div>
            <div className="landing-service">
              <div className="landing-service-icon emerald">📋</div>
              <h3>سجلك الطبي</h3>
              <p>تاريخك الصحي مؤرشف ومشفّر، يمكنك مشاركته مع أي طبيب بضغطة.</p>
            </div>
            <div className="landing-service">
              <div className="landing-service-icon amber">⏰</div>
              <h3>تذكير الأدوية</h3>
              <p>إشعارات ذكية بمواعيد أدويتك، وتقرير الالتزام الشهري.</p>
            </div>
          </div>

          <div className="landing-services-more">
            <span className="landing-eyebrow">والمزيد قريباً</span>
            <p>سحب الدم والتحاليل · المؤشرات الحيوية · عيادات تجميل · تطعيمات · حاسبة المخاطر</p>
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how-it-works" className="landing-how">
        <div className="landing-wrap">
          <div className="landing-section-head">
            <span className="landing-eyebrow">كيف يعمل</span>
            <h2 className="landing-h2">
              <span className="landing-italic">٣ خطوات</span> لتحصل على الرعاية
            </h2>
          </div>

          <div className="landing-steps">
            <div className="landing-step">
              <div className="landing-step-num">١</div>
              <h3>سجّل بسرعة</h3>
              <p>أدخل رقم هاتفك العراقي · رمز SMS · ادخل التطبيق فوراً.</p>
            </div>
            <div className="landing-step">
              <div className="landing-step-num">٢</div>
              <h3>اختر الخدمة</h3>
              <p>تصفّح ١٤ خدمة، اختر ما تحتاج، حدّد الموعد والعنوان.</p>
            </div>
            <div className="landing-step">
              <div className="landing-step-num">٣</div>
              <h3>استلم في بيتك</h3>
              <p>المختبر، الطبيب، أو الدواء يأتي لك. تابع الطلب من التطبيق.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS (جديد) ============ */}
      <section id="testimonials" className="landing-testimonials">
        <div className="landing-wrap">
          <div className="landing-section-head">
            <span className="landing-eyebrow">آراء المستخدمين</span>
            <h2 className="landing-h2">
              <span className="landing-italic">+5,000</span> مستخدم
              <br />
              يثقون بنا
            </h2>
            <p className="landing-section-lede">
              قصص حقيقية من عملاء يستخدمون سباير ميديكال يومياً
            </p>
          </div>

          <div className="landing-testimonials-grid">
            {TESTIMONIALS.map((t) => (
              <article key={t.id} className="landing-testimonial">
                <div className="landing-testimonial-stars">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} aria-hidden="true">
                      {i < t.rating ? '★' : '☆'}
                    </span>
                  ))}
                </div>
                <p className="landing-testimonial-text">&ldquo;{t.text}&rdquo;</p>
                <div className="landing-testimonial-author">
                  <div className={`landing-testimonial-avatar landing-testimonial-${t.color}`}>
                    {t.avatar}
                  </div>
                  <div>
                    <div className="landing-testimonial-name">{t.name}</div>
                    <div className="landing-testimonial-location">{t.location}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TRUST BADGES (الأمان) ============ */}
      <section className="landing-trust-section">
        <div className="landing-wrap">
          <div className="landing-section-head">
            <span className="landing-eyebrow">الأمان والثقة</span>
            <h2 className="landing-h2">
              بياناتك الطبية
              <br />
              <span className="landing-italic">محمية بالكامل</span>
            </h2>
          </div>

          <div className="landing-trust-grid">
            {TRUST_BADGES.map((badge) => (
              <div key={badge.title} className="landing-trust-card">
                <div className="landing-trust-icon">{badge.icon}</div>
                <h3>{badge.title}</h3>
                <p>{badge.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ BLOG / المدونة الطبية ============ */}
      <section id="blog" className="landing-blog">
        <div className="landing-wrap">
          <div className="landing-section-head">
            <span className="landing-eyebrow">المدونة الطبية</span>
            <h2 className="landing-h2">
              معلومات صحية موثوقة،
              <br />
              <span className="landing-italic">من أطبائنا إليك</span>
            </h2>
            <p className="landing-section-lede">
              مقالات طبية مكتوبة من أخصائيي سباير ميديكال — تعرّف على صحتك بلغة بسيطة ومُختصرة
            </p>
          </div>

          <div className="landing-blog-grid">
            {ARTICLES.slice(0, 4).map((article) => (
              <Link
                key={article.slug}
                href={`/blog/${article.slug}`}
                className="landing-blog-card"
              >
                <div
                  className="landing-blog-thumb"
                  style={{ background: article.coverGradient }}
                >
                  <span className="landing-blog-thumb-emoji" aria-hidden="true">
                    {article.coverEmoji}
                  </span>
                  <span className="landing-blog-reading">
                    {article.readingMinutes} دقائق قراءة
                  </span>
                </div>
                <div className="landing-blog-body">
                  <span className="landing-blog-tag">{article.categoryLabel}</span>
                  <h3 className="landing-blog-title">{article.title}</h3>
                  <p className="landing-blog-excerpt">{article.excerpt}</p>
                  <div className="landing-blog-meta">
                    <span>{article.author}</span>
                    <span aria-hidden="true">·</span>
                    <span>{new Date(article.publishedAt).toLocaleDateString('ar-IQ', { month: 'long', day: 'numeric' })}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="landing-blog-cta">
            <Link href="/blog" className="landing-cta-secondary">
              تصفّح كل المقالات ←
            </Link>
          </div>
        </div>
      </section>

      {/* ============ DOCTORS / SPECIALISTS (جديد) ============ */}
      <section id="doctors" className="landing-doctors">
        <div className="landing-wrap">
          <div className="landing-doctors-card">
            <div className="landing-doctors-content">
              <span className="landing-eyebrow">للأطباء والأخصائيين</span>
              <h2 className="landing-h2 on-light">
                هل أنت طبيب؟
                <br />
                <span className="landing-italic">انضم لشبكتنا</span>
              </h2>
              <p className="landing-doctors-lede">
                وسّع قاعدة مرضاك، استفد من منصّة طبية احترافية، واحصل على مرضى
                جدد كل شهر.
              </p>

              <div className="landing-doctors-perks">
                <div className="landing-doctors-perk">
                  <div className="landing-doctors-perk-icon">💰</div>
                  <div>
                    <strong>0% رسوم تسجيل</strong>
                    <span>تسجيل مجاني · بدون التزامات</span>
                  </div>
                </div>
                <div className="landing-doctors-perk">
                  <div className="landing-doctors-perk-icon">👥</div>
                  <div>
                    <strong>+500 مريض/شهر</strong>
                    <span>قاعدة عملاء واسعة وموثوقة</span>
                  </div>
                </div>
                <div className="landing-doctors-perk">
                  <div className="landing-doctors-perk-icon">📊</div>
                  <div>
                    <strong>لوحة إدارة احترافية</strong>
                    <span>إدارة المواعيد والاستشارات بسهولة</span>
                  </div>
                </div>
              </div>

              <div className="landing-doctors-ctas">
                <Link href="/register/specialist" className="landing-cta-primary">
                  سجّل كأخصائي ←
                </Link>
                <Link href="/about" className="landing-cta-secondary">
                  اعرف المزيد
                </Link>
              </div>
            </div>

            <div className="landing-doctors-visual">
              <div className="landing-doctors-stat">
                <div className="landing-doctors-stat-big">+200</div>
                <div className="landing-doctors-stat-label">طبيب مُسجَّل</div>
              </div>
              <div className="landing-doctors-stat">
                <div className="landing-doctors-stat-big">15+</div>
                <div className="landing-doctors-stat-label">اختصاص متاح</div>
              </div>
              <div className="landing-doctors-stat">
                <div className="landing-doctors-stat-big">98%</div>
                <div className="landing-doctors-stat-label">رضا الأطباء</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FEATURES BAR ============ */}
      <section className="landing-features">
        <div className="landing-wrap">
          <div className="landing-features-grid">
            <div className="landing-feature">
              <div className="landing-feature-icon">🔒</div>
              <strong>مشفّر بالكامل</strong>
              <span>بياناتك الطبية محمية بـ AES-256</span>
            </div>
            <div className="landing-feature">
              <div className="landing-feature-icon">⚡</div>
              <strong>سريع كالبرق</strong>
              <span>الطلبات تصل خلال ساعتين في بغداد</span>
            </div>
            <div className="landing-feature">
              <div className="landing-feature-icon">🇮🇶</div>
              <strong>صناعة عراقية</strong>
              <span>بُني محلياً، يفهم احتياجاتك</span>
            </div>
            <div className="landing-feature">
              <div className="landing-feature-icon">💳</div>
              <strong>دفع مرن</strong>
              <span>زين كاش · آسيا · فيزا · كاش</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CITIES MAP (المحافظات النشطة) ============ */}
      <section className="landing-cities">
        <div className="landing-wrap">
          <div className="landing-section-head">
            <span className="landing-eyebrow">التغطية</span>
            <h2 className="landing-h2">
              نخدم
              <span className="landing-italic"> 18 محافظة </span>
              عراقية
            </h2>
            <p className="landing-section-lede">
              من أقصى الشمال إلى أقصى الجنوب · نمو مستمر
            </p>
          </div>

          <div className="landing-cities-grid">
            {ACTIVE_CITIES.map((city) => (
              <div key={city.name} className="landing-city-card">
                <div className="landing-city-pin" aria-hidden="true">📍</div>
                <div className="landing-city-name">{city.name}</div>
                <div className="landing-city-stats">
                  <span>{city.doctors} طبيب</span>
                  <span>·</span>
                  <span>{city.labs} مختبر</span>
                </div>
              </div>
            ))}
          </div>

          <div className="landing-cities-more">
            <span>والمزيد قادم...</span>
            <span>كركوك · دهوك · ديالى · الأنبار · صلاح الدين · بابل · القادسية · واسط · المثنى · ميسان · ذي قار</span>
          </div>
        </div>
      </section>

      {/* ============ FAQ (جديد) ============ */}
      <section id="faq" className="landing-faq">
        <div className="landing-wrap landing-wrap-narrow">
          <div className="landing-section-head">
            <span className="landing-eyebrow">الأسئلة الشائعة</span>
            <h2 className="landing-h2">
              <span className="landing-italic">إجابات</span> لأهم أسئلتك
            </h2>
            <p className="landing-section-lede">
              كل ما تريد معرفته قبل البدء
            </p>
          </div>

          <LandingFAQ items={FAQ_ITEMS} />
        </div>
      </section>

      {/* ============ BLOG (جديد) ============ */}
      <section className="landing-blog">
        <div className="landing-wrap">
          <div className="landing-section-head">
            <span className="landing-eyebrow">المدوّنة</span>
            <h2 className="landing-h2">
              نصائح طبية
              <br />
              <span className="landing-italic">من خبرائنا</span>
            </h2>
          </div>

          <div className="landing-blog-grid">
            {BLOG_POSTS.map((post, i) => (
              <article key={i} className="landing-blog-card">
                <div className="landing-blog-icon">{post.icon}</div>
                <div className="landing-blog-meta">
                  <span className="landing-blog-category">{post.category}</span>
                  <span className="landing-blog-date">{post.date}</span>
                </div>
                <h3 className="landing-blog-title">{post.title}</h3>
                <p className="landing-blog-excerpt">{post.excerpt}</p>
                <div className="landing-blog-footer">
                  <span>📖 {post.readTime}</span>
                  <span className="landing-blog-link">اقرأ ←</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============ MAP COVERAGE SECTION ============ */}
      <section id="coverage-map" className="landing-coverage-map">
        <div className="landing-wrap">
          <div className="landing-section-head">
            <span className="landing-eyebrow">🗺️ تغطية واسعة</span>
            <h2 className="landing-section-title">
              مناطق <span className="landing-italic">تغطيتنا</span> في العراق
            </h2>
            <p className="landing-section-subtitle">
              خدماتنا الطبية متاحة في {ACTIVE_CITIES.length} محافظات رئيسية وأكثر · اطلب من أي مكان
            </p>
          </div>

          <div className="landing-coverage-grid">
            {/* الخريطة */}
            <div className="landing-coverage-map-wrap">
              <FreeMedicalMapWrapper
                markers={COVERAGE_MARKERS}
                height={420}
                zoom={6}
                showDirections={false}
                showCoords={false}
              />
            </div>

            {/* قائمة المدن */}
            <div className="landing-coverage-cities">
              <h3 className="landing-coverage-cities-title">
                <span aria-hidden="true">📍</span>
                <span>المحافظات المغطّاة</span>
              </h3>
              <ul className="landing-coverage-cities-list">
                {ACTIVE_CITIES.map((city) => (
                  <li key={city.name} className="landing-coverage-city">
                    <div className="landing-coverage-city-name">
                      <span aria-hidden="true" className="landing-coverage-dot"></span>
                      <strong>{city.name}</strong>
                    </div>
                    <div className="landing-coverage-city-stats">
                      <span>{city.doctors} طبيب</span>
                      <span>·</span>
                      <span>{city.labs} مختبر</span>
                    </div>
                  </li>
                ))}
              </ul>
              <Link href="/gate" className="landing-coverage-cta">
                <span>ابدأ من مدينتك</span>
                <span aria-hidden="true">←</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="landing-cta-section">
        <div className="landing-wrap">
          <div className="landing-cta-card">
            <div className="landing-cta-bg" aria-hidden="true"></div>
            <div className="landing-cta-content">
              <h2 className="landing-cta-h2">
                ابدأ <span className="landing-italic">رحلتك الصحية</span> اليوم
              </h2>
              <p className="landing-cta-text">
                مجاناً تماماً للتسجيل · بدون التزامات · ادخل عبر هاتفك في ٣٠ ثانية
              </p>
              <div className="landing-cta-buttons">
                <Link href="/gate" className="landing-cta-primary big">
                  ابدأ الآن ←
                </Link>
                <Link href="/guest" className="landing-cta-secondary on-dark">
                  تصفّح كضيف
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ INSTALL APP CTA ============ */}
      <section className="landing-install" id="install">
        <div className="landing-wrap">
          <div className="landing-install-card">
            <div className="landing-install-content">
              <span className="landing-eyebrow">📱 التطبيق</span>
              <h2 className="landing-install-title">
                حمّل التطبيق على هاتفك
              </h2>
              <p className="landing-install-desc">
                ثبّت سباير ميديكال للوصول السريع، الإشعارات الفورية، والعمل بدون إنترنت
              </p>
              <ul className="landing-install-features">
                <li>⚡ فتح فوري بضغطة واحدة</li>
                <li>🔔 إشعارات بمواعيدك ونتائجك</li>
                <li>📴 يعمل بدون إنترنت</li>
                <li>🏠 على شاشتك الرئيسية</li>
              </ul>
              <div className="landing-install-actions">
                <Link href="/help/install" className="landing-install-btn-primary">
                  كيف أُثبّته؟
                </Link>
                <Link href="/app" className="landing-install-btn-secondary">
                  جرّب الآن
                </Link>
              </div>
            </div>
            <div className="landing-install-visual">
              <div className="landing-install-phone">
                <div className="landing-install-phone-screen">
                  <div className="landing-install-phone-logo">
                    <div className="landing-logo-mark" style={{ width: 64, height: 64, fontSize: 32 }}>س</div>
                    <strong>Spir Medical</strong>
                    <span>منصة طبية رقمية</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="landing-footer">
        <div className="landing-wrap">
          <div className="landing-footer-grid">
            <div>
              <div className="landing-footer-logo">
                <div className="landing-logo-mark">س</div>
                <div>
                  <strong>Spir Medical</strong>
                  <span>سباير ميديكال</span>
                </div>
              </div>
              <p className="landing-footer-tagline">
                صحة العراق، رقمياً.
                <br />
                بُني بعناية في بغداد 🇮🇶
              </p>
            </div>
            <div className="landing-footer-col">
              <h4>الخدمات</h4>
              <ul>
                <li><a href="#services">سحب الدم المنزلي</a></li>
                <li><a href="#services">الفحوصات المختبرية</a></li>
                <li><a href="#services">الاستشارات الطبية</a></li>
                <li><a href="#services">الصيدليات</a></li>
                <li><a href="#coverage-map">🗺️ مناطق التغطية</a></li>
              </ul>
            </div>
            <div className="landing-footer-col">
              <h4>قانوني</h4>
              <ul>
                <li><Link href="/legal/terms">الشروط والأحكام</Link></li>
                <li><Link href="/legal/privacy">سياسة الخصوصية</Link></li>
                <li><Link href="/legal/cookies">سياسة الكوكيز</Link></li>
                <li><Link href="/legal/disclaimer">إخلاء المسؤولية الطبية</Link></li>
              </ul>
            </div>
            <div className="landing-footer-col">
              <h4>تواصل</h4>
              <ul>
                <li>info@spirmedical.iq</li>
                <li>الدعم الفني</li>
                <li>+٩٦٤ ٧٧٠ ١٢٣ ٤٥٦٧</li>
              </ul>
            </div>
          </div>
          <div className="landing-footer-bottom">
            © ٢٠٢٦ Spir Medical · جميع الحقوق محفوظة
          </div>
        </div>
      </footer>
    </main>
  );
}
