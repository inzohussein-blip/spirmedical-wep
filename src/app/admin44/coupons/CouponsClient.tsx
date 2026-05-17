'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createCoupon, toggleCouponActive, deleteCoupon } from './actions';

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  validUntil: string | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}

interface Props {
  coupons: Coupon[];
}

export default function CouponsClient({ coupons }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('10');
  const [validUntil, setValidUntil] = useState('');
  const [maxUses, setMaxUses] = useState('');

  function handleCreate() {
    setError('');
    startTransition(async () => {
      const result = await createCoupon(
        code, description, discountType, parseFloat(discountValue),
        validUntil || null,
        maxUses ? parseInt(maxUses, 10) : null
      );
      if (!result.ok) { setError(result.error || 'حدث خطأ'); return; }
      setCode(''); setDescription(''); setDiscountValue('10');
      setValidUntil(''); setMaxUses('');
      setShowForm(false);
      router.refresh();
    });
  }

  function handleToggle(couponId: string, newActive: boolean) {
    startTransition(async () => {
      await toggleCouponActive(couponId, newActive);
      router.refresh();
    });
  }

  function handleDelete(couponId: string, code: string) {
    if (!confirm(`حذف الكوبون "${code}" نهائياً؟`)) return;
    startTransition(async () => {
      await deleteCoupon(couponId);
      router.refresh();
    });
  }

  const inputStyle: React.CSSProperties = {
    padding: '10px 12px', border: '1px solid var(--line)',
    borderRadius: 8, fontSize: 13, fontFamily: 'inherit',
  };

  return (
    <>
      <div style={{ background: '#fff', borderRadius: 14, padding: 18, marginBottom: 16 }}>
        {!showForm ? (
          <button onClick={() => setShowForm(true)} style={{
            padding: '10px 20px', background: 'var(--emerald-deep)', color: '#fff',
            border: 0, borderRadius: 10, fontSize: 13, fontWeight: 800,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            + إنشاء كوبون
          </button>
        ) : (
          <>
            <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 14px' }}>كوبون جديد</h3>

            {error && (
              <div style={{ background: 'var(--rose-soft)', color: 'var(--rose)', padding: '10px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={lblStyle}>الكود *</label>
                <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="WELCOME10" style={{ ...inputStyle, width: '100%' }} />
              </div>
              <div>
                <label style={lblStyle}>الوصف</label>
                <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="ترحيب بالمستخدمين الجدد" style={{ ...inputStyle, width: '100%' }} />
              </div>
              <div>
                <label style={lblStyle}>نوع الخصم</label>
                <select value={discountType} onChange={(e) => setDiscountType(e.target.value as never)} style={{ ...inputStyle, width: '100%' }}>
                  <option value="percentage">نسبة %</option>
                  <option value="fixed">مبلغ ثابت</option>
                </select>
              </div>
              <div>
                <label style={lblStyle}>قيمة الخصم</label>
                <input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} style={{ ...inputStyle, width: '100%' }} />
              </div>
              <div>
                <label style={lblStyle}>صالح حتى (اختياري)</label>
                <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} style={{ ...inputStyle, width: '100%' }} />
              </div>
              <div>
                <label style={lblStyle}>أقصى عدد استخدامات (اختياري)</label>
                <input type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="بدون حد" style={{ ...inputStyle, width: '100%' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleCreate} disabled={isPending} style={{
                padding: '10px 20px', background: 'var(--emerald-deep)', color: '#fff',
                border: 0, borderRadius: 8, fontSize: 12, fontWeight: 800,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                💾 حفظ
              </button>
              <button onClick={() => { setShowForm(false); setError(''); }} style={{
                padding: '10px 20px', background: 'transparent', border: '1px solid var(--line)',
                borderRadius: 8, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                إلغاء
              </button>
            </div>
          </>
        )}
      </div>

      {/* List */}
      {coupons.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 14, padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎁</div>
          <p style={{ fontSize: 14, color: 'var(--ink-3)' }}>لا توجد كوبونات</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ background: 'var(--paper-3)' }}>
              <tr>
                <th style={th}>الكود</th>
                <th style={th}>الخصم</th>
                <th style={th}>الاستخدام</th>
                <th style={th}>الصلاحية</th>
                <th style={th}>الحالة</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => {
                const expired = c.validUntil && new Date(c.validUntil) < new Date();
                const exhausted = c.maxUses && c.usedCount >= c.maxUses;
                const usable = c.isActive && !expired && !exhausted;

                return (
                  <tr key={c.id} style={{ borderTop: '1px solid var(--line)' }}>
                    <td style={td}>
                      <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 800, color: 'var(--emerald-deep)' }}>{c.code}</div>
                      {c.description && <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{c.description}</div>}
                    </td>
                    <td style={td}>
                      <strong style={{ color: 'var(--emerald-deep)' }}>
                        {c.discountValue}{c.discountType === 'percentage' ? '%' : ' د.ع'}
                      </strong>
                    </td>
                    <td style={td}>
                      {c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ''}
                    </td>
                    <td style={td}>
                      {c.validUntil ? new Date(c.validUntil).toLocaleDateString('ar-IQ') : 'دائم'}
                    </td>
                    <td style={td}>
                      {expired ? (
                        <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 100, background: 'var(--rose-soft)', color: 'var(--rose)', fontWeight: 800 }}>منتهي</span>
                      ) : exhausted ? (
                        <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 100, background: 'var(--amber-soft, #F8E5C7)', color: 'var(--amber-deep, #6B3A08)', fontWeight: 800 }}>استُنفذ</span>
                      ) : usable ? (
                        <button onClick={() => handleToggle(c.id, false)} disabled={isPending} style={{
                          fontSize: 11, padding: '3px 10px', borderRadius: 100,
                          background: 'var(--emerald-soft)', color: 'var(--emerald-deep)',
                          fontWeight: 800, border: 0, cursor: 'pointer', fontFamily: 'inherit',
                        }}>✅ نشط</button>
                      ) : (
                        <button onClick={() => handleToggle(c.id, true)} disabled={isPending} style={{
                          fontSize: 11, padding: '3px 10px', borderRadius: 100,
                          background: 'var(--paper-3)', color: 'var(--ink-3)',
                          fontWeight: 800, border: 0, cursor: 'pointer', fontFamily: 'inherit',
                        }}>⏸ متوقف</button>
                      )}
                    </td>
                    <td style={td}>
                      <button onClick={() => handleDelete(c.id, c.code)} disabled={isPending} style={{
                        padding: '4px 10px', background: 'transparent',
                        color: 'var(--rose)', border: 0, fontSize: 14,
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}>🗑</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

const lblStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 4 };
const th: React.CSSProperties = { padding: '12px 14px', textAlign: 'right', fontSize: 11, fontWeight: 800, color: 'var(--ink-3)' };
const td: React.CSSProperties = { padding: '12px 14px', fontSize: 13, color: 'var(--ink)' };
