// ⚡ V27 Performance: ISR caching (86400s)
export const revalidate = 86400;

import Link from 'next/link';

export const metadata = {
  title: 'سياسة الخصوصية · سباير ميديكال',
  description: 'كيف نجمع ونحمي بياناتك الطبية والشخصية',
};

export default function PrivacyPage() {
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
              <li><a href="#data">٢. البيانات التي نجمعها</a></li>
              <li><a href="#usage">٣. كيف نستخدم بياناتك</a></li>
              <li><a href="#share">٤. مشاركة البيانات</a></li>
              <li><a href="#cookies">٥. الكوكيز</a></li>
              <li><a href="#security">٦. الأمان</a></li>
              <li><a href="#rights">٧. حقوقك</a></li>
              <li><a href="#retention">٨. مدة الاحتفاظ</a></li>
              <li><a href="#contact">٩. تواصل معنا</a></li>
            </ol>
          </nav>
        </aside>

        <article className="legal-content">
          <header className="legal-header">
            <span className="legal-eyebrow">القانوني</span>
            <h1>سياسة الخصوصية</h1>
            <p className="legal-meta">
              آخر تحديث: ٧ مايو ٢٠٢٦ · متوافقة مع GDPR و قوانين العراق
            </p>
          </header>

          <div className="legal-highlight">
            <strong>🔒 خصوصيتك أولويّتنا</strong>
            <p>
              نُدرك أن بياناتك الطبية حسّاسة. نلتزم بحمايتها بأعلى معايير 
              الأمان الصناعية، ولا نبيعها أو نشاركها مع جهات تجارية.
            </p>
          </div>

          <section id="intro">
            <h2>١. مقدمة</h2>
            <p>
              توضّح هذه السياسة كيف تجمع <strong>سباير ميديكال</strong> 
              بياناتك وتستخدمها وتحميها. نلتزم بالشفافية الكاملة معك بشأن 
              ما نعرفه عنك ولماذا.
            </p>
            <p>
              هذه السياسة تتوافق مع:
            </p>
            <ul>
              <li>قوانين حماية البيانات في جمهورية العراق</li>
              <li>اللائحة الأوروبية لحماية البيانات (GDPR)</li>
              <li>المعايير الدولية لحماية البيانات الطبية</li>
            </ul>
          </section>

          <section id="data">
            <h2>٢. البيانات التي نجمعها</h2>

            <h3>٢.١ بيانات أنت تُقدّمها لنا</h3>
            <table className="legal-table">
              <thead>
                <tr>
                  <th>نوع البيانات</th>
                  <th>أمثلة</th>
                  <th>إلزامية؟</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>هوية</td>
                  <td>الاسم، رقم الهاتف</td>
                  <td>✅ نعم</td>
                </tr>
                <tr>
                  <td>طبية</td>
                  <td>التاريخ المرضي، الحساسية، الأدوية</td>
                  <td>اختياري</td>
                </tr>
                <tr>
                  <td>الموقع</td>
                  <td>عنوان الخدمة المنزلية</td>
                  <td>✅ للخدمات المنزلية</td>
                </tr>
                <tr>
                  <td>دفع</td>
                  <td>طريقة الدفع (لا نحفظ تفاصيل البطاقة)</td>
                  <td>للمعاملات المدفوعة</td>
                </tr>
              </tbody>
            </table>

            <h3>٢.٢ بيانات تُجمع تلقائياً</h3>
            <ul>
              <li><strong>تقنية:</strong> نوع الجهاز، نظام التشغيل، المتصفح</li>
              <li><strong>الاستخدام:</strong> الصفحات المُزارة، وقت التصفح</li>
              <li><strong>تحليلية:</strong> عبر Vercel Analytics (مجهولة الهوية)</li>
            </ul>

            <h3>٢.٣ بيانات لا نجمعها</h3>
            <p>نُؤكّد لك أنّنا <strong>لا نجمع</strong>:</p>
            <ul>
              <li>كلمات المرور (نستخدم OTP فقط)</li>
              <li>تفاصيل البطاقة الائتمانية الكاملة</li>
              <li>محادثاتك على وسائل التواصل الأخرى</li>
              <li>الموقع الجغرافي بدون إذنك الصريح</li>
            </ul>
          </section>

          <section id="usage">
            <h2>٣. كيف نستخدم بياناتك</h2>
            <p>نستخدم بياناتك للأغراض التالية فقط:</p>
            <ul>
              <li>✅ تقديم الخدمات الطبية المطلوبة</li>
              <li>✅ التواصل معك بخصوص حجوزاتك</li>
              <li>✅ معالجة المدفوعات</li>
              <li>✅ تحسين تجربتك في التطبيق</li>
              <li>✅ الالتزام بالقوانين العراقية</li>
              <li>✅ منع الاحتيال وحماية الأمن</li>
            </ul>

            <div className="legal-highlight">
              <strong>❌ لن نستخدم بياناتك أبداً لـ:</strong>
              <ul>
                <li>بيعها لأطراف ثالثة</li>
                <li>التسويق دون موافقتك</li>
                <li>التحليل النفسي أو السلوكي</li>
              </ul>
            </div>
          </section>

          <section id="share">
            <h2>٤. مشاركة البيانات</h2>
            <p>نشارك بياناتك فقط مع:</p>

            <h3>٤.١ مزوّدو الخدمة الطبية</h3>
            <p>
              نشارك المعلومات الضرورية فقط مع الطبيب أو الفني المختار، 
              ومحدودة بنطاق الخدمة المطلوبة.
            </p>

            <h3>٤.٢ مزوّدو الخدمات التقنية</h3>
            <ul>
              <li><strong>Supabase:</strong> استضافة قاعدة البيانات</li>
              <li><strong>Vercel:</strong> استضافة الموقع</li>
              <li><strong>Twilio:</strong> إرسال رسائل OTP</li>
            </ul>

            <h3>٤.٣ السلطات القانونية</h3>
            <p>
              فقط بأمر قضائي رسمي صادر من المحاكم العراقية المختصة.
            </p>
          </section>

          <section id="cookies">
            <h2>٥. الكوكيز (Cookies)</h2>
            <p>نستخدم ٣ أنواع من الكوكيز:</p>

            <table className="legal-table">
              <thead>
                <tr>
                  <th>النوع</th>
                  <th>الغرض</th>
                  <th>هل يمكن رفضها؟</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>ضرورية</strong></td>
                  <td>تسجيل الدخول، حفظ الجلسة</td>
                  <td>❌ لا (إجباري للعمل)</td>
                </tr>
                <tr>
                  <td>تحليلية</td>
                  <td>إحصاءات الاستخدام (Vercel)</td>
                  <td>✅ نعم</td>
                </tr>
                <tr>
                  <td>تسويقية</td>
                  <td>تخصيص الإعلانات</td>
                  <td>✅ نعم (غير مُفعّلة حالياً)</td>
                </tr>
              </tbody>
            </table>

            <p>
              يمكنك إدارة تفضيلات الكوكيز في أي وقت من{' '}
              <Link href="/account/settings" className="legal-inline-link">
                إعدادات الخصوصية
              </Link>.
            </p>
          </section>

          <section id="security">
            <h2>٦. كيف نحمي بياناتك</h2>
            <p>نستخدم أحدث المعايير الأمنية:</p>
            <ul>
              <li>🔐 <strong>تشفير AES-256</strong> للبيانات الحساسة</li>
              <li>🔒 <strong>HTTPS/TLS</strong> لكل الاتصالات</li>
              <li>🛡️ <strong>RLS</strong> (Row-Level Security) في قاعدة البيانات</li>
              <li>🔑 <strong>OTP</strong> بدلاً من كلمات المرور</li>
              <li>📊 <strong>Audit logs</strong> لكل تغيير في البيانات</li>
              <li>⏱️ <strong>Rate limiting</strong> ضد الاختراق</li>
            </ul>
          </section>

          <section id="rights">
            <h2>٧. حقوقك</h2>
            <p>تحت قوانين GDPR والقوانين العراقية، لك الحق في:</p>

            <div className="legal-rights-grid">
              <div className="legal-right">
                <strong>📥 الوصول</strong>
                <p>طلب نسخة من جميع بياناتك</p>
              </div>
              <div className="legal-right">
                <strong>✏️ التصحيح</strong>
                <p>تعديل أي معلومات خاطئة</p>
              </div>
              <div className="legal-right">
                <strong>🗑️ الحذف</strong>
                <p>حذف حسابك وبياناتك</p>
              </div>
              <div className="legal-right">
                <strong>⏸️ التقييد</strong>
                <p>إيقاف معالجة بياناتك مؤقتاً</p>
              </div>
              <div className="legal-right">
                <strong>📤 النقل</strong>
                <p>الحصول على بياناتك بصيغة قابلة للاستخدام</p>
              </div>
              <div className="legal-right">
                <strong>🚫 الاعتراض</strong>
                <p>رفض معالجة بياناتك لأغراض محدّدة</p>
              </div>
            </div>

            <p>
              لممارسة أي من هذه الحقوق، راسلنا على{' '}
              <a href="mailto:privacy@spir-medical.com" className="legal-inline-link">
                privacy@spir-medical.com
              </a>{' '}
              أو من إعدادات حسابك.
            </p>
          </section>

          <section id="retention">
            <h2>٨. مدة الاحتفاظ بالبيانات</h2>
            <table className="legal-table">
              <thead>
                <tr>
                  <th>نوع البيانات</th>
                  <th>المدة</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>الحساب والبيانات الشخصية</td>
                  <td>طوال نشاط الحساب</td>
                </tr>
                <tr>
                  <td>السجل الطبي</td>
                  <td>١٠ سنوات (قانون عراقي)</td>
                </tr>
                <tr>
                  <td>سجلات المعاملات المالية</td>
                  <td>٧ سنوات (للضرائب)</td>
                </tr>
                <tr>
                  <td>سجلات Audit</td>
                  <td>٣ سنوات</td>
                </tr>
                <tr>
                  <td>الكوكيز التحليلية</td>
                  <td>١٢ شهر</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section id="contact">
            <h2>٩. مسؤول حماية البيانات</h2>
            <div className="legal-contact-card">
              <div>
                <strong>📧 الأسئلة العامة</strong>
                <a href="mailto:privacy@spir-medical.com">privacy@spir-medical.com</a>
              </div>
              <div>
                <strong>📧 شكاوى الخصوصية</strong>
                <a href="mailto:dpo@spir-medical.com">dpo@spir-medical.com</a>
              </div>
              <div>
                <strong>⏱️ زمن الرد</strong>
                <span>خلال ٤٨ ساعة عمل</span>
              </div>
            </div>
          </section>

          <footer className="legal-footer">
            <div className="legal-actions">
              <Link href="/legal/terms" className="legal-link-btn">
                الشروط والأحكام ←
              </Link>
              <Link href="/" className="legal-link-btn outline">
                العودة للرئيسية
              </Link>
            </div>
          </footer>
        </article>
      </div>
    </main>
  );
}
