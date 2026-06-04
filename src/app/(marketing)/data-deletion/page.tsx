export const revalidate = 86400;

import Link from 'next/link';
import DeletionForm from './DeletionForm';

export const metadata = {
  title: 'سياسة حذف البيانات · سباير ميديكال',
  description: 'كيفية طلب حذف بياناتك الشخصية من سباير ميديكال — آلية موثّقة وآمنة.',
};

export default function DataDeletionPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
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
              <li><a href="#what-data">٢. البيانات المخزّنة</a></li>
              <li><a href="#how-to-request">٣. كيفية طلب الحذف</a></li>
              <li><a href="#verification">٤. التحقّق من الهوية</a></li>
              <li><a href="#timeline">٥. المدة الزمنية</a></li>
              <li><a href="#retention">٦. الاحتفاظ القانوني</a></li>
              <li><a href="#request-form">٧. نموذج الطلب</a></li>
            </ol>
          </nav>
        </aside>

        <article className="legal-content">
          <h1>سياسة حذف البيانات</h1>
          <p className="legal-updated">آخر تحديث: يونيو ٢٠٢٦</p>

          <section id="intro">
            <h2>١. مقدمة</h2>
            <p>
              في سباير ميديكال، نحترم حقّك في التحكّم ببياناتك. تشرح هذه الصفحة كيف يمكنك
              طلب حذف بياناتك الشخصية، والإجراءات التي نتّبعها لحماية حسابك من الحذف
              غير المقصود.
            </p>
            <p>
              <strong>ملاحظة مهمّة:</strong> نظراً لطبيعة بياناتك الطبية الحسّاسة، اعتمدنا
              آلية حذف موثّقة تتطلّب التحقّق من هويتك. هذا يحميك من فقدان سجلّاتك الطبية
              عن طريق الخطأ أو نتيجة وصول غير مصرّح به لحسابك.
            </p>
          </section>

          <section id="what-data">
            <h2>٢. البيانات التي نخزّنها</h2>
            <p>قد تشمل بياناتك في سباير ميديكال:</p>
            <ul>
              <li>معلومات الحساب: الاسم، رقم الهاتف، البريد الإلكتروني.</li>
              <li>السجلّات الطبية: المواعيد، نتائج التحاليل، الوصفات، تاريخ الزيارات.</li>
              <li>أفراد العائلة المرتبطون بحسابك.</li>
              <li>بيانات الاستخدام والتفضيلات.</li>
              <li>سجلّات التواصل عبر واتساب (إن استخدمت هذه الخدمة).</li>
            </ul>
          </section>

          <section id="how-to-request">
            <h2>٣. كيفية طلب الحذف</h2>
            <p>
              لطلب حذف بياناتك، املأ النموذج في أسفل هذه الصفحة بدقّة. سيصل طلبك مباشرةً
              إلى فريق الشركة عبر البريد الإلكتروني الرسمي، وسنتولّى مراجعته يدوياً.
            </p>
            <p>
              بدلاً من ذلك، يمكنك مراسلتنا مباشرةً على{' '}
              <strong>inzohussein@gmail.com</strong> مع تضمين اسمك ورقم هاتفك المسجّل.
            </p>
          </section>

          <section id="verification">
            <h2>٤. التحقّق من الهوية</h2>
            <p>
              لحماية بياناتك الطبية، <strong>لن نحذف أيّ بيانات قبل التحقّق من هويتك.</strong>{' '}
              قد نطلب منك:
            </p>
            <ul>
              <li>تأكيد رقم الهاتف المسجّل في الحساب.</li>
              <li>تأكيد البريد الإلكتروني المرتبط.</li>
              <li>الإجابة عن أسئلة أمان تتعلّق بنشاط حسابك.</li>
            </ul>
            <p>
              هذا الإجراء صارم عمداً — فالبيانات الطبية لا يمكن استرجاعها بعد الحذف، ونريد
              التأكّد التامّ من أنّ الطلب صادر منك شخصياً.
            </p>
          </section>

          <section id="timeline">
            <h2>٥. المدة الزمنية</h2>
            <p>
              بعد التحقّق من هويتك والموافقة على الطلب، نحذف بياناتك خلال مدّة أقصاها{' '}
              <strong>٣٠ يوماً</strong>. سنُرسل لك تأكيداً عند اكتمال الحذف.
            </p>
          </section>

          <section id="retention">
            <h2>٦. الاحتفاظ القانوني</h2>
            <p>
              قد نحتفظ ببعض البيانات لفترة محدودة بعد طلب الحذف إذا كان ذلك مطلوباً
              بموجب القانون العراقي (مثل السجلّات المالية للفواتير، أو البيانات المتعلّقة
              بنزاع قانوني قائم). نحذف هذه البيانات فور انتهاء المدّة القانونية.
            </p>
          </section>

          <section id="request-form">
            <h2>٧. نموذج طلب الحذف</h2>
            <p>
              املأ الحقول التالية بدقّة. جميع الحقول مطلوبة، وستحتاج لكتابة عبارة تأكيد
              صريحة لإتمام الطلب.
            </p>

            <DeletionForm error={searchParams.error} success={searchParams.success} />
          </section>
        </article>
      </div>
    </main>
  );
}
