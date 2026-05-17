import Link from 'next/link';

export const metadata = {
  title: 'إخلاء المسؤولية الطبية · سباير ميديكال',
  description: 'إخلاء المسؤولية حول المحتوى الطبي والخدمات في منصة سباير ميديكال',
};

export default function DisclaimerPage() {
  return (
    <main className="legal-page">
      <Link href="/" className="legal-back">
        <span>←</span>
        <span>للرئيسية</span>
      </Link>

      <div className="legal-container">
        <aside className="legal-toc">
          <h3>المحتويات</h3>
          <nav aria-label="Table of contents">
            <ol>
              <li><a href="#intro">١. مقدمة</a></li>
              <li><a href="#nature">٢. طبيعة الخدمة</a></li>
              <li><a href="#emergency">٣. حالات الطوارئ</a></li>
              <li><a href="#consultations">٤. الاستشارات الطبية</a></li>
              <li><a href="#tests">٥. الفحوصات والتحاليل</a></li>
              <li><a href="#medications">٦. الأدوية</a></li>
              <li><a href="#tools">٧. الأدوات الذكية</a></li>
              <li><a href="#liability">٨. حدود المسؤولية</a></li>
              <li><a href="#advice">٩. متى تطلب المساعدة الفورية؟</a></li>
              <li><a href="#contact">١٠. التواصل</a></li>
            </ol>
          </nav>
        </aside>

        <article className="legal-content">
          <header className="legal-header">
            <span className="legal-eyebrow">القانوني</span>
            <h1>إخلاء المسؤولية الطبية</h1>
            <p className="legal-meta">
              آخر تحديث: ٩ مايو ٢٠٢٦ · مهم — يُرجى القراءة بعناية
            </p>
          </header>

          <div className="legal-callout warning">
            <span className="legal-callout-icon">⚕️</span>
            <div>
              <strong>تنبيه طبي مهم:</strong> سباير ميديكال هي <strong>منصّة وسيطة</strong> تربط
              بين المرضى ومقدّمي الخدمة الطبية. نحن <strong>لا نُقدّم تشخيصاً طبياً</strong> ولا
              نستبدل الاستشارة المباشرة مع طبيب مرخّص.
            </div>
          </div>

          <section id="intro">
            <h2>١. مقدمة</h2>
            <p>
              يصف هذا المستند حدود مسؤوليتنا فيما يتعلق بالمحتوى الطبي والخدمات
              المقدّمة عبر منصة <strong>سباير ميديكال</strong>. باستخدامك للمنصّة،
              فإنك تُقرّ بفهمك وقبولك لهذه الحدود.
            </p>
          </section>

          <section id="nature">
            <h2>٢. طبيعة الخدمة</h2>
            <p>
              سباير ميديكال هي <strong>منصّة رقمية وسيطة</strong> تُسهّل:
            </p>
            <ul>
              <li>حجز الخدمات الطبية مع مزوّدين معتمدين</li>
              <li>التواصل مع أخصائيين مرخّصين</li>
              <li>طلب فحوصات منزلية عبر مختبرات شريكة</li>
              <li>توصيل أدوية من صيدليات معتمدة</li>
            </ul>
            <p>
              <strong>لسنا مزوّدي رعاية صحية مباشرين.</strong> نحن نوفّر البنية
              التقنية فقط، والخدمات الطبية الفعلية يقدّمها شركاؤنا المرخّصون.
            </p>
          </section>

          <section id="emergency">
            <h2>٣. حالات الطوارئ</h2>
            <div className="legal-callout warning">
              <span className="legal-callout-icon">🚨</span>
              <div>
                <strong>في حالات الطوارئ الفورية:</strong> اتصل برقم الإسعاف
                <strong> ١٢٢ </strong>
                مباشرة أو توجّه إلى أقرب مستشفى. <strong>لا تستخدم سباير ميديكال
                للحالات التي تهدّد الحياة.</strong>
              </div>
            </div>
            <p>
              زر <strong>طوارئ SOS</strong> في التطبيق هو أداة <em>مساعدة</em>
              لإرسال موقعك ومعلوماتك الطبية للجهات المعنيّة، لكنه <strong>لا يستبدل</strong>
              الاتصال بالإسعاف.
            </p>
          </section>

          <section id="consultations">
            <h2>٤. الاستشارات الطبية</h2>
            <p>
              الاستشارات عبر المنصّة تتم مع <strong>أطبّاء مرخّصين</strong> من وزارة
              الصحة العراقية. مع ذلك:
            </p>
            <ul>
              <li>الاستشارة عن بُعد لها حدودها مقارنة بالفحص السريري</li>
              <li>قد يطلب الطبيب فحوصاً إضافية أو زيارة العيادة</li>
              <li>لا يمكن تشخيص جميع الحالات عبر الفيديو أو الدردشة</li>
              <li>تقع المسؤولية المهنية على الطبيب المعالج، وليس على المنصّة</li>
            </ul>
          </section>

          <section id="tests">
            <h2>٥. الفحوصات والتحاليل</h2>
            <p>
              <strong>التحاليل المختبرية</strong> تُجرى في مختبرات معتمدة من وزارة
              الصحة. نتيجة التحليل:
            </p>
            <ul>
              <li>يجب أن تُفسّر بواسطة طبيب مختص</li>
              <li>لا تُعتبر تشخيصاً نهائياً بحدّ ذاتها</li>
              <li>قد تتأثر بعوامل عدة (الصيام، الأدوية، التوقيت)</li>
            </ul>
            <p>
              المسؤولية عن دقّة النتيجة تقع على <strong>المختبر المنفّذ</strong>،
              وليس على سباير ميديكال.
            </p>
          </section>

          <section id="medications">
            <h2>٦. الأدوية</h2>
            <p>
              الأدوية المتوفرة عبر المنصّة:
            </p>
            <ul>
              <li>تُصرف من <strong>صيدليات مرخّصة</strong> فقط</li>
              <li>الأدوية التي تتطلّب وصفة طبية لن تُصرف بدون وصفة سارية</li>
              <li>راجع <strong>النشرة الداخلية</strong> لكل دواء قبل الاستخدام</li>
              <li>أبلغ طبيبك عن أي حساسية أو دواء آخر تتناوله</li>
            </ul>
            <div className="legal-callout">
              <span className="legal-callout-icon">💊</span>
              <div>
                <strong>تنبيه:</strong> لا تتناول أي دواء دون استشارة طبية،
                حتى لو كان متاحاً بدون وصفة.
              </div>
            </div>
          </section>

          <section id="tools">
            <h2>٧. الأدوات الذكية</h2>
            <p>
              تتضمّن المنصّة أدوات مساعدة مثل:
            </p>
            <ul>
              <li><strong>حاسبة المخاطر الصحية:</strong> تقدير إحصائي عام</li>
              <li><strong>مدقّق الأعراض:</strong> أداة تثقيفية وليست تشخيصية</li>
              <li><strong>تذكير الأدوية:</strong> أداة مساعدة على الالتزام</li>
              <li><strong>تتبّع المؤشرات الحيوية:</strong> سجل شخصي فقط</li>
            </ul>
            <div className="legal-callout warning">
              <span className="legal-callout-icon">🤖</span>
              <div>
                <strong>تحذير:</strong> هذه الأدوات <strong>تثقيفية ومساعدة فقط</strong>.
                نتائجها <strong>ليست تشخيصاً طبياً</strong> ولا تستبدل
                زيارة الطبيب المختص.
              </div>
            </div>
          </section>

          <section id="liability">
            <h2>٨. حدود المسؤولية</h2>
            <p>
              <strong>سباير ميديكال غير مسؤولة عن:</strong>
            </p>
            <ul>
              <li>القرارات الطبية التي تتّخذها بناءً على المحتوى المعروض</li>
              <li>أخطاء التشخيص أو العلاج من قِبل المزوّدين الخارجيين</li>
              <li>أي ضرر ناتج عن استخدام الأدوات الذكية كبديل عن الطبيب</li>
              <li>تأخّر الخدمة بسبب ظروف خارجة عن سيطرتنا</li>
              <li>دقة المعلومات التي يُدخلها المستخدم في حسابه</li>
            </ul>
          </section>

          <section id="advice">
            <h2>٩. متى تطلب المساعدة الفورية؟</h2>
            <p>
              <strong>اتصل بالإسعاف ١٢٢ فوراً</strong> أو توجّه لأقرب طوارئ في الحالات التالية:
            </p>
            <ul>
              <li>ألم شديد ومفاجئ في الصدر</li>
              <li>صعوبة في التنفس</li>
              <li>فقدان الوعي أو إغماء</li>
              <li>نزيف لا يتوقّف</li>
              <li>إصابة شديدة في الرأس</li>
              <li>أعراض السكتة الدماغية (ضعف مفاجئ، تشوّش الكلام)</li>
              <li>تشنّجات</li>
              <li>أفكار إيذاء النفس</li>
            </ul>
          </section>

          <section id="contact">
            <h2>١٠. التواصل</h2>
            <p>
              لأي استفسار حول هذا الإخلاء أو الخدمات الطبية:
            </p>
            <ul>
              <li>البريد الإلكتروني: <a href="mailto:medical@spirmedical.iq">medical@spirmedical.iq</a></li>
              <li>الدعم الفني: <a href="mailto:support@spirmedical.iq">support@spirmedical.iq</a></li>
              <li>صفحة <Link href="/legal/terms">الشروط والأحكام</Link></li>
              <li>صفحة <Link href="/legal/privacy">سياسة الخصوصية</Link></li>
            </ul>
            <p>
              تذكّر دائماً: <strong>صحتك أولوية</strong>. عند الشكّ، استشر
              طبيباً مرخّصاً.
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
