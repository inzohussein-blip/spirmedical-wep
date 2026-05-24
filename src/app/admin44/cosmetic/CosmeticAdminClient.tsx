'use client';

import { useState, useMemo, useTransition } from 'react';
import {
  IconSearch, IconCheck, IconX, IconStar, IconAward,
  IconCurrencyDollar, IconPackage,
} from '@tabler/icons-react';
import {
  toggleActiveProduct, toggleStockProduct, toggleRecommendedProduct,
} from './actions';

interface Product {
  id: string;
  name: string;
  name_en: string | null;
  brand: string;
  category: string;
  price: number;
  discount_price: number | null;
  image_emoji: string;
  is_active: boolean;
  is_in_stock: boolean;
  is_recommended: boolean;
  rating_avg: number;
  rating_count: number;
  country_of_origin: string | null;
}

interface Props {
  products: Product[];
}

const CATEGORY_LABELS: Record<string, string> = {
  skincare: 'العناية بالبشرة',
  haircare: 'الشعر',
  makeup: 'مكياج',
  fragrance: 'عطور',
  supplements: 'مكمّلات',
  bodycare: 'العناية بالجسم',
  baby_care: 'الأطفال',
  mens_care: 'الرجال',
};

export default function CosmeticAdminClient({ products: initial }: Props) {
  const [products, setProducts] = useState(initial);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = !search || 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.brand.toLowerCase().includes(search.toLowerCase());
      
      const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
      
      return matchSearch && matchCategory;
    });
  }, [products, search, categoryFilter]);

  function handleToggle(
    id: string, 
    field: 'is_active' | 'is_in_stock' | 'is_recommended',
    currentValue: boolean,
    msg: { on: string; off: string }
  ) {
    startTransition(async () => {
      const action = field === 'is_active' ? toggleActiveProduct
        : field === 'is_in_stock' ? toggleStockProduct
        : toggleRecommendedProduct;
      
      const result = await action(id, !currentValue);
      
      if (result.ok) {
        setProducts((prev) => prev.map((p) => 
          p.id === id ? { ...p, [field]: !currentValue } : p
        ));
        setFeedback(currentValue ? msg.off : msg.on);
        setTimeout(() => setFeedback(null), 2000);
      }
    });
  }

  const categories = Object.keys(CATEGORY_LABELS);

  return (
    <div>
      {feedback && (
        <div style={{
          padding: '10px 14px',
          background: '#E6F3EF',
          color: '#04342C',
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <IconCheck size={16} stroke={2.5} />
          {feedback}
        </div>
      )}

      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px',
        background: '#F1F3F4',
        borderRadius: 12,
        marginBottom: 12,
      }}>
        <IconSearch size={18} stroke={2} color="#5F6368" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث بالاسم أو البراند..."
          style={{
            flex: 1, background: 'transparent', border: 0, outline: 'none',
            fontSize: 13, fontFamily: 'inherit',
          }}
        />
      </div>

      {/* Category filters */}
      <div style={{ 
        display: 'flex', gap: 6, marginBottom: 16, 
        overflowX: 'auto', paddingBottom: 4,
      }}>
        <FilterChip 
          label="الكل" 
          active={categoryFilter === 'all'} 
          onClick={() => setCategoryFilter('all')} 
        />
        {categories.map((cat) => (
          <FilterChip
            key={cat}
            label={CATEGORY_LABELS[cat]}
            active={categoryFilter === cat}
            onClick={() => setCategoryFilter(cat)}
          />
        ))}
      </div>

      <div style={{ fontSize: 12, color: '#5F6368', marginBottom: 12 }}>
        {filtered.length} منتج من {products.length}
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 12,
      }}>
        {filtered.length === 0 ? (
          <div style={{
            padding: 40, textAlign: 'center', gridColumn: '1/-1',
            background: '#FFFFFF', border: '1px dashed #DADCE0',
            borderRadius: 14, color: '#5F6368', fontSize: 14,
          }}>
            لا توجد نتائج
          </div>
        ) : filtered.map((p) => {
          const finalPrice = p.discount_price || p.price;
          const hasDiscount = !!p.discount_price && p.discount_price < p.price;
          
          return (
            <div
              key={p.id}
              style={{
                background: '#FFFFFF',
                border: '1px solid #DADCE0',
                borderRadius: 14,
                padding: 14,
                opacity: p.is_active ? 1 : 0.65,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {/* Top: Icon + name + badges */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{
                  fontSize: 36, flexShrink: 0,
                }}>
                  {p.image_emoji || '🧴'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: '#5F6368', fontWeight: 700 }}>
                    {p.brand}
                  </div>
                  <h3 style={{ fontSize: 13, fontWeight: 700, margin: '2px 0', color: '#202124' }}>
                    {p.name}
                  </h3>
                  <div style={{ 
                    fontSize: 10, color: '#80868B',
                    padding: '1px 6px', background: '#F1F3F4',
                    borderRadius: 6, display: 'inline-block',
                  }}>
                    {CATEGORY_LABELS[p.category] || p.category}
                  </div>
                </div>
              </div>

              {/* Price */}
              <div>
                {hasDiscount && (
                  <div style={{ fontSize: 11, color: '#5F6368', textDecoration: 'line-through' }}>
                    {p.price.toLocaleString('ar-IQ')} د.ع
                  </div>
                )}
                <div style={{ fontSize: 16, fontWeight: 900, color: '#01875F' }}>
                  {finalPrice.toLocaleString('ar-IQ')} د.ع
                </div>
              </div>

              {/* Rating + status badges */}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {p.rating_count > 0 && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 2,
                    padding: '2px 6px', background: '#FEF7E0',
                    borderRadius: 6, fontSize: 10, fontWeight: 700, color: '#B06000',
                  }}>
                    <IconStar size={9} stroke={2.2} fill="currentColor" />
                    {p.rating_avg.toFixed(1)} ({p.rating_count})
                  </span>
                )}
                {p.is_recommended && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 2,
                    padding: '2px 6px', background: '#E6F3EF',
                    borderRadius: 6, fontSize: 10, fontWeight: 700, color: '#04342C',
                  }}>
                    <IconAward size={9} stroke={2.2} />
                    موصى به
                  </span>
                )}
                {!p.is_in_stock && (
                  <span style={{
                    padding: '2px 6px', background: '#FCE8E6', color: '#8B1240',
                    borderRadius: 6, fontSize: 10, fontWeight: 700,
                  }}>
                    غير متوفّر
                  </span>
                )}
                {!p.is_active && (
                  <span style={{
                    padding: '2px 6px', background: '#F1F3F4', color: '#5F6368',
                    borderRadius: 6, fontSize: 10, fontWeight: 700,
                  }}>
                    معطّل
                  </span>
                )}
              </div>

              {/* Actions */}
              <div style={{ 
                display: 'grid', gridTemplateColumns: '1fr 1fr', 
                gap: 6,
                marginTop: 'auto',
              }}>
                <button
                  type="button"
                  onClick={() => handleToggle(p.id, 'is_active', p.is_active, {
                    on: 'تم التفعيل', off: 'تم التعطيل',
                  })}
                  disabled={isPending}
                  style={{
                    padding: 6,
                    background: p.is_active ? '#FCE8E6' : '#E6F3EF',
                    color: p.is_active ? '#8B1240' : '#04342C',
                    border: 0, borderRadius: 8,
                    fontSize: 10, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  {p.is_active ? 'تعطيل' : 'تفعيل'}
                </button>

                <button
                  type="button"
                  onClick={() => handleToggle(p.id, 'is_in_stock', p.is_in_stock, {
                    on: 'متوفّر', off: 'غير متوفّر',
                  })}
                  disabled={isPending}
                  style={{
                    padding: 6,
                    background: p.is_in_stock ? '#FEF7E0' : '#E8F0FE',
                    color: p.is_in_stock ? '#B06000' : '#1A73E8',
                    border: 0, borderRadius: 8,
                    fontSize: 10, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  {p.is_in_stock ? 'تعليم نفاد' : 'متوفّر'}
                </button>

                <button
                  type="button"
                  onClick={() => handleToggle(p.id, 'is_recommended', p.is_recommended, {
                    on: 'تم التوصية', off: 'تمّ الإلغاء',
                  })}
                  disabled={isPending}
                  style={{
                    gridColumn: '1/-1',
                    padding: 6,
                    background: p.is_recommended ? '#F1F3F4' : '#FEF7E0',
                    color: p.is_recommended ? '#5F6368' : '#B06000',
                    border: 0, borderRadius: 8,
                    fontSize: 10, fontWeight: 700, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  }}
                >
                  <IconAward size={11} stroke={2.2} />
                  {p.is_recommended ? 'إلغاء التوصية' : 'موصى به'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FilterChip({ 
  label, active, onClick 
}: { 
  label: string; 
  active: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '6px 12px',
        background: active ? '#01875F' : '#F1F3F4',
        color: active ? '#FFFFFF' : '#3C4043',
        border: 0,
        borderRadius: 8,
        fontSize: 11,
        fontWeight: 700,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {label}
    </button>
  );
}
