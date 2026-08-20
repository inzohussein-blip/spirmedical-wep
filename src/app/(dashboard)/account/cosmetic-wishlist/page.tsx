// ═══════════════════════════════════════════════════════════════
// 💖 قائمة أمنيات التجميل
// ═══════════════════════════════════════════════════════════════
// كان `toggleWishlist` يكتب في `cosmetic_wishlist` ثمّ يستدعي
// `revalidatePath('/account/cosmetic-wishlist')` — ولا صفحة بهذا المسار.
// أي أنّ المستخدم يحفظ منتجاتٍ لا يستطيع رؤيتها في أيّ مكان: القلب على
// صفحة المنتج وحدها تعرف بها، ولا قائمة تجمعها.
//
// (`service_favorites` لا تصلح لها: قيد CHECK فيها محصورٌ بثماني فئات
//  ليس منها التجميل، ولذلك لها جدولها الخاصّ.)
// ═══════════════════════════════════════════════════════════════

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/format/price';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'قائمة أمنياتي - Spir Medical' };

interface WishlistRow {
  id: string;
  created_at: string;
  cosmetic_products: {
    id: string;
    name: string;
    brand: string;
    price: number;
    discount_price: number | null;
    image_emoji: string | null;
    is_active: boolean;
  } | null;
}

export default async function CosmeticWishlistPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase
    .from('cosmetic_wishlist')
    .select('id, created_at, cosmetic_products(id, name, brand, price, discount_price, image_emoji, is_active)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // منتجٌ حُذف أو أُوقف يصل هنا `null` أو `is_active: false` — يُسقط بدل
  // أن يُعرض صفّاً فارغاً لا يقود إلى شيء
  const items = ((data ?? []) as unknown as WishlistRow[])
    .filter((r) => r.cosmetic_products && r.cosmetic_products.is_active);

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/account" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} />
          </Link>
          <h1 className="scr-page-title">قائمة أمنياتي</h1>
          <div className="scr-page-spacer" />
        </div>

        {items.length === 0 ? (
          <div className="scr-empty" style={{ marginTop: 32 }}>
            <div className="scr-empty-icon" aria-hidden="true">💖</div>
            <h2 className="scr-empty-title">قائمتك فارغة</h2>
            <p className="scr-empty-desc">
              اضغط على القلب في أيّ منتجٍ لحفظه هنا.
            </p>
            <Link href="/services/cosmetic" className="scr-empty-cta">
              تصفّح المنتجات
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {items.map((row) => {
              const p = row.cosmetic_products!;
              const finalPrice = p.discount_price ?? p.price;
              const hasDiscount = p.discount_price != null && p.discount_price < p.price;

              return (
                <Link
                  key={row.id}
                  href={`/services/cosmetic/${p.id}`}
                  style={{
                    background: 'var(--white)',
                    border: '1px solid var(--line)',
                    borderRadius: 12,
                    padding: 12,
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'block',
                  }}
                >
                  <div style={{ fontSize: 42, textAlign: 'center', marginBottom: 6, padding: '8px 0' }}>
                    {p.image_emoji ?? ''}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>{p.brand}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)', lineHeight: 1.4 }}>
                    {p.name}
                  </div>
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--emerald)' }}>
                      {formatPrice(finalPrice)}
                    </span>
                    {hasDiscount && (
                      <span style={{ fontSize: 11, color: 'var(--ink-4)', textDecoration: 'line-through' }}>
                        {formatPrice(p.price)}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div style={{ height: 80 }} />
      </div>
    </main>
  );
}
