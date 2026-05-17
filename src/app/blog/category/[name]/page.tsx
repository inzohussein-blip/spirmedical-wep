import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  CATEGORIES,
  ARTICLES,
  getArticlesByCategory,
  getAllCategorySlugs,
  type ArticleCategory,
} from '@/lib/data/blog-articles';

interface Props {
  params: { name: string };
}

export async function generateStaticParams() {
  return getAllCategorySlugs().map((name) => ({ name }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = CATEGORIES[params.name as ArticleCategory];
  if (!category) return {};

  return {
    title: `${category.label} · المدونة الطبية`,
    description: category.description,
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ar-IQ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function CategoryPage({ params }: Props) {
  const categoryKey = params.name as ArticleCategory;
  const category = CATEGORIES[categoryKey];

  if (!category) {
    notFound();
  }

  const articles = getArticlesByCategory(categoryKey);

  return (
    <main className="blog-page">
      {/* Nav */}
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
            <Link href="/blog" className="landing-link">المدونة</Link>
            <Link href="/login" className="landing-cta-primary">ادخل التطبيق ←</Link>
          </div>
        </div>
      </nav>

      <div className="blog-container landing-wrap">
        {/* Breadcrumb */}
        <nav className="article-breadcrumb" aria-label="breadcrumb">
          <Link href="/">الرئيسية</Link>
          <span aria-hidden="true">›</span>
          <Link href="/blog">المدونة</Link>
          <span aria-hidden="true">›</span>
          <span>{category.label}</span>
        </nav>

        {/* Category Header */}
        <header className="blog-cat-hero">
          <div className="blog-cat-hero-icon" aria-hidden="true">{category.icon}</div>
          <h1 className="blog-cat-hero-title">{category.label}</h1>
          <p className="blog-cat-hero-desc">{category.description}</p>
          <div className="blog-cat-hero-count">
            {articles.length} {articles.length === 1 ? 'مقال' : 'مقالات'}
          </div>
        </header>

        {/* Categories Pills */}
        <section className="blog-categories">
          <Link href="/blog" className="blog-cat-pill">
            <span aria-hidden="true">📋</span>
            <span>الكل</span>
            <span className="blog-cat-count">{ARTICLES.length}</span>
          </Link>
          {Object.entries(CATEGORIES).map(([key, cat]) => {
            const count = ARTICLES.filter((a) => a.category === key).length;
            if (count === 0) return null;
            return (
              <Link
                key={key}
                href={`/blog/category/${key}`}
                className={`blog-cat-pill ${key === categoryKey ? 'active' : ''}`}
              >
                <span aria-hidden="true">{cat.icon}</span>
                <span>{cat.label}</span>
                <span className="blog-cat-count">{count}</span>
              </Link>
            );
          })}
        </section>

        {/* Articles */}
        <section className="blog-grid-section">
          {articles.length === 0 ? (
            <div className="blog-empty">
              <div className="blog-empty-icon" aria-hidden="true">📭</div>
              <h3>لا توجد مقالات في هذا التصنيف بعد</h3>
              <p>سنُضيف مقالات قريباً. تابعنا للحصول على آخر النصائح الصحية.</p>
              <Link href="/blog" className="blog-empty-cta">
                عرض جميع المقالات ←
              </Link>
            </div>
          ) : (
            <div className="blog-grid">
              {articles.map((article) => (
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
                        <span>{formatDate(article.publishedAt)}</span>
                      </div>
                      <span className="blog-card-arrow" aria-hidden="true">←</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
