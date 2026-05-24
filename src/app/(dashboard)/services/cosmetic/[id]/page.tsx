// ═══════════════════════════════════════════════════════════════
// 💄 V25.49: Cosmetic Product Detail Page
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight, Star, Heart, CheckCircle2, AlertCircle, 
  Package, Award, ShoppingBag,
} from 'lucide-react';
import CosmeticProductActions from './CosmeticProductActions';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: product } = await supabase
    .from('cosmetic_products')
    .select('name, brand, description')
    .eq('id', params.id)
    .single();

  if (!product) return { title: 'منتج غير موجود' };

  return {
    title: `${product.name} - ${product.brand} | Spir Medical`,
    description: product.description || `منتج ${product.brand} على Spir Medical`,
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  skincare: 'العناية بالبشرة',
  haircare: 'العناية بالشعر',
  makeup: 'مكياج',
  fragrance: 'عطور',
  supplements: 'مكمّلات غذائية',
  bodycare: 'العناية بالجسم',
  baby_care: 'منتجات الأطفال',
  mens_care: 'منتجات الرجال',
};

export default async function CosmeticProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: product } = await supabase
    .from('cosmetic_products')
    .select('*')
    .eq('id', params.id)
    .eq('is_active', true)
    .single();

  if (!product) notFound();

  // جلب reviews
  
  const supabaseAny = supabase as unknown as {
    from: (t: string) => {
      
      select: (cols: string) => any;
    };
  };

  
  const reviewsRes = await supabaseAny
    .from('cosmetic_product_reviews')
    .select('id, rating, title, comment, would_recommend, created_at, user_id')
    .eq('product_id', params.id)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(10);

  const reviews = (reviewsRes.data as Array<{
    id: string;
    rating: number;
    title: string | null;
    comment: string | null;
    would_recommend: boolean;
    created_at: string;
    user_id: string;
  }>) ?? [];

  // هل في wishlist؟
  
  const wishlistRes = await supabaseAny
    .from('cosmetic_wishlist')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', params.id)
    .single();

  const isInWishlist = !!wishlistRes.data;

  // هل عرضه قبلاً؟
  
  const myReviewRes = await supabaseAny
    .from('cosmetic_product_reviews')
    .select('*')
    .eq('user_id', user.id)
    .eq('product_id', params.id)
    .single();

  const myReview = myReviewRes.data;

  const finalPrice = product.discount_price || product.price;
  const hasDiscount = !!product.discount_price && product.discount_price < product.price;

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/services/cosmetic" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} />
          </Link>
          <h1 className="scr-page-title" style={{ fontSize: 14 }}>💄 تفاصيل المنتج</h1>
          <div className="scr-page-spacer" />
        </div>

        {/* Hero - الصورة + الأساسيات */}
        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--line)',
          borderRadius: 16,
          padding: 20,
          marginBottom: 14,
          textAlign: 'center',
        }}>
          {/* صورة كبيرة (emoji للآن) */}
          <div style={{
            fontSize: 72,
            marginBottom: 16,
          }}>
            {product.image_emoji || '🧴'}
          </div>

          {/* Brand badge */}
          <div style={{
            display: 'inline-block',
            padding: '2px 10px',
            background: 'var(--paper-2)',
            color: 'var(--ink-2)',
            borderRadius: 12,
            fontSize: 11,
            fontWeight: 700,
            marginBottom: 6,
          }}>
            {product.brand}
          </div>

          <h2 style={{ fontSize: 18, fontWeight: 900, margin: '6px 0 4px' }}>
            {product.name}
          </h2>
          {product.name_en && (
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 8 }}>
              {product.name_en}
            </div>
          )}

          {/* Rating */}
          {product.rating_avg > 0 && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              background: '#FAEEDA',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 12,
            }}>
              <Star size={12} fill="#A57100" stroke="#A57100" aria-hidden />
              <span style={{ color: '#412402' }}>
                {product.rating_avg.toFixed(1)} ({product.rating_count} تقييم)
              </span>
            </div>
          )}

          {/* السعر */}
          <div style={{ marginTop: 10 }}>
            {hasDiscount && (
              <div style={{ 
                fontSize: 13, 
                color: 'var(--ink-3)', 
                textDecoration: 'line-through',
                marginBottom: 2,
              }}>
                {product.price.toLocaleString('ar-IQ')} د.ع
              </div>
            )}
            <div style={{
              fontSize: 24,
              fontWeight: 900,
              color: '#0F6E56',
            }}>
              {finalPrice.toLocaleString('ar-IQ')} د.ع
            </div>
            {hasDiscount && (
              <div style={{
                display: 'inline-block',
                padding: '2px 8px',
                background: '#FCEBEB',
                color: '#A32D2D',
                borderRadius: 8,
                fontSize: 10,
                fontWeight: 700,
                marginTop: 4,
              }}>
                خصم {Math.round((1 - finalPrice / product.price) * 100)}%
              </div>
            )}
          </div>

          {/* Badges */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: 6,
            marginTop: 12,
            flexWrap: 'wrap',
          }}>
            {product.is_recommended && (
              <span style={{
                padding: '2px 10px',
                background: '#E1F5EE',
                color: '#04342C',
                borderRadius: 10,
                fontSize: 10,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
              }}>
                <Award size={10} strokeWidth={2.5} />
                موصى به
              </span>
            )}
            {product.is_in_stock ? (
              <span style={{
                padding: '2px 10px',
                background: '#E1F5EE',
                color: '#04342C',
                borderRadius: 10,
                fontSize: 10,
                fontWeight: 700,
              }}>
                ✓ متوفّر
              </span>
            ) : (
              <span style={{
                padding: '2px 10px',
                background: '#FCEBEB',
                color: '#791F1F',
                borderRadius: 10,
                fontSize: 10,
                fontWeight: 700,
              }}>
                ✗ غير متوفّر
              </span>
            )}
            {product.category && (
              <span style={{
                padding: '2px 10px',
                background: 'var(--paper-2)',
                color: 'var(--ink-2)',
                borderRadius: 10,
                fontSize: 10,
                fontWeight: 700,
              }}>
                {CATEGORY_LABELS[product.category] || product.category}
              </span>
            )}
          </div>
        </div>

        {/* Actions - Wishlist + Review */}
        <CosmeticProductActions
          productId={product.id}
          productName={product.name}
          isInWishlist={isInWishlist}
          existingReview={myReview}
        />

        {/* Description */}
        {product.description && (
          <div style={{
            background: 'var(--white)',
            border: '1px solid var(--line)',
            borderRadius: 12,
            padding: 14,
            marginBottom: 12,
          }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-2)', marginBottom: 6 }}>
              الوصف
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink)', margin: 0, lineHeight: 1.7 }}>
              {product.description}
            </p>
          </div>
        )}

        {/* Ingredients */}
        {product.ingredients && (
          <div style={{
            background: 'var(--white)',
            border: '1px solid var(--line)',
            borderRadius: 12,
            padding: 14,
            marginBottom: 12,
          }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-2)', marginBottom: 6 }}>
              المكوّنات
            </div>
            <p style={{ fontSize: 12, color: 'var(--ink-2)', margin: 0, lineHeight: 1.7 }}>
              {product.ingredients}
            </p>
          </div>
        )}

        {/* Usage Instructions */}
        {product.usage_instructions && (
          <div style={{
            background: '#FAEEDA',
            border: '1px solid #F0D7A4',
            borderRadius: 12,
            padding: 14,
            marginBottom: 12,
          }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#412402', marginBottom: 6 }}>
              طريقة الاستخدام
            </div>
            <p style={{ fontSize: 12, color: '#412402', margin: 0, lineHeight: 1.7 }}>
              {product.usage_instructions}
            </p>
          </div>
        )}

        {/* Country of Origin */}
        {product.country_of_origin && (
          <div style={{
            background: 'var(--paper-2)',
            borderRadius: 10,
            padding: 10,
            marginBottom: 12,
            fontSize: 11,
            color: 'var(--ink-3)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <Package size={12} strokeWidth={2.2} aria-hidden />
            <span>بلد المنشأ: <strong style={{ color: 'var(--ink)' }}>{product.country_of_origin}</strong></span>
          </div>
        )}

        {/* Reviews */}
        <div className="scr-section-head" style={{ marginTop: 16 }}>
          <div className="scr-section-title">
            تقييمات المستخدمين ({reviews.length})
          </div>
        </div>

        {reviews.length === 0 ? (
          <div style={{
            padding: 20,
            background: 'var(--white)',
            border: '1px solid var(--line)',
            borderRadius: 12,
            textAlign: 'center',
            color: 'var(--ink-3)',
            fontSize: 12,
          }}>
            <Star size={24} strokeWidth={1.5} style={{ opacity: 0.5, marginBottom: 8 }} aria-hidden />
            <div>لا توجد تقييمات بعد. كن أوّل من يُقيّم هذا المنتج!</div>
          </div>
        ) : (
          <div className="scr-list-stack">
            {reviews.map((r) => {
              const date = new Date(r.created_at).toLocaleDateString('ar-IQ', {
                day: 'numeric', month: 'short', year: 'numeric',
              });
              return (
                <div 
                  key={r.id}
                  style={{
                    background: 'var(--white)',
                    border: '1px solid var(--line)',
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: 6,
                  }}>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[1,2,3,4,5].map((i) => (
                        <Star 
                          key={i} 
                          size={12} 
                          fill={i <= r.rating ? '#A57100' : 'transparent'}
                          stroke={i <= r.rating ? '#A57100' : '#9CA3AF'}
                        />
                      ))}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>
                      {date}
                    </div>
                  </div>
                  
                  {r.title && (
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                      {r.title}
                    </div>
                  )}
                  {r.comment && (
                    <p style={{ fontSize: 12, color: 'var(--ink-2)', margin: 0, lineHeight: 1.7 }}>
                      {r.comment}
                    </p>
                  )}
                  {r.would_recommend && (
                    <div style={{
                      marginTop: 6,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      fontSize: 10,
                      color: '#0F6E56',
                      fontWeight: 600,
                    }}>
                      <CheckCircle2 size={10} strokeWidth={2.5} aria-hidden />
                      يرشّحه للآخرين
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="scr-info-banner" style={{ marginTop: 16 }}>
          <AlertCircle size={14} strokeWidth={2.2} aria-hidden />
          <span>Spir Medical لا تبيع منتجات تجميل. هذا الكتالوج إرشادي فقط.</span>
        </div>

        <div style={{ height: 60 }} />
      </div>
    </main>
  );
}
