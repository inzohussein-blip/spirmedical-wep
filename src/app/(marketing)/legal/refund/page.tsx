import Link from 'next/link';

export const metadata = {
  title: 'سياسة الاسترداد · سباير ميديكال',
  description: 'شروط وأحكام استرداد المدفوعات في سباير ميديكال',
};

export default function RefundPage() {
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
              <li><a href="#cancellation">٢. الإلغاء</a></li>
              <li><a href="#refund-cases">٣. حالات الاسترداد</a></li>
              <li><a href="#how-to-refund">٤. كيفية الاسترداد</a></li>
              <li><a href="#timeline">٥. مدة الاسترداد</a></li>
              <li><a href="#disputes">٦. النزاعات</a></li>
              <li><a href="#exceptions">٧. الاستثناءات</a></li>
              <li><a href="#contact">٨. تواصل معنا</a></li>
            </ol>
          </nav>
        </aside>

        <article className="legal-content">
          <header className="legal-header">
            <span className="legal-eyebrow">القانوني</span>
            <h1>سياسة الاسترداد</h1>
            <p className="legal-meta">
              آخر تحديث: ٢٠ مايو ٢٠٢٦
            </p>
          </header>

          <div className="legal-highlight">
            <strong>💰 شفافية كاملة</strong>
            <p>
              نُؤمن بحقّك في استرداد أموالك في حالات محدّدة. هذه السياسة
              تشرح متى وكيف نُعيد المدفوعات بشفافية.
            </p>
          </div>

          <section id="intro">
            <h2>١. مقدمة</h2>
            <p>
              تُحدّد هذه السياسة الشروط التي يحقّ بموجبها للمستخدم استرداد
              المبلغ المدفوع مقابل خدمة من خدمات سباير ميديكال. باستخدامك
              للمنصّة، فإنك توافق على هذه السياسة.
            </p>
            <p>
              <strong>ملاحظة هامّة:</strong> حالياً جميع المدفوعات تتم نقداً (كاش)
              للمختصّ عند وصوله. سياسة الاسترداد تنطبق على حالات معيّنة وتُدار
              يدوياً عبر فريق الدعم.
            </p>
          </section>

          <section id="cancellation">
            <h2>٢. الإلغاء</h2>
            <h3>إلغاء قبل وصول المختصّ:</h3>
            <ul>
              <li><strong>قبل أكثر من ٣٠ دقيقة من الموعد:</strong> إلغاء مجاني تماماً</li>
              <li><strong>قبل ١٥-٣٠ دقيقة:</strong> رسم رمزي ٢٠٠٠ د.ع لتعويض الانتقال</li>
              <li><strong>أقل من ١٥ دقيقة أو بعد وصول المختصّ:</strong> رسم انتقال كامل (حسب الخدمة)</li>
            </ul>

            <h3>إلغاء بعد بدء الخدمة:</h3>
            <p>
              لا يُمكن إلغاء الخدمة بعد بدء التنفيذ. في الحالات الاستثنائية،
              يحقّ للمستخدم تقديم شكوى للمراجعة.
            </p>
          </section>

          <section id="refund-cases">
            <h2>٣. حالات الاسترداد</h2>
            <p>
              يحقّ للمستخدم استرداد جزئي أو كامل في الحالات التالية:
            </p>

            <h3>استرداد كامل (١٠٠٪):</h3>
            <ul>
              <li>عدم وصول المختصّ في الموعد دون إشعار مسبق</li>
              <li>إلغاء الخدمة من قِبَلنا لأي سبب</li>
              <li>خطأ تقني أدى لخصم مزدوج</li>
              <li>عدم تقديم الخدمة كما هو مُتّفق عليه</li>
            </ul>

            <h3>استرداد جزئي (٥٠-٨٠٪):</h3>
            <ul>
              <li>تأخّر المختصّ أكثر من ساعة عن الموعد</li>
              <li>تقديم خدمة جزئية بسبب ظروف قاهرة</li>
              <li>عدم رضا المستخدم مع مبررات مقبولة</li>
            </ul>
          </section>

          <section id="how-to-refund">
            <h2>٤. كيفية طلب الاسترداد</h2>
            <ol>
              <li>اذهب إلى صفحة الحجز المعني من &quot;طلباتي&quot;</li>
              <li>اضغط &quot;طلب استرداد&quot; أو تواصل مع الدعم</li>
              <li>اكتب سبب الطلب مع أي أدلّة (صور، رسائل)</li>
              <li>سيُراجع الفريق الطلب خلال ٢٤-٤٨ ساعة</li>
              <li>عند الموافقة، يُضاف المبلغ إلى محفظتك في التطبيق</li>
            </ol>
          </section>

          <section id="timeline">
            <h2>٥. مدة الاسترداد</h2>
            <table className="legal-table">
              <thead>
                <tr>
                  <th>المرحلة</th>
                  <th>المدة</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>مراجعة الطلب</td>
                  <td>٢٤-٤٨ ساعة</td>
                </tr>
                <tr>
                  <td>الموافقة والإضافة للمحفظة</td>
                  <td>فوري بعد الموافقة</td>
                </tr>
                <tr>
                  <td>استرداد نقدي (إن طُلب)</td>
                  <td>٧-١٤ يوم عمل</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section id="disputes">
            <h2>٦. النزاعات</h2>
            <p>
              في حال رفض طلب الاسترداد، يحقّ للمستخدم تقديم اعتراض رسمي
              عبر البريد الإلكتروني <strong>legal@spirmedical.com</strong>.
              سيُراجع الاعتراض من قِبَل مدير الخدمات خلال ٧ أيام عمل.
            </p>
            <p>
              في حال عدم التوصّل لاتفاق، يحقّ للطرفين اللجوء للقضاء العراقي
              المختصّ.
            </p>
          </section>

          <section id="exceptions">
            <h2>٧. الاستثناءات</h2>
            <p>
              لا يحقّ الاسترداد في الحالات التالية:
            </p>
            <ul>
              <li>طلب الاسترداد بعد ٣٠ يوم من تاريخ الخدمة</li>
              <li>الاستشارات المُنجزة بنجاح (الطبيب رد وقدّم النصيحة)</li>
              <li>الاشتراكات الشهرية/السنوية بعد مرور ٧ أيام من بدئها</li>
              <li>تقديم معلومات خاطئة من المستخدم أدّت لمشكلة في الخدمة</li>
              <li>محاولة الاحتيال أو الإساءة لاستخدام السياسة</li>
            </ul>
          </section>

          <section id="contact">
            <h2>٨. تواصل معنا</h2>
            <p>
              للاستفسار عن أي طلب استرداد أو شكوى:
            </p>
            <ul>
              <li>📧 البريد: <strong>refunds@spirmedical.com</strong></li>
              <li>📞 الهاتف: <strong>07700000000</strong></li>
              <li>💬 WhatsApp: <strong>9647700000000</strong></li>
              <li>أو زر <Link href="/contact">صفحة الاتصال</Link></li>
            </ul>

            <p style={{ marginTop: 20, fontSize: 12, color: 'var(--ink-3)' }}>
              تُحفظ سباير ميديكال حقّ تعديل هذه السياسة في أي وقت.
              التعديلات تصبح سارية من تاريخ نشرها.
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
