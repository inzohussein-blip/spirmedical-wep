'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';

interface Product {
  id: string;
  name: string;
  brand: string;
  category: 'skincare' | 'haircare' | 'makeup' | 'fragrance' | 'supplements';
  price: number;
  store: string;
  rating: number;
  in_stock: boolean;
  image: string;
}

const CATEGORIES = [
  { id: 'all', label: 'الكل', icon: '✨' },
  { id: 'skincare', label: 'العناية', icon: '🧴' },
  { id: 'haircare', label: 'الشعر', icon: '💆' },
  { id: 'makeup', label: 'مكياج', icon: '💄' },
  { id: 'fragrance', label: 'عطور', icon: '🌸' },
  { id: 'supplements', label: 'مكمّلات', icon: '💊' },
] as const;

const PRODUCTS: Product[] = [
  { id: 'prod1', name: 'كريم ترطيب للوجه', brand: 'Eucerin', category: 'skincare', price: 25000, store: 'صيدلية النور', rating: 4.7, in_stock: true, image: '🧴' },
  { id: 'prod2', name: 'سيروم فيتامين C', brand: 'CeraVe', category: 'skincare', price: 35000, store: 'صيدلية الحياة', rating: 4.9, in_stock: true, image: '💧' },
  { id: 'prod3', name: 'شامبو ضد القشرة', brand: 'Head & Shoulders', category: 'haircare', price: 12000, store: 'صيدلية الكرخ', rating: 4.5, in_stock: true, image: '🧴' },
  { id: 'prod4', name: 'كريم لتساقط الشعر', brand: 'Minoxidil', category: 'haircare', price: 45000, store: 'صيدلية ابن سينا', rating: 4.6, in_stock: false, image: '💊' },
  { id: 'prod5', name: 'كريم أساس', brand: 'Maybelline', category: 'makeup', price: 18000, store: 'صيدلية النور', rating: 4.3, in_stock: true, image: '💄' },
  { id: 'prod6', name: 'مكمّل فيتامين D', brand: 'Nature Made', category: 'supplements', price: 22000, store: 'صيدلية الحياة', rating: 4.8, in_stock: true, image: '💊' },
  { id: 'prod7', name: 'زيت الأرغان', brand: 'OGX', category: 'haircare', price: 28000, store: 'صيدلية الصدر', rating: 4.6, in_stock: true, image: '🌿' },
  { id: 'prod8', name: 'كريم العين المضاد للتجاعيد', brand: 'Olay', category: 'skincare', price: 32000, store: 'صيدلية النور', rating: 4.4, in_stock: true, image: '✨' },
];

export default function CosmeticPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filtered = useMemo(() => {
    return PRODUCTS.filter((p) => {
      const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/dashboard" className="scr-back-btn" aria-label="العودة"><span aria-hidden="true">→</span></Link>
          <h1 className="scr-page-title">الكوزمتك الطبي</h1>
          <div className="scr-page-spacer" />
        </div>

        <p className="scr-page-subtitle">{PRODUCTS.length} منتج · شراء وتوصيل</p>

        <div className="scr-search" style={{ marginBottom: 12 }}>
          <div className="scr-search-icon" aria-hidden="true">⌕</div>
          <input type="search" placeholder="ابحث عن منتج..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>

        <div className="scr-filter-pills">
          {CATEGORIES.map((cat) => (
            <button key={cat.id} type="button" onClick={() => setSelectedCategory(cat.id)} className={`scr-filter-pill ${selectedCategory === cat.id ? 'active' : ''}`}>
              <span style={{ marginInlineEnd: 4 }}>{cat.icon}</span>{cat.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="scr-empty" style={{ marginTop: 32 }}>
            <div className="scr-empty-icon" aria-hidden="true">🔍</div>
            <h2 className="scr-empty-title">لا توجد نتائج</h2>
          </div>
        ) : (
          <div className="scr-products-grid">
            {filtered.map((p) => (
              <article key={p.id} className="scr-product-card">
                <div className="scr-product-image" aria-hidden="true">{p.image}</div>
                <div className="scr-product-info">
                  <div className="scr-product-brand">{p.brand}</div>
                  <div className="scr-product-name">{p.name}</div>
                  <div className="scr-product-meta">
                    <span className="scr-tag">⭐ {p.rating}</span>
                    {!p.in_stock && <span className="scr-tag scr-tag-rose">نفد</span>}
                  </div>
                  <div className="scr-product-store">📍 {p.store}</div>
                  <div className="scr-product-bottom">
                    <span className="scr-product-price">{p.price.toLocaleString('ar-IQ')} د.ع</span>
                    <button type="button" className="scr-product-cart" aria-label={`إضافة ${p.name}`} disabled={!p.in_stock}>+</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="scr-info-banner" style={{ marginTop: 16 }}>
          <span aria-hidden="true">ℹ️</span>
          <span>التوصيل خلال ٢٤ ساعة داخل بغداد · ٤٨ ساعة للمحافظات</span>
        </div>

        <div style={{ height: 80 }} />
      </div>
    </main>
  );
}
