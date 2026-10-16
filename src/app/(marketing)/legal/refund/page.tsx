// ⚡ V27 Performance: ISR caching (86400s)
export const revalidate = 86400;

import Link from 'next/link';

export const metadata = {
  alternates: { canonical: '/legal/refund' },
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
              <li><a href="#intro">1. مقدمة</a></li>
              <li><a href="#cancellation">2. الإلغاء</a></li>
              <li><a href="#refund-cases">3. حالات الاسترداد</a></li>
              <li><a href="#how-to-refund">4. كيفية الاسترداد</a></li>
              <li><a href="#timeline">5. مدة الاسترداد</a></li>
              <li><a href="#disputes">6. النزاعات</a></li>
              <li><a href="#exceptions">7. الاستثناءات</a></li>
              <li><a href="#contact">8. تواصل معنا</a></li>
            </ol>
          </nav>
        </aside>

        <article className="legal-content">
          <header className="legal-header">
            <span className="legal-eyebrow">القانوني</span>
            <h1>سياسة الاسترداد</h1>
            <p className="legal-meta">
              آخر تحديث: 20 مايو 2026
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
            <h2>1. مقدمة</h2>
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
            <h2>2. الإلغاء</h2>
            <h3>إلغاء قبل وصول المختصّ:</h3>
            <ul>
              <li><strong>قبل أكثر من 30 دقيقة من الموعد:</strong> إلغاء مجاني تماماً</li>
              <li><strong>قبل 15-30 دقيقة:</strong> رسم رمزي 2000 د.ع لتعويض الانتقال</li>
              <li><strong>أقل من 15 دقيقة أو بعد وصول المختصّ:</strong> رسم انتقال كامل (حسب الخدمة)</li>
            </ul>

            <h3>إلغاء بعد بدء الخدمة:</h3>
            <p>
              لا يُمكن إلغاء الخدمة بعد بدء التنفيذ. في الحالات الاستثنائية،
              يحقّ للمستخدم تقديم شكوى للمراجعة.
            </p>
          </section>

          <section id="refund-cases">
            <h2>3. حالات الاسترداد</h2>
            <p>
              يحقّ للمستخدم استرداد جزئي أو كامل في الحالات التالية:
            </p>

            <h3>استرداد كامل (100٪):</h3>
            <ul>
              <li>عدم وصول المختصّ في الموعد دون إشعار مسبق</li>
              <li>إلغاء الخدمة من قِبَلنا لأي سبب</li>
              <li>خطأ تقني أدى لخصم مزدوج</li>
              <li>عدم تقديم الخدمة كما هو مُتّفق عليه</li>
            </ul>

            <h3>استرداد جزئي (50-80٪):</h3>
            <ul>
              <li>تأخّر المختصّ أكثر من ساعة عن الموعد</li>
              <li>تقديم خدمة جزئية بسبب ظروف قاهرة</li>
              <li>عدم رضا المستخدم مع مبررات مقبولة</li>
            </ul>
          </section>

          <section id="how-to-refund">
            <h2>4. كيفية طلب الاسترداد</h2>
            <ol>
              <li>اذهب إلى صفحة الحجز المعني من &quot;طلباتي&quot;</li>
              <li>اضغط &quot;طلب استرداد&quot; أو تواصل مع الدعم</li>
              <li>اكتب سبب الطلب مع أي أدلّة (صور، رسائل)</li>
              <li>سيُراجع الفريق الطلب خلال 24-48 ساعة</li>
              <li>عند الموافقة، يُضاف المبلغ إلى محفظتك في التطبيق</li>
            </ol>
          </section>

          <section id="timeline">
            <h2>5. مدة الاسترداد</h2>
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
                  <td>24-48 ساعة</td>
                </tr>
                <tr>
                  <td>الموافقة والإضافة للمحفظة</td>
                  <td>فوري بعد الموافقة</td>
                </tr>
                <tr>
                  <td>استرداد نقدي (إن طُلب)</td>
                  <td>7-14 يوم عمل</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section id="disputes">
            <h2>6. النزاعات</h2>
            <p>
              في حال رفض طلب الاسترداد، يحقّ للمستخدم تقديم اعتراض رسمي
              عبر البريد الإلكتروني <strong>legal@spir-medical.com</strong>.
              سيُراجع الاعتراض من قِبَل مدير الخدمات خلال 7 أيام عمل.
            </p>
            <p>
              في حال عدم التوصّل لاتفاق، يحقّ للطرفين اللجوء للقضاء العراقي
              المختصّ.
            </p>
          </section>

          <section id="exceptions">
            <h2>7. الاستثناءات</h2>
            <p>
              لا يحقّ الاسترداد في الحالات التالية:
            </p>
            <ul>
              <li>طلب الاسترداد بعد 30 يوم من تاريخ الخدمة</li>
              <li>الاستشارات المُنجزة بنجاح (الطبيب رد وقدّم النصيحة)</li>
              <li>الاشتراكات الشهرية/السنوية بعد مرور 7 أيام من بدئها</li>
              <li>تقديم معلومات خاطئة من المستخدم أدّت لمشكلة في الخدمة</li>
              <li>محاولة الاحتيال أو الإساءة لاستخدام السياسة</li>
            </ul>
          </section>

          <section id="contact">
            <h2>8. تواصل معنا</h2>
            <p>
              للاستفسار عن أي طلب استرداد أو شكوى:
            </p>
            <ul>
              <li>📧 البريد: <strong>refunds@spir-medical.com</strong></li>
              <li>📞 الهاتف: <strong>07803993585</strong></li>
              <li>💬 WhatsApp: <strong>9647803993585</strong></li>
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
