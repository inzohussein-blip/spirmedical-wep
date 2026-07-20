'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  X, Plus, Trash2, CheckCircle2, AlertTriangle,
  Clock, Pill, FileText,
} from 'lucide-react';
import { createPharmacyReservation, type ReservationItem } from '@/app/(dashboard)/services/pharmacies/actions';
import { useFormErrors } from '@/lib/forms/useFormErrors';
import MissingFieldsSummary from '@/components/forms/MissingFieldsSummary';
import FieldError from '@/components/forms/FieldError';

const PHARMACY_FIELD_LABELS: Record<string, string> = {
  items: 'الأدوية المطلوبة',
};

interface Pharmacy {
  id: string;
  name: string;
  city: string;
  district: string;
}

interface Props {
  pharmacy: Pharmacy;
  onClose: () => void;
  initialItems?: ReservationItem[];
  prescriptionId?: string;
}

/**
 * ════════════════════════════════════════════════════════════════════
 * 💊 V25.46: PharmacyReservationModal
 * ════════════════════════════════════════════════════════════════════
 * 
 * يفتح للمريض من /services/pharmacies/[id]
 * يحجز الأدوية في الصيدلية - الصيدلية ترد بالتوفّر + السعر
 * ════════════════════════════════════════════════════════════════════
 */

export default function PharmacyReservationModal({ 
  pharmacy, onClose, initialItems, prescriptionId,
}: Props) {
  const router = useRouter();
  const [items, setItems] = useState<ReservationItem[]>(
    initialItems && initialItems.length > 0 ? initialItems : [{ name: '', quantity: 1 }]
  );
  const [customerNotes, setCustomerNotes] = useState('');
  const [expectedPickupDate, setExpectedPickupDate] = useState('');
  const [expectedPickupTime, setExpectedPickupTime] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fe = useFormErrors(['items']);

  function updateItem(i: number, field: keyof ReservationItem, value: string | number) {
    const next = [...items];
    next[i] = { ...next[i], [field]: value };
    setItems(next);
    if (field === 'name' && typeof value === 'string' && value.trim()) fe.clearError('items');
  }

  function addItem() {
    setItems([...items, { name: '', quantity: 1 }]);
  }

  function removeItem(i: number) {
    if (items.length === 1) return;
    setItems(items.filter((_, idx) => idx !== i));
  }

  function handleSubmit() {
    setError(null);

    // Validation — خطأ على مستوى الحقل + تمرير/تركيز
    const validItems = items.filter((it) => it.name.trim().length > 0);
    if (validItems.length === 0) {
      fe.setErrors({ items: 'أدخل اسم دواء واحد على الأقل' });
      fe.focusFirst({ items: 'x' });
      return;
    }
    fe.clearAll();

    let expectedPickupAt: string | undefined;
    if (expectedPickupDate && expectedPickupTime) {
      expectedPickupAt = `${expectedPickupDate}T${expectedPickupTime}:00`;
    }

    startTransition(async () => {
      const result = await createPharmacyReservation({
        pharmacy_id: pharmacy.id,
        items: validItems,
        customer_notes: customerNotes.trim() || undefined,
        expected_pickup_at: expectedPickupAt,
        prescription_id: prescriptionId,
      });

      if (result.ok) {
        router.push(`/account/pharmacy-reservations/${result.reservation_id}`);
      } else {
        setError(result.error || 'حدث خطأ');
      }
    });
  }

  const minDate = new Date().toISOString().split('T')[0];
  const maxDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--white)',
          borderRadius: 16,
          padding: 20,
          width: '100%',
          maxWidth: 480,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
              حجز دواء
            </h2>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
              من {pharmacy.name} · {pharmacy.district}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 0, cursor: 'pointer' }}>
            <X size={22} strokeWidth={2.2} />
          </button>
        </div>

        {/* معلومات */}
        <div style={{
          padding: '10px 14px',
          background: '#E1F5EE',
          color: '#04342C',
          borderRadius: 10,
          fontSize: 11,
          marginBottom: 16,
          lineHeight: 1.6,
        }}>
          📋 الصيدلية ستراجع طلبك وترد بالتوفّر + الأسعار خلال 30 دقيقة. ستصلك إشعار عند جاهزية الدواء للاستلام.
        </div>

        {/* الأدوية */}
        <div style={{ marginBottom: 16 }} ref={fe.registerRef('items')}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', display: 'block', marginBottom: 8 }}>
            الأدوية المطلوبة *
          </label>
          <div style={{ display: 'grid', gap: 8 }}>
            {items.map((item, i) => (
              <div 
                key={i} 
                style={{ 
                  padding: 10, 
                  background: 'var(--paper-2)', 
                  borderRadius: 10, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 6 
                }}
              >
                <div style={{ display: 'flex', gap: 6 }}>
                  <Pill size={16} strokeWidth={2.2} style={{ color: '#0F6E56', marginTop: 8 }} aria-hidden />
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateItem(i, 'name', e.target.value)}
                    placeholder="اسم الدواء (مثال: بنادول 500mg)"
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      border: '1px solid var(--line)',
                      borderRadius: 8,
                      fontSize: 13,
                      fontFamily: 'inherit',
                    }}
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value) || 1)}
                    min="1"
                    max="20"
                    style={{
                      width: 60,
                      padding: '8px 10px',
                      border: '1px solid var(--line)',
                      borderRadius: 8,
                      fontSize: 13,
                      fontFamily: 'inherit',
                      textAlign: 'center',
                    }}
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      style={{
                        background: '#FCEBEB',
                        color: '#A32D2D',
                        border: 0,
                        padding: '8px 10px',
                        borderRadius: 8,
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={14} strokeWidth={2.2} />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={item.notes || ''}
                  onChange={(e) => updateItem(i, 'notes', e.target.value)}
                  placeholder="ملاحظات (مثال: علبة كبيرة، البديل مقبول)"
                  style={{
                    padding: '6px 10px',
                    border: '1px solid var(--line)',
                    borderRadius: 8,
                    fontSize: 11,
                    fontFamily: 'inherit',
                    background: 'var(--white)',
                  }}
                />
              </div>
            ))}
          </div>
          
          <button
            type="button"
            onClick={addItem}
            style={{
              marginTop: 8,
              padding: '8px 14px',
              background: 'var(--white)',
              color: '#0F6E56',
              border: '1px dashed #0F6E56',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Plus size={14} strokeWidth={2.5} />
            إضافة دواء آخر
          </button>
          <FieldError message={fe.fieldErrors.items} />
        </div>

        {/* وقت الاستلام */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>
            <Clock size={12} strokeWidth={2.2} style={{ verticalAlign: -2, marginLeft: 4 }} aria-hidden />
            وقت الاستلام المتوقّع (اختياري)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input
              type="date"
              value={expectedPickupDate}
              onChange={(e) => setExpectedPickupDate(e.target.value)}
              min={minDate}
              max={maxDate}
              style={{
                padding: 10,
                border: '1px solid var(--line)',
                borderRadius: 8,
                fontSize: 13,
                fontFamily: 'inherit',
              }}
            />
            <input
              type="time"
              value={expectedPickupTime}
              onChange={(e) => setExpectedPickupTime(e.target.value)}
              style={{
                padding: 10,
                border: '1px solid var(--line)',
                borderRadius: 8,
                fontSize: 13,
                fontFamily: 'inherit',
              }}
            />
          </div>
        </div>

        {/* ملاحظات */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>
            ملاحظات إضافية (اختياري)
          </label>
          <textarea
            value={customerNotes}
            onChange={(e) => setCustomerNotes(e.target.value)}
            placeholder="أي معلومة تريد أن تعرفها الصيدلية..."
            rows={2}
            maxLength={300}
            style={{
              width: '100%',
              padding: 10,
              border: '1px solid var(--line)',
              borderRadius: 8,
              fontSize: 13,
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '10px 14px',
            background: '#FCEBEB',
            color: '#791F1F',
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <AlertTriangle size={14} strokeWidth={2.5} />
            {error}
          </div>
        )}

        <MissingFieldsSummary
          fields={fe.missingFields}
          labels={PHARMACY_FIELD_LABELS}
          errors={fe.fieldErrors}
          onJump={fe.jumpTo}
        />

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          style={{
            width: '100%',
            padding: 14,
            background: '#0F6E56',
            color: 'white',
            border: 0,
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          {isPending ? (
            'جارٍ الإرسال...'
          ) : (
            <>
              <CheckCircle2 size={18} strokeWidth={2.5} />
              إرسال الطلب ({items.filter((it) => it.name.trim()).length} دواء)
            </>
          )}
        </button>

        {/* Footer info */}
        <div style={{
          marginTop: 12,
          padding: 10,
          background: 'var(--paper-2)',
          borderRadius: 8,
          fontSize: 10,
          color: 'var(--ink-3)',
          lineHeight: 1.6,
        }}>
          • الحجز صالح لمدة 24 ساعة بعد التأكيد<br/>
          • الدفع كاش عند الاستلام في الصيدلية<br/>
          • يمكنك إلغاء الحجز قبل الاستلام
        </div>
      </div>
    </div>
  );
}
