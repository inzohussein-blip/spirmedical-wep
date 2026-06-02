// ⚡ V27 Performance: ISR caching (3600s)
export const revalidate = 3600;

import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getArticleBySlug,
  getRelatedArticles,
  getAllArticleSlugs,
  type ArticleSection,
} from '@/lib/data/blog-articles';

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  return getAllArticleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = getArticleBySlug(params.slug);
  if (!article) return {};

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://spir-medical.com';
  const url = `${baseUrl}/blog/${article.slug}`;

  return {
    title: `${article.title} · سباير ميديكال`,
    description: article.metaDescription,
    keywords: article.keywords,
    authors: [{ name: article.author }],
    openGraph: {
      title: article.title,
      description: article.metaDescription,
      type: 'article',
      url,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [article.author],
      tags: article.tags,
      images: [
        {
          url: `${baseUrl}/api/og?title=${encodeURIComponent(article.title)}`,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.metaDescription,
    },
    alternates: {
      canonical: url,
    },
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ar-IQ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function ArticleSectionRenderer({ section }: { section: ArticleSection }) {
  switch (section.type) {
    case 'paragraph':
      return (
        <div className="article-section">
          {section.heading && <h2 className="article-h2">{section.heading}</h2>}
          <p className="article-paragraph">{section.content as string}</p>
        </div>
      );

    case 'list':
      return (
        <div className="article-section">
          {section.heading && <h2 className="article-h2">{section.heading}</h2>}
          <ul className="article-list">
            {(section.content as string[]).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      );

    case 'numbered':
      return (
        <div className="article-section">
          {section.heading && <h2 className="article-h2">{section.heading}</h2>}
          <ol className="article-numbered">
            {(section.content as string[]).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        </div>
      );

    case 'highlight':
      return (
        <div className="article-highlight">
          <span aria-hidden="true">💡</span>
          <p>{section.content as string}</p>
        </div>
      );

    case 'warning':
      return (
        <div className="article-warning">
          <span aria-hidden="true">⚠️</span>
          <p>{section.content as string}</p>
        </div>
      );

    case 'tip':
      return (
        <div className="article-tip">
          <p>{section.content as string}</p>
        </div>
      );

    default:
      return null;
  }
}

export default function ArticlePage({ params }: Props) {
  const article = getArticleBySlug(params.slug);

  if (!article) {
    notFound();
  }

  const related = getRelatedArticles(params.slug);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://spir-medical.com';

  // Schema.org Article JSON-LD
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    headline: article.title,
    description: article.metaDescription,
    image: `${baseUrl}/api/og?title=${encodeURIComponent(article.title)}`,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: {
      '@type': 'Person',
      name: article.author,
      jobTitle: article.authorTitle,
    },
    publisher: {
      '@type': 'Organization',
      name: 'سباير ميديكال',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/icon-512.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/blog/${article.slug}`,
    },
    inLanguage: 'ar-IQ',
    keywords: article.keywords.join(', '),
  };

  return (
    <main className="blog-page">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

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

      <article className="article-container">
        {/* Breadcrumb */}
        <nav className="article-breadcrumb" aria-label="breadcrumb">
          <Link href="/">الرئيسية</Link>
          <span aria-hidden="true">›</span>
          <Link href="/blog">المدونة</Link>
          <span aria-hidden="true">›</span>
          <Link href={`/blog/category/${article.category}`}>
            {article.categoryLabel}
          </Link>
        </nav>

        {/* Header */}
        <header className="article-header">
          <span className="article-category-badge">
            {article.categoryLabel}
          </span>

          <h1 className="article-title">{article.title}</h1>

          <p className="article-lede">{article.excerpt}</p>

          <div className="article-meta">
            <div className="article-author-block">
              <div className="article-author-avatar">
                {article.author.charAt(article.author.indexOf(' ') + 1)}
              </div>
              <div>
                <div className="article-author-name">{article.author}</div>
                <div className="article-author-title">{article.authorTitle}</div>
              </div>
            </div>

            <div className="article-meta-info">
              <div className="article-meta-item">
                <span aria-hidden="true">📅</span>
                <span>{formatDate(article.publishedAt)}</span>
              </div>
              <div className="article-meta-item">
                <span aria-hidden="true">⏱</span>
                <span>{article.readingMinutes} دقائق قراءة</span>
              </div>
            </div>
          </div>
        </header>

        {/* Cover */}
        <div
          className="article-cover"
          style={{ background: article.coverGradient }}
        >
          <span aria-hidden="true">{article.coverEmoji}</span>
        </div>

        {/* Body */}
        <div className="article-body">
          {article.sections.map((section, i) => (
            <ArticleSectionRenderer key={i} section={section} />
          ))}
        </div>

        {/* Tags */}
        <div className="article-tags-section">
          <div className="article-tags-label">الوسوم:</div>
          <div className="article-tags">
            {article.tags.map((tag) => (
              <span key={tag} className="article-tag">
                # {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Author Bio */}
        <div className="article-author-bio">
          <div className="article-author-bio-avatar">
            {article.author.charAt(article.author.indexOf(' ') + 1)}
          </div>
          <div className="article-author-bio-content">
            <div className="article-author-bio-name">عن المؤلف: {article.author}</div>
            <div className="article-author-bio-title">{article.authorTitle}</div>
            <p className="article-author-bio-desc">
              طبيب عراقي متخصص ومُعتمد في منصة سباير ميديكال. لحجز استشارة، حمّل
              التطبيق الآن.
            </p>
            <Link href="/login" className="article-author-bio-cta">
              احجز استشارة معه ←
            </Link>
          </div>
        </div>

        {/* CTA */}
        <div className="article-cta">
          <div className="article-cta-icon" aria-hidden="true">💊</div>
          <h3>هل تحتاج فحصاً أو استشارة؟</h3>
          <p>عبر سباير ميديكال، يمكنك حجز فحص دم منزلي أو استشارة طبية في دقائق</p>
          <Link href="/login" className="article-cta-btn">
            احجز الآن ←
          </Link>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="article-related">
            <h3 className="article-related-title">مقالات ذات صلة</h3>
            <div className="article-related-grid">
              {related.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/blog/${rel.slug}`}
                  className="article-related-card"
                >
                  <div
                    className="article-related-cover"
                    style={{ background: rel.coverGradient }}
                  >
                    <span aria-hidden="true">{rel.coverEmoji}</span>
                  </div>
                  <div className="article-related-info">
                    <span className="article-related-cat">{rel.categoryLabel}</span>
                    <h4>{rel.title}</h4>
                    <span className="article-related-time">
                      {rel.readingMinutes} دقائق قراءة
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Disclaimer */}
        <div className="article-disclaimer">
          <strong>⚠️ تنبيه طبي:</strong> المحتوى الموجود في هذا المقال للأغراض
          التعليمية والإعلامية فقط، ولا يُغني عن استشارة طبيب مختص. لا تستخدم هذه
          المعلومات لتشخيص أو علاج أي حالة طبية دون استشارة طبيب.
        </div>
      </article>
    </main>
  );
}
