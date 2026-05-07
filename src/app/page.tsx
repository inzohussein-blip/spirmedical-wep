import Link from 'next/link';

export const metadata = {
  title: 'سباير ميديكال · Spir Medical — منصة طبية رقمية متكاملة',
  description: 'الرعاية الصحية بين يديك · ١٤ خدمة طبية · في كل المحافظات العراقية',
};

export default function HomePage() {
  return (
    <main className="landing">
      {/* ============ NAV ============ */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <Link href="/" className="landing-logo">
            <div className="landing-logo-mark">س</div>
            <div className="landing-logo-text">
              <strong>Spir Medical</strong>
              <span>سباير ميديكال</span>
            </div>
          </Link>
          <div className="landing-nav-actions">
            <Link href="/login" className="landing-nav-link">
              تسجيل دخول
            </Link>
            <Link href="/login" className="landing-nav-cta">
              ادخل التطبيق ←
            </Link>
          </div>
        </div>
      </nav>

      {/* ============ HERO ============ */}
      <section className="landing-hero">
        <div className="landing-hero-bg" aria-hidden="true"></div>
        <div className="landing-wrap">
          <div className="landing-hero-grid">
            <div className="landing-hero-text">
              <span className="landing-eyebrow">
                <span className="dot"></span>
                منصة طبية رقمية · العراق
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
                <Link href="/login" className="landing-cta-primary">
                  ابدأ الآن ←
                </Link>
                <Link href="/guest" className="landing-cta-secondary">
                  ▷ شاهد كيف يعمل
                </Link>
              </div>
              <div className="landing-trust">
                <div className="landing-trust-item">
                  <strong>+١٤</strong>
                  <span>خدمة طبية</span>
                </div>
                <div className="landing-trust-divider"></div>
                <div className="landing-trust-item">
                  <strong>١٨</strong>
                  <span>محافظة</span>
                </div>
                <div className="landing-trust-divider"></div>
                <div className="landing-trust-item">
                  <strong>٢٤/٧</strong>
                  <span>على مدار الساعة</span>
                </div>
              </div>
            </div>

            {/* Hero visual */}
            <div className="landing-hero-visual">
              <div className="landing-card-stack">
                <div className="landing-mini-card landing-mini-card-1">
                  <div className="landing-mini-icon">🩸</div>
                  <div className="landing-mini-name">سحب دم منزلي</div>
                  <div className="landing-mini-time">⚡ خلال ساعتين</div>
                </div>
                <div className="landing-mini-card landing-mini-card-2">
                  <div className="landing-mini-icon">💊</div>
                  <div className="landing-mini-name">صيدلية</div>
                  <div className="landing-mini-time">🚚 توصيل سريع</div>
                </div>
                <div className="landing-mini-card landing-mini-card-3">
                  <div className="landing-mini-icon">📞</div>
                  <div className="landing-mini-name">استشارة فورية</div>
                  <div className="landing-mini-time">💬 +٢٠ تخصص</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SERVICES ============ */}
      <section className="landing-services-section">
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
            <p>إدارة العائلة · المؤشرات الحيوية · قراءة الوصفات OCR · عيادات تجميل · تطعيمات</p>
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="landing-how">
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
                <Link href="/login" className="landing-cta-primary big">
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
                <li>سحب الدم المنزلي</li>
                <li>الفحوصات المختبرية</li>
                <li>الاستشارات الطبية</li>
                <li>الصيدليات</li>
              </ul>
            </div>
            <div className="landing-footer-col">
              <h4>الشركة</h4>
              <ul>
                <li>عن سباير</li>
                <li>الأخصائيون</li>
                <li>الشركاء</li>
                <li>المدوّنة</li>
              </ul>
            </div>
            <div className="landing-footer-col">
              <h4>تواصل</h4>
              <ul>
                <li>info@spirmedical.iq</li>
                <li>الدعم الفني</li>
                <li>الشروط والخصوصية</li>
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
