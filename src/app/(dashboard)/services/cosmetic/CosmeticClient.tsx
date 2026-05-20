'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import {
  ArrowRight, Search, Star, ShoppingBag, Sparkles, Info,
  Award, CheckCircle2,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  name_en: string | null;
  brand: string;
  category: string;
  price: number;
  discount_price: number | null;
  image_emoji: string;
  rating_avg: number;
  rating_count: number;
  is_in_stock: boolean;
  country_of_origin: string | null;
  is_recommended: boolean;
  description: string | null;
}

interface Props {
  products: Product[];
}

const CATEGORIES = [
  { id: 'all',          label: 'الكل',         emoji: '✨' },
  { id: 'skincare',     label: 'العناية بالبشرة', emoji: '🧴' },
  { id: 'haircare',     label: 'الشعر',         emoji: '💆' },
  { id: 'makeup',       label: 'مكياج',        emoji: '💄' },
  { id: 'fragrance',    label: 'عطور',         emoji: '🌸' },
  { id: 'supplements',  label: 'مكمّلات',       emoji: '💊' },
  { id: 'bodycare',     label: 'العناية بالجسم', emoji: '🛁' },
  { id: 'baby_care',    label: 'الأطفال',       emoji: '👶' },
  { id: 'mens_care',    label: 'الرجال',        emoji: '🧔' },
];

export default function CosmeticClient({ products }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.name_en?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, searchQuery, selectedCategory]);

  const recommended = useMemo(
    () => products.filter((p) => p.is_recommended).slice(0, 6),
    [products]
  );

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/dashboard" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} />
          </Link>
          <h1 className="scr-page-title">العناية والتجميل</h1>
          <div className="scr-page-spacer" />
        </div>

        <p className="scr-page-subtitle">
          {products.length} منتج · إرشاد فقط، الشراء من الصيدليات
        </p>

        {/* Info */}
        <div
          style={{
            background: 'var(--paper-3)',
            borderRadius: 10,
            padding: 10,
            marginBottom: 12,
            fontSize: 11,
            color: 'var(--ink-3)',
            display: 'flex',
            gap: 8,
          }}
        >
          <Info size={14} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>للإرشاد فقط:</strong> هذه قائمة منتجات شائعة.
            للشراء، تواصل مع الصيدليات أو اسأل صيدلانياً.
          </div>
        </div>

        {/* Search */}
        <div className="scr-search" style={{ marginBottom: 12 }}>
          <div className="scr-search-icon" aria-hidden="true">
            <Search size={16} strokeWidth={2.4} />
          </div>
          <input
            type="search"
            placeholder="ابحث عن منتج أو ماركة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Categories */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            marginBottom: 14,
            paddingBottom: 4,
          }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '8px 14px',
                background: selectedCategory === cat.id ? 'var(--emerald)' : 'var(--white)',
                color: selectedCategory === cat.id ? 'var(--paper-3)' : 'var(--ink-2)',
                border: '1px solid',
                borderColor: selectedCategory === cat.id ? 'var(--emerald)' : 'var(--line)',
                borderRadius: 100,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Recommended section */}
        {selectedCategory === 'all' && !searchQuery && recommended.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h3 style={{
              fontSize: 13,
              fontWeight: 800,
              margin: '0 0 8px',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              <Award size={14} color="var(--amber)" />
              <span>اختيار فريق Spir</span>
            </h3>
            <div
              style={{
                display: 'flex',
                gap: 10,
                overflowX: 'auto',
                paddingBottom: 6,
              }}
            >
              {recommended.map((p) => (
                <ProductCard key={p.id} product={p} compact />
              ))}
            </div>
          </div>
        )}

        {/* List */}
        {filtered.length === 0 ? (
          <div className="scr-empty" style={{ marginTop: 32 }}>
            <div className="scr-empty-icon" aria-hidden="true">
              <Sparkles size={42} strokeWidth={1.5} />
            </div>
            <h2 className="scr-empty-title">لا توجد نتائج</h2>
            <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8 }}>
              جرّب فئة أخرى أو غيّر البحث
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        <div style={{ height: 80 }} />
      </div>
    </main>
  );
}

function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const finalPrice = product.discount_price ?? product.price;
  const hasDiscount = product.discount_price && product.discount_price < product.price;

  return (
    <article
      style={{
        background: 'var(--white)',
        border: '1px solid var(--line)',
        borderRadius: 12,
        padding: 12,
        position: 'relative',
        flexShrink: 0,
        ...(compact ? { width: 160 } : {}),
      }}
    >
      {product.is_recommended && (
        <div style={{
          position: 'absolute',
          top: 8,
          insetInlineStart: 8,
          background: 'var(--amber)',
          color: 'var(--paper-3)',
          fontSize: 8,
          fontWeight: 900,
          padding: '2px 6px',
          borderRadius: 4,
        }}>
          ⭐ مُوصى
        </div>
      )}

      <div
        style={{
          fontSize: 42,
          textAlign: 'center',
          marginBottom: 6,
          padding: '8px 0',
        }}
      >
        {product.image_emoji}
      </div>

      <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 2 }}>
        {product.name}
      </div>

      <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 6 }}>
        {product.brand}
        {product.country_of_origin && ` · ${product.country_of_origin}`}
      </div>

      {product.rating_count > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          marginBottom: 6,
        }}>
          <Star size={10} fill="var(--amber)" color="var(--amber)" />
          <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--amber)' }}>
            {product.rating_avg.toFixed(1)}
          </span>
          <span style={{ fontSize: 9, color: 'var(--ink-3)' }}>
            ({product.rating_count})
          </span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        {hasDiscount && (
          <span style={{
            fontSize: 10,
            color: 'var(--ink-3)',
            textDecoration: 'line-through',
          }}>
            {product.price.toLocaleString('ar-IQ')}
          </span>
        )}
        <span style={{
          fontSize: 13,
          fontWeight: 900,
          color: hasDiscount ? 'var(--rose)' : 'var(--emerald)',
        }}>
          {finalPrice.toLocaleString('ar-IQ')}
        </span>
        <span style={{ fontSize: 9, color: 'var(--ink-3)' }}>د.ع</span>
      </div>

      {!product.is_in_stock && (
        <div style={{
          marginTop: 6,
          fontSize: 9,
          color: 'var(--rose)',
          fontWeight: 700,
        }}>
          ⚠️ غير متوفّر
        </div>
      )}
    </article>
  );
}
