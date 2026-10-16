import Link from 'next/link';
import { HOW_IT_WORKS_AR, POLICIES_AR, SERVICES, SUMMARY_AR, servedCityNames } from '@/lib/seo/facts';
import { getAppUrl } from '@/lib/site-config';

/**
 * ℹ️ «عن التطبيق» — قسمٌ في الرئيسية (`variant="home"`) وجسمُ صفحة `/about` (`variant="page"`).
 *
 * نصٌّ واحد في موضعين، ومادّتُه من `lib/seo/facts.ts` — المصدرُ نفسُه لـ`llms.txt` والبيانات
 * المنظَّمة — فلا يقول الموقعُ للزائر شيئاً ويقول للنموذج غيره. ولا عددَ ولا مدّةً مضمونة
 * (`tests/about-app.test.tsx`).
 *
 * أصنافُه بالبادئة `ab-` (marketing.css): الأصنافُ العامّة كـ`.service-card` تقلب التخطيط.
 */
const ICON: Record<string, string> = {
  'blood-draw': '🩸',
  'home-nursing': '💉',
  physio: '🦵',
  hospitals: '🏥',
  pharmacies: '💊',
};

const STATUS_LABEL = { available: 'متاحة', 'coming-soon': 'قريباً', directory: 'دليل' } as const;

export default function AboutApp({ variant = 'home' }: { variant?: 'home' | 'page' }) {
  const Title = variant === 'page' ? 'h1' : 'h2';
  const Sub = variant === 'page' ? 'h2' : 'h3';
  const cities = servedCityNames().join('، ');

  return (
    <section id="about" className={`ab ab-${variant}`} aria-labelledby="ab-title">
      <div className="ab-wrap">
        <header className="ab-head">
          <span className="landing-eyebrow">عن التطبيق</span>
          <Title id="ab-title" className="ab-title">
            خدماتٌ طبّية <span className="landing-italic">تصل إلى بابك</span>
          </Title>
          <p className="ab-lede">{SUMMARY_AR}</p>
        </header>

        <div className="ab-feature">
          <div className="ab-feature-text">
            <Sub className="ab-h3">سحب الدم المنزلي</Sub>
            <p>
              بدل الانتظار في المختبر، تطلب سحبَ الدم من التطبيق فيأتي مختصٌّ مدرَّب إلى منزلك في الوقت
              الذي تختاره. يسحب العيّنةَ بأدواتٍ معقّمة للاستعمال مرّةً واحدة، وتصلك النتائج على هاتفك
              وتُحفظ في سجلّك الطبّي. خدمةٌ تناسب كبارَ السنّ والأطفال ومن يصعب عليه التنقّل، ومن يتابع
              تحاليلَ دوريّة كسكّر الدم ودهونه.
            </p>

            <Sub className="ab-h3">الخدمات الطبّية المنزلية</Sub>
            <p>
              وبالطريقة نفسها تطلب <strong>التمريضَ المنزليّ</strong>: زرقَ الإبر، والعنايةَ بالجروح
              وتضميدها، وتركيبَ الكانيولا. والعلاجُ الطبيعيّ المنزليّ قادمٌ قريباً. ولا نقبل طلباً لخدمةٍ
              ليس لها مختصٌّ معتمَد متاح — نُعلمك حين تتوفّر بدل أن يبقى طلبك معلَّقاً.
            </p>
            <p className="ab-note">
              تتوفّر الخدمة في: {cities}. الدفعُ نقداً عند الاستلام.
            </p>

            <div className="ab-actions">
              <Link href={getAppUrl('/appointments/new?service=blood-draw')} className="ab-btn ab-btn-primary">
                اطلب سحب دم منزلي
              </Link>
              <Link href="/home-blood-draw" className="ab-btn ab-btn-ghost">
                كيف تستعدّ لسحب الدم
              </Link>
            </div>
          </div>

          <ul className="ab-services" aria-label="الخدمات">
            {SERVICES.map((s) => (
              <li key={s.id} className={`ab-service ab-service-${s.status}`}>
                <span className="ab-service-icon" aria-hidden="true">{ICON[s.id] ?? '•'}</span>
                <span className="ab-service-body">
                  <span className="ab-service-name">
                    {s.nameAr}
                    <span className="ab-chip">{STATUS_LABEL[s.status]}</span>
                  </span>
                  <span className="ab-service-desc">{s.descriptionAr}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {variant === 'page' ? (
          <>
            <div className="ab-block">
              <Sub className="ab-h3">كيف يعمل</Sub>
              <ol className="ab-steps">
                {HOW_IT_WORKS_AR.map((s, i) => (
                  <li key={s}>
                    <span className="ab-step-num" aria-hidden="true">{(i + 1).toLocaleString('ar-IQ')}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="ab-block">
              <Sub className="ab-h3">ما يجب أن تعرفه</Sub>
              <ul className="ab-policies">
                {POLICIES_AR.map((p) => <li key={p}>{p}</li>)}
              </ul>
            </div>
          </>
        ) : (
          <div className="ab-more">
            <Link href="/about">المزيد عن التطبيق ←</Link>
          </div>
        )}
      </div>
    </section>
  );
}
