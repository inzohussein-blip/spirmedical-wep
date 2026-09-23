import Link from 'next/link';
import JsonLd from '@/components/seo/JsonLd';
import { SERVED_CITIES, absoluteUrl, areaServedJsonLd } from '@/lib/seo/coverage';
import { getAppUrl } from '@/lib/site-config';

/**
 * 🩸 صفحةُ الخدمة العامّة: سحب الدم المنزلي
 *
 * لم تكن في الموقع صفحةٌ واحدةٌ قابلةٌ للفهرسة عن الخدمة التي يبحث عنها
 * الناس: الرئيسية وحدها، و`/services/*` صفحاتُ التطبيق المحجوبة في
 * robots.txt. فمن يبحث «سحب دم منزلي في النجف» لا يجد صفحةً تجيبه.
 *
 * ولا صفحاتٍ منفصلةً لكلّ مدينةٍ تُبدّل الاسمَ وحده — تلك «صفحات عبور»
 * يعاقب عليها Google. بل صفحةٌ واحدة، لكلّ محافظةٍ فيها عنوانٌ ومرساة
 * (`#najaf`)، تُبنى من `SERVED_CITIES` فلا تدّعي ما لا يُخدَم.
 *
 * كلُّ ما فيها ممّا يقوله الموقع أصلاً (الحجز، الدفع، التشفير)، أو إرشادٌ
 * طبّيٌّ عامّ متحفّظ. لا أسعار، ولا مُدداً مضمونة، ولا أعداداً.
 */

export const revalidate = 86400;

const PATH = '/home-blood-draw';

export const metadata = {
  alternates: { canonical: PATH },
  title: 'سحب الدم المنزلي في العراق — النجف، كربلاء، بابل، بغداد',
  description:
    'سحب دم وتحاليل مختبرية في منزلك: اطلب من التطبيق، يصلك مختصٌّ مدرَّب، وتصلك النتائج على هاتفك. الدفع نقداً عند الاستلام.',
  openGraph: {
    title: 'سحب الدم المنزلي في العراق · سباير ميديكال',
    description: 'سحب دم وتحاليل مختبرية في منزلك، والنتائج على هاتفك.',
    url: PATH,
    type: 'website',
  },
};

const STEPS = [
  { t: 'اطلب من التطبيق', d: 'سجّل برقم هاتفك العراقي، واختر «سحب دم»، وحدّد موقعك والوقت المناسب.' },
  { t: 'يُسنَد مختصٌّ إلى طلبك', d: 'يصلك إشعارٌ عند استلام مختصٍّ طلبك، وتتابع حالته من التطبيق.' },
  { t: 'السحب في منزلك', d: 'يصل المختصّ إلى عنوانك ويسحب العيّنة بأدواتٍ معقّمة للاستعمال مرّةً واحدة.' },
  { t: 'النتائج على هاتفك', d: 'تصلك النتائج في التطبيق وتُحفظ في سجلّك الطبّي، ويصلك إشعارٌ حين تجهز.' },
];

const PREP = [
  'بعض التحاليل — كسكّر الدم الصائم ودهون الدم — تحتاج صياماً من ٨ إلى ١٢ ساعة. الماء مسموح.',
  'لا توقف دواءً تتناوله دون استشارة طبيبك، وأخبر المختصّ بأدويتك عند السحب.',
  'اشرب الماء قبل الموعد؛ يسهّل ذلك إيجاد الوريد.',
  'جهّز طلب الطبيب إن كان لديك، واذكر أيّ حساسيّة أو ميلٍ للإغماء عند رؤية الدم.',
];

const FAQ = [
  {
    q: 'كم تكلفة سحب الدم المنزلي؟',
    a: 'تُحدَّد الأسعار حسب التحاليل المطلوبة، ويتمّ الاتفاق عليها مباشرةً مع المختصّ. الدفع نقداً عند الاستلام، ولا رسوم خفيّة.',
  },
  {
    q: 'هل أحتاج إلى الصيام قبل سحب الدم؟',
    a: 'يعتمد ذلك على التحليل. سكّر الدم الصائم ودهون الدم تحتاج صياماً من ٨ إلى ١٢ ساعة، وكثيرٌ من التحاليل الأخرى لا تحتاجه. الماء مسموح في كلّ الأحوال.',
  },
  {
    q: 'كيف تصلني النتائج؟',
    a: 'في التطبيق نفسه، وتُحفظ في سجلّك الطبّي، ويصلك إشعارٌ حين تجهز.',
  },
  {
    q: 'هل بياناتي الطبّية آمنة؟',
    a: 'نعم، البيانات مُشفّرة بتقنية AES-256، ولا نشاركها مع أيّ طرفٍ ثالث.',
  },
  {
    q: 'في أيّ المحافظات تتوفّر الخدمة؟',
    a: `تتوفّر في: ${SERVED_CITIES.map((c) => c.name).join('، ')}.`,
  },
];

export default function HomeBloodDrawPage() {
  const bookUrl = getAppUrl('/appointments/new?service=blood-draw');

  return (
    <main className="mkt-screen">
      <div className="mkt-content">
        <div className="mkt-page-header">
          <Link href="/" className="mkt-back-btn" aria-label="الرئيسية"><span aria-hidden="true">→</span></Link>
          <h1 className="mkt-page-title">سحب الدم المنزلي في العراق</h1>
          <div className="mkt-page-spacer" />
        </div>

        <div className="mkt-info-banner" style={{ display: 'block', padding: 16, marginTop: 8 }}>
          <p style={{ margin: 0, lineHeight: 1.8, fontSize: 14 }}>
            تطلب <strong>سحب الدم والتحاليل المختبرية في منزلك</strong> من تطبيق سباير ميديكال،
            فيصلك مختصٌّ مدرَّب، وتصلك النتائج على هاتفك. تتوفّر الخدمة في{' '}
            {SERVED_CITIES.map((c) => c.name).join('، ')}.
          </p>
          <Link
            href={bookUrl}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minHeight: 48, padding: '0 22px', marginTop: 14, borderRadius: 12,
              background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-fg)',
              fontWeight: 800, fontSize: 15, textDecoration: 'none',
            }}
          >
            اطلب سحب دم منزلي
          </Link>
        </div>

        <section aria-labelledby="how">
          <div className="mkt-section-head" style={{ marginTop: 24 }}>
            <h2 id="how" className="mkt-section-title">كيف تعمل الخدمة</h2>
          </div>
          <ol className="mkt-list-stack" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {STEPS.map((s, i) => (
              <li key={s.t} className="mkt-list-item">
                <div className="mkt-list-item-icon" aria-hidden="true">{(i + 1).toLocaleString('ar-IQ')}</div>
                <div className="mkt-list-item-content">
                  <div className="mkt-list-item-title">{s.t}</div>
                  <div className="mkt-list-item-subtitle">{s.d}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="prep">
          <div className="mkt-section-head" style={{ marginTop: 24 }}>
            <h2 id="prep" className="mkt-section-title">كيف تستعدّ لسحب الدم</h2>
          </div>
          <ul className="mkt-info-banner" style={{ display: 'block', padding: '12px 28px 12px 16px', margin: 0 }}>
            {PREP.map((p) => (
              <li key={p} style={{ lineHeight: 1.8, fontSize: 13, marginBottom: 4 }}>{p}</li>
            ))}
          </ul>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8 }}>
            إرشادٌ عامّ لا يُغني عن تعليمات طبيبك.
          </p>
        </section>

        <section aria-labelledby="areas">
          <div className="mkt-section-head" style={{ marginTop: 24 }}>
            <h2 id="areas" className="mkt-section-title">المحافظات المشمولة</h2>
          </div>
          <div className="mkt-list-stack">
            {SERVED_CITIES.map((c) => (
              <div key={c.slug} id={c.slug} className="mkt-list-item">
                <div className="mkt-list-item-icon" aria-hidden="true">📍</div>
                <div className="mkt-list-item-content">
                  <h3 className="mkt-list-item-title" style={{ margin: 0, fontSize: 'inherit' }}>
                    سحب دم منزلي في {c.name}
                  </h3>
                  <div className="mkt-list-item-subtitle">
                    اطلب من التطبيق، ويصلك مختصٌّ إلى عنوانك في {c.name}.
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="faq">
          <div className="mkt-section-head" style={{ marginTop: 24 }}>
            <h2 id="faq" className="mkt-section-title">أسئلة شائعة</h2>
          </div>
          <div className="mkt-list-stack">
            {FAQ.map((f) => (
              <details key={f.q} className="mkt-list-item" style={{ display: 'block' }}>
                <summary style={{ fontWeight: 800, cursor: 'pointer', minHeight: 44, display: 'flex', alignItems: 'center' }}>
                  {f.q}
                </summary>
                <p style={{ margin: '8px 0 0', lineHeight: 1.8, fontSize: 13 }}>{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>

      <JsonLd
        id="ld-service"
        data={{
          '@context': 'https://schema.org',
          '@type': 'MedicalWebPage',
          name: 'سحب الدم المنزلي في العراق',
          url: absoluteUrl(PATH),
          inLanguage: 'ar-IQ',
          about: {
            '@type': 'Service',
            serviceType: 'سحب دم منزلي',
            name: 'سحب الدم والتحاليل المختبرية في المنزل',
            provider: { '@type': 'MedicalBusiness', name: 'Spir Medical · سباير ميديكال' },
            areaServed: areaServedJsonLd(),
          },
        }}
      />
      <JsonLd
        id="ld-breadcrumb"
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: absoluteUrl('/') },
            { '@type': 'ListItem', position: 2, name: 'سحب الدم المنزلي', item: absoluteUrl(PATH) },
          ],
        }}
      />
      <JsonLd
        id="ld-faq"
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: FAQ.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }}
      />
    </main>
  );
}
