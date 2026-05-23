import Link from 'next/link';
import { ARTICLES, getAllCategories } from '@/lib/data/blog-articles';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'المدونة الطبية · سباير ميديكال',
  description: 'مقالات طبية موثوقة من أطباء متخصصين. نصائح صحية، شرح الأمراض، التحاليل، والوقاية بلغة سهلة ومبسّطة.',
  openGraph: {
    title: 'المدونة الطبية · سباير ميديكال',
    description: 'مقالات طبية موثوقة من أطباء متخصصين',
    type: 'website',
  },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ar-IQ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function BlogIndexPage() {
  const categories = getAllCategories();
  const featuredArticle = ARTICLES[0];
  const otherArticles = ARTICLES.slice(1);

  return (
    <main className="blog-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-wrap landing-nav-inner">
          <Link href="/" className="landing-logo">
            <div className="landing-logo-mark" aria-hidden="true">س</div>
            <div className="landing-logo-text">
              <span className="landing-logo-en">Spir Medical</span>
              <span className="landing-logo-ar">سباير ميديكال</span>
            </div>
          </Link>
          <div className="landing-nav-actions">
            <Link href="/" className="landing-link">الرئيسية</Link>
            <Link href="/login" className="landing-cta-primary">ادخل التطبيق ←</Link>
          </div>
        </div>
      </nav>

      <div className="blog-container landing-wrap">
        {/* Hero */}
        <header className="blog-hero">
          <span className="blog-hero-badge">
            <span aria-hidden="true">📚</span>
            <span>المدونة الطبية · {ARTICLES.length} مقال</span>
          </span>
          <h1 className="blog-hero-title">
            معرفة طبية موثوقة،
            <br />
            <span className="blog-hero-italic">بلغة بسيطة</span>
          </h1>
          <p className="blog-hero-desc">
            مقالات صحية مكتوبة من أطباء متخصصين عراقيين. نصائح عملية، شرح الأمراض،
            تفسير التحاليل، وطرق الوقاية - كل ما تحتاجه لحياة صحية أفضل.
          </p>
        </header>

        {/* Categories */}
        <section className="blog-categories">
          <Link href="/blog" className="blog-cat-pill active">
            <span aria-hidden="true">📋</span>
            <span>الكل</span>
            <span className="blog-cat-count">{ARTICLES.length}</span>
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/blog/category/${cat.slug}`}
              className="blog-cat-pill"
            >
              <span aria-hidden="true">{cat.icon}</span>
              <span>{cat.label}</span>
              <span className="blog-cat-count">{cat.count}</span>
            </Link>
          ))}
        </section>

        {/* Featured */}
        <section className="blog-featured-section">
          <div className="blog-section-label">
            <span aria-hidden="true">⭐</span>
            <span>المقال المميّز</span>
          </div>

          <Link href={`/blog/${featuredArticle.slug}`} className="blog-featured-card">
            <div
              className="blog-featured-cover"
              style={{ background: featuredArticle.coverGradient }}
            >
              <span className="blog-featured-emoji" aria-hidden="true">
                {featuredArticle.coverEmoji}
              </span>
            </div>

            <div className="blog-featured-content">
              <div className="blog-card-meta">
                <span className="blog-card-cat">{featuredArticle.categoryLabel}</span>
                <span>•</span>
                <span>{featuredArticle.readingMinutes} دقائق قراءة</span>
              </div>

              <h2 className="blog-featured-title">{featuredArticle.title}</h2>
              <p className="blog-featured-excerpt">{featuredArticle.excerpt}</p>

              <div className="blog-card-author">
                <div className="blog-author-avatar">
                  {featuredArticle.author.charAt(featuredArticle.author.indexOf(' ') + 1)}
                </div>
                <div>
                  <div className="blog-author-name">{featuredArticle.author}</div>
                  <div className="blog-author-meta">
                    {featuredArticle.authorTitle} · {formatDate(featuredArticle.publishedAt)}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </section>

        {/* Articles Grid */}
        <section className="blog-grid-section">
          <div className="blog-section-label">
            <span aria-hidden="true">📝</span>
            <span>أحدث المقالات</span>
          </div>

          <div className="blog-grid">
            {otherArticles.map((article) => (
              <Link
                key={article.slug}
                href={`/blog/${article.slug}`}
                className="blog-card"
              >
                <div
                  className="blog-card-cover"
                  style={{ background: article.coverGradient }}
                >
                  <span aria-hidden="true">{article.coverEmoji}</span>
                </div>

                <div className="blog-card-content">
                  <div className="blog-card-meta">
                    <span className="blog-card-cat">{article.categoryLabel}</span>
                    <span>•</span>
                    <span>{article.readingMinutes} د</span>
                  </div>

                  <h3 className="blog-card-title">{article.title}</h3>
                  <p className="blog-card-excerpt">{article.excerpt}</p>

                  <div className="blog-card-footer">
                    <div className="blog-card-author-small">
                      <div className="blog-author-avatar-small">
                        {article.author.charAt(article.author.indexOf(' ') + 1)}
                      </div>
                      <span>{article.author}</span>
                    </div>
                    <span className="blog-card-arrow" aria-hidden="true">←</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="blog-newsletter">
          <div className="blog-newsletter-content">
            <h3>📬 احصل على نصائح صحية أسبوعياً</h3>
            <p>اشترك في نشرة سباير ميديكال للحصول على أحدث المقالات الطبية</p>
            <div className="blog-newsletter-form">
              <input
                type="email"
                placeholder="بريدك الإلكتروني"
                className="blog-newsletter-input"
              />
              <button type="button" className="blog-newsletter-btn">
                اشترك
              </button>
            </div>
            <p className="blog-newsletter-note">
              لن نشاركك أي بريد مزعج. تستطيع إلغاء الاشتراك في أي وقت.
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="blog-final-cta">
          <h2>هل تحتاج استشارة طبية؟</h2>
          <p>تواصل مع أحد أطبائنا المتخصصين في أي وقت</p>
          <Link href="/login" className="blog-cta-btn">
            احجز استشارة الآن ←
          </Link>
        </section>
      </div>
    </main>
  );
}
