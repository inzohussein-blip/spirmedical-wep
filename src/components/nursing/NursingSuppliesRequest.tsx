'use client';

import { useState } from 'react';
import { Plus, Trash2, Package, ShoppingCart } from 'lucide-react';

/**
 * ═══════════════════════════════════════════════════════════════
 * NursingSuppliesRequest (V25.5)
 * ═══════════════════════════════════════════════════════════════
 *
 * "طلب مستلزمات طبية إضافية" - يُستخدمه الممرض/ة
 *
 * في حال عدم توفر المواد لدى المريض، يضيف ما يحتاجه:
 *   - كانيولا، شاش معقم، قطن، بلاستر، مواد تعقيم
 *   - يُضاف تلقائياً للفاتورة النهائية
 * ═══════════════════════════════════════════════════════════════
 */

export interface SupplyItem {
  item: string;
  qty: number;
  added_to_invoice: boolean;
  price?: number;
  notes?: string;
}

interface Props {
  value: SupplyItem[];
  onChange: (items: SupplyItem[]) => void;
}

const COMMON_SUPPLIES = [
  { name: 'كانيولا 18G', price: 5000 },
  { name: 'كانيولا 20G', price: 5000 },
  { name: 'كانيولا 22G', price: 5000 },
  { name: 'شاش معقم', price: 2000 },
  { name: 'قطن طبي', price: 1500 },
  { name: 'بلاستر', price: 1000 },
  { name: 'مواد تعقيم (بيتادين)', price: 3000 },
  { name: 'سرنجة 5مل', price: 500 },
  { name: 'سرنجة 10مل', price: 800 },
  { name: 'مغذي ساليناين 500مل', price: 4000 },
  { name: 'سيت تنقيط', price: 2500 },
];

export default function NursingSuppliesRequest({ value, onChange }: Props) {
  const [showCatalog, setShowCatalog] = useState(false);
  const [customItem, setCustomItem] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  const addItem = (item: string, price: number) => {
    onChange([
      ...value,
      {
        item,
        qty: 1,
        added_to_invoice: true,
        price,
      },
    ]);
    setShowCatalog(false);
  };

  const addCustomItem = () => {
    if (!customItem.trim()) return;
    addItem(customItem.trim(), Number(customPrice) || 0);
    setCustomItem('');
    setCustomPrice('');
  };

  const updateItem = (idx: number, updates: Partial<SupplyItem>) => {
    const newItems = [...value];
    newItems[idx] = { ...newItems[idx], ...updates };
    onChange(newItems);
  };

  const removeItem = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const total = value.reduce(
    (sum, item) => sum + (item.added_to_invoice ? (item.price ?? 0) * item.qty : 0),
    0
  );

  return (
    <div
      style={{
        background: 'var(--white)',
        border: '1px solid var(--line)',
        borderRadius: 14,
        padding: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'var(--amber-soft)',
            color: 'var(--amber)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Package size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>
            مستلزمات طبية إضافية
          </h4>
          <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: '2px 0 0' }}>
            في حال عدم توفرها لدى المريض
          </p>
        </div>
      </div>

      {/* Items list */}
      {value.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {value.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: 10,
                background: 'var(--paper-3)',
                borderRadius: 10,
                marginBottom: 6,
              }}
            >
              <div style={{ flex: 1, fontSize: 12, fontWeight: 700 }}>
                {item.item}
              </div>

              {/* Quantity */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  type="button"
                  onClick={() =>
                    updateItem(idx, { qty: Math.max(1, item.qty - 1) })
                  }
                  style={{
                    width: 24,
                    height: 24,
                    background: 'var(--white)',
                    border: '1px solid var(--line)',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontWeight: 800,
                  }}
                >
                  −
                </button>
                <span style={{ fontSize: 13, fontWeight: 800, minWidth: 24, textAlign: 'center' }}>
                  {item.qty}
                </span>
                <button
                  type="button"
                  onClick={() => updateItem(idx, { qty: item.qty + 1 })}
                  style={{
                    width: 24,
                    height: 24,
                    background: 'var(--white)',
                    border: '1px solid var(--line)',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontWeight: 800,
                  }}
                >
                  +
                </button>
              </div>

              {/* Price */}
              {item.price && (
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--emerald)',
                    minWidth: 70,
                    textAlign: 'end',
                  }}
                >
                  {(item.price * item.qty).toLocaleString('ar-IQ')} د.ع
                </div>
              )}

              {/* Remove */}
              <button
                type="button"
                onClick={() => removeItem(idx)}
                style={{
                  width: 28,
                  height: 28,
                  background: 'var(--rose-soft)',
                  color: 'var(--rose)',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="حذف"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {/* Total */}
          <div
            style={{
              marginTop: 10,
              padding: 12,
              background: 'var(--emerald-soft)',
              borderRadius: 10,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShoppingCart size={14} color="var(--emerald)" />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--emerald-deep)' }}>
                مجموع المستلزمات
              </span>
            </div>
            <span
              style={{
                fontSize: 14,
                fontWeight: 900,
                color: 'var(--emerald-deep)',
              }}
            >
              {total.toLocaleString('ar-IQ')} د.ع
            </span>
          </div>

          <p
            style={{
              fontSize: 10,
              color: 'var(--ink-3)',
              marginTop: 6,
              textAlign: 'center',
            }}
          >
            🧾 سيُضاف هذا المبلغ تلقائياً للفاتورة النهائية
          </p>
        </div>
      )}

      {/* Add button */}
      {!showCatalog ? (
        <button
          type="button"
          onClick={() => setShowCatalog(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            width: '100%',
            padding: 12,
            background: 'var(--amber-soft)',
            color: 'var(--amber)',
            border: '1px dashed var(--amber)',
            borderRadius: 10,
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          <Plus size={14} />
          <span>إضافة مستلزم</span>
        </button>
      ) : (
        <div>
          {/* Common supplies grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 6,
              marginBottom: 10,
            }}
          >
            {COMMON_SUPPLIES.map((s) => (
              <button
                key={s.name}
                type="button"
                onClick={() => addItem(s.name, s.price)}
                style={{
                  padding: '10px 8px',
                  background: 'var(--paper-3)',
                  border: '1px solid var(--line)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 11,
                  fontWeight: 700,
                  textAlign: 'start',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <span>{s.name}</span>
                <span style={{ fontSize: 9, color: 'var(--emerald)' }}>
                  {s.price.toLocaleString('ar-IQ')} د.ع
                </span>
              </button>
            ))}
          </div>

          {/* Custom item */}
          <div
            style={{
              display: 'flex',
              gap: 6,
              padding: 10,
              background: 'var(--paper-3)',
              borderRadius: 10,
            }}
          >
            <input
              type="text"
              value={customItem}
              onChange={(e) => setCustomItem(e.target.value)}
              placeholder="مستلزم آخر..."
              style={{
                flex: 1,
                padding: '8px 10px',
                border: '1px solid var(--line)',
                borderRadius: 8,
                fontSize: 12,
                fontFamily: 'inherit',
              }}
            />
            <input
              type="number"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              placeholder="السعر"
              style={{
                width: 80,
                padding: '8px 10px',
                border: '1px solid var(--line)',
                borderRadius: 8,
                fontSize: 12,
                fontFamily: 'inherit',
              }}
            />
            <button
              type="button"
              onClick={addCustomItem}
              style={{
                padding: '8px 14px',
                background: 'var(--emerald)',
                color: 'var(--paper-3)',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              إضافة
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowCatalog(false)}
            style={{
              marginTop: 6,
              width: '100%',
              padding: 8,
              background: 'transparent',
              color: 'var(--ink-3)',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 11,
            }}
          >
            إغلاق القائمة
          </button>
        </div>
      )}
    </div>
  );
}
