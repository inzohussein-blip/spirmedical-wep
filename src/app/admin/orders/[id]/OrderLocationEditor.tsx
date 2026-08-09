'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, X } from 'lucide-react';
import { toast } from '@/components/ui/Toaster';
import AdminLocationPickerWrapper from '@/components/admin/AdminLocationPickerWrapper';
import { updateOrderLocation } from './actions';

/**
 * 📍 ضبط موقع الطلب من لوحة الإدارة
 *
 * صفحة الطلب كانت تُنبّه «المريض لم يلتقط موقعه» ثمّ تترك الأدمن بلا حيلة،
 * و`updateOrderLocation` (بتدقيق صلاحية وتحقّق من صحّة الإحداثيات) بلا أي
 * مستدعٍ. الموقع هنا ليس تفصيلاً: عليه يعتمد وصول المختصّ إلى المريض.
 */
export default function OrderLocationEditor({
  orderId,
  currentLat,
  currentLng,
}: {
  orderId: string;
  currentLat: number | null;
  currentLng: number | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [lat, setLat] = useState<number | null>(currentLat);
  const [lng, setLng] = useState<number | null>(currentLng);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    if (lat == null || lng == null) {
      toast.error('حدّد الموقع على الخريطة');
      return;
    }

    startTransition(async () => {
      try {
        const res = await updateOrderLocation(orderId, lat, lng);
        if (res.success) {
          toast.success('تم حفظ موقع الطلب');
          setOpen(false);
          router.refresh();
        } else {
          toast.error(res.message || 'تعذّر الحفظ');
        }
      } catch {
        // إجراءات الخادم ترمي عند انقطاع الشبكة ولا تُرجع { success:false }
        toast.error('تعذّر الاتصال. حاول مرة أخرى.');
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          marginTop: 12, padding: '8px 14px',
          border: '1px solid var(--line)', borderRadius: 9,
          background: 'var(--white)', color: 'var(--brand, #185FA5)',
          fontFamily: 'inherit', fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}
      >
        <MapPin size={14} aria-hidden />
        {currentLat != null ? 'تعديل موقع الطلب' : 'تحديد موقع الطلب يدوياً'}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="تحديد موقع الطلب"
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999,
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            padding: 16, overflowY: 'auto',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--white, #fff)', borderRadius: 16, maxWidth: 520,
              width: '100%', marginTop: 24, padding: 20, maxHeight: '90vh', overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>📍 موقع الطلب</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="إغلاق"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-3)' }}
              >
                <X size={20} aria-hidden />
              </button>
            </div>

            <AdminLocationPickerWrapper
              initialLat={currentLat}
              initialLng={currentLng}
              markerType="hospital"
              onChange={(la, ln) => { setLat(la); setLng(ln); }}
            />

            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  flex: 1, padding: 12, borderRadius: 10, border: '1px solid var(--line)',
                  background: 'var(--white)', color: 'var(--ink-2)',
                  fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={pending}
                style={{
                  flex: 1, padding: 12, borderRadius: 10, border: 0,
                  background: 'var(--brand, #185FA5)', color: '#fff',
                  fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
                  cursor: pending ? 'not-allowed' : 'pointer', opacity: pending ? 0.6 : 1,
                }}
              >
                {pending ? 'جاري الحفظ...' : 'حفظ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
