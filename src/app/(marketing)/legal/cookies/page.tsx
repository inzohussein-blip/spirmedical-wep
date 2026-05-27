// ⚡ V27 Performance: ISR caching (86400s)
export const revalidate = 86400;

import Link from 'next/link';

export const metadata = {
  title: 'سياسة الكوكيز · سباير ميديكال',
  description: 'سياسة استخدام ملفات تعريف الارتباط (الكوكيز) في منصة سباير ميديكال',
};

export default function CookiesPage() {
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
              <li><a href="#intro">١. ما هي الكوكيز؟</a></li>
              <li><a href="#types">٢. أنواع الكوكيز المُستخدمة</a></li>
              <li><a href="#essential">٣. الكوكيز الأساسية</a></li>
              <li><a href="#analytics">٤. كوكيز التحليلات</a></li>
              <li><a href="#functional">٥. الكوكيز الوظيفية</a></li>
              <li><a href="#thirdparty">٦. الكوكيز من أطراف ثالثة</a></li>
              <li><a href="#manage">٧. إدارة الكوكيز</a></li>
              <li><a href="#changes">٨. التعديلات</a></li>
              <li><a href="#contact">٩. التواصل</a></li>
            </ol>
          </nav>
        </aside>

        <article className="legal-content">
          <header className="legal-header">
            <span className="legal-eyebrow">القانوني</span>
            <h1>سياسة الكوكيز</h1>
            <p className="legal-meta">
              آخر تحديث: ٩ مايو ٢٠٢٦ · تنطبق على جميع زوّار المنصة
            </p>
          </header>

          <section id="intro">
            <h2>١. ما هي الكوكيز؟</h2>
            <p>
              <strong>ملفات تعريف الارتباط (Cookies)</strong> هي ملفات نصية صغيرة
              يتم تخزينها على جهازك (هاتف، حاسوب، جهاز لوحي) عند زيارتك لموقع إلكتروني.
              تُستخدم لتذكّر تفضيلاتك، تحسين تجربتك، وتشغيل بعض الميزات الأساسية.
            </p>
            <p>
              في <strong>سباير ميديكال</strong>، نستخدم الكوكيز لضمان عمل الموقع
              بشكل صحيح وتقديم تجربة مخصّصة لك.
            </p>
          </section>

          <section id="types">
            <h2>٢. أنواع الكوكيز المُستخدمة</h2>
            <p>نستخدم أربعة أنواع رئيسية من الكوكيز:</p>
            <ul>
              <li><strong>الأساسية:</strong> ضرورية لتشغيل الموقع (لا يمكن تعطيلها)</li>
              <li><strong>التحليلات:</strong> تساعدنا في فهم كيفية استخدام الموقع</li>
              <li><strong>الوظيفية:</strong> تذكّر تفضيلاتك (اللغة، الإعدادات)</li>
              <li><strong>أطراف ثالثة:</strong> من خدمات نستخدمها (Vercel، Supabase)</li>
            </ul>
          </section>

          <section id="essential">
            <h2>٣. الكوكيز الأساسية</h2>
            <p>
              هذه الكوكيز <strong>ضرورية</strong> ولا يمكن تعطيلها لأن الموقع
              لن يعمل بدونها:
            </p>
            <ul>
              <li><strong>spir_session:</strong> جلسة تسجيل الدخول الآمنة</li>
              <li><strong>spir_csrf:</strong> حماية من هجمات تزوير الطلبات</li>
              <li><strong>spir_locale:</strong> تذكّر لغتك المختارة</li>
            </ul>
            <div className="legal-callout">
              <span className="legal-callout-icon">🔒</span>
              <div>
                <strong>أمان كامل:</strong> جميع كوكيز الجلسة مشفّرة ولا تحتوي
                على معلومات شخصية حسّاسة.
              </div>
            </div>
          </section>

          <section id="analytics">
            <h2>٤. كوكيز التحليلات</h2>
            <p>
              نستخدم <strong>Vercel Analytics</strong> لفهم كيفية تفاعل
              الزوّار مع الموقع. هذه التحليلات:
            </p>
            <ul>
              <li>لا تحدّد هويتك الشخصية</li>
              <li>تجمع بيانات إحصائية فقط (الصفحات الأكثر زيارة، سرعة التحميل)</li>
              <li>يمكنك إيقافها عبر شريط الموافقة على الكوكيز</li>
            </ul>
          </section>

          <section id="functional">
            <h2>٥. الكوكيز الوظيفية</h2>
            <p>
              تُحسّن تجربتك على الموقع بتذكّر:
            </p>
            <ul>
              <li>اللغة المُفضّلة</li>
              <li>الإعدادات الشخصية</li>
              <li>المنطقة الجغرافية للعرض المحلّي</li>
            </ul>
          </section>

          <section id="thirdparty">
            <h2>٦. الكوكيز من أطراف ثالثة</h2>
            <p>نستخدم خدمات خارجية موثوقة قد تضع كوكيز خاصة بها:</p>
            <ul>
              <li><strong>Vercel:</strong> استضافة وتسريع الموقع</li>
              <li><strong>Supabase:</strong> قاعدة البيانات والمصادقة</li>
              <li><strong>Google Fonts:</strong> تحميل خطوط الموقع</li>
            </ul>
            <p>
              كل طرف ثالث له سياسة كوكيز خاصة. ندعوك للاطلاع على سياساتهم
              لمزيد من المعلومات.
            </p>
          </section>

          <section id="manage">
            <h2>٧. إدارة الكوكيز</h2>
            <p>يمكنك التحكم في الكوكيز بعدة طرق:</p>
            <h3>عبر شريط الموافقة</h3>
            <p>
              عند زيارتك الأولى، يظهر شريط أسفل الشاشة يتيح لك قبول أو
              رفض الكوكيز غير الأساسية.
            </p>
            <h3>عبر إعدادات المتصفح</h3>
            <p>
              يمكنك حذف الكوكيز أو منعها من إعدادات متصفحك:
            </p>
            <ul>
              <li><strong>Chrome:</strong> الإعدادات → الخصوصية والأمان → ملفات تعريف الارتباط</li>
              <li><strong>Firefox:</strong> التفضيلات → الخصوصية والأمان</li>
              <li><strong>Safari:</strong> التفضيلات → الخصوصية</li>
              <li><strong>Edge:</strong> الإعدادات → ملفات تعريف الارتباط وأذونات الموقع</li>
            </ul>
            <div className="legal-callout warning">
              <span className="legal-callout-icon">⚠️</span>
              <div>
                <strong>تنبيه:</strong> تعطيل جميع الكوكيز قد يؤثر على
                وظائف الموقع، خاصة تسجيل الدخول وحفظ الإعدادات.
              </div>
            </div>
          </section>

          <section id="changes">
            <h2>٨. التعديلات على هذه السياسة</h2>
            <p>
              قد نُحدّث هذه السياسة من وقت لآخر. عند إجراء تغييرات جوهرية،
              سنُعلمك عبر:
            </p>
            <ul>
              <li>إشعار على الموقع</li>
              <li>بريد إلكتروني (للمستخدمين المسجّلين)</li>
              <li>تاريخ التحديث في أعلى الصفحة</li>
            </ul>
          </section>

          <section id="contact">
            <h2>٩. التواصل</h2>
            <p>
              إذا كان لديك أي سؤال حول سياسة الكوكيز، تواصل معنا:
            </p>
            <ul>
              <li>البريد الإلكتروني: <a href="mailto:privacy@spirmedical.iq">privacy@spirmedical.iq</a></li>
              <li>صفحة <Link href="/legal/privacy">سياسة الخصوصية</Link></li>
              <li>صفحة <Link href="/legal/terms">الشروط والأحكام</Link></li>
            </ul>
          </section>
        </article>
      </div>
    </main>
  );
}
