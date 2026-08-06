'use client';

import { useState, useTransition } from 'react';
import { Star } from 'lucide-react';
import { submitPharmacyRating } from '../actions';

/**
 * ⭐ تقييم الصيدلية
 *
 * `submitPharmacyRating` كانت مبنيّة (جدول `pharmacy_ratings` + مشغّل يُحدّث
 * متوسّط الصيدلية) لكن **بلا أي واجهة**: صفحة الصيدلية تعرض `rating_avg`
 * و`rating_count` داخل شرطٍ `rating_count > 0` لا يتحقّق أبداً لأنّ لا أحد
 * يستطيع الإرسال.
 *
 * التقييم مربوطٌ بحجزٍ **مُستلَم** (`picked_up`) لسببين:
 *   • يمنع تقييم من لم يتعامل مع الصيدلية.
 *   • قيد التفرّد هو `UNIQUE (user_id, reservation_id)`، وفي Postgres تكون
 *     قيم NULL متمايزة — فتقييمٌ بلا حجز يسمح بصفوفٍ مكرّرة بلا حدّ ولا
 *     يطابقه `onConflict` في الإجراء.
 */

function StarRow({
  value,
  onChange,
  label,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <div className="pharmacy-rating-row">
      <span className="pharmacy-rating-label">{label}</span>
      <div className="pharmacy-rating-stars" role="group" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange(n)}
            aria-label={`${n} من 5`}
            aria-pressed={value === n}
            className="pharmacy-rating-star"
          >
            <Star
              size={22}
              strokeWidth={2}
              fill={n <= value ? '#F59E0B' : 'none'}
              color={n <= value ? '#F59E0B' : '#CBD5E1'}
              aria-hidden
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PharmacyRatingCard({
  pharmacyId,
  reservationId,
  existingRating,
}: {
  pharmacyId: string;
  reservationId: string;
  existingRating: number | null;
}) {
  const [rating, setRating] = useState(existingRating ?? 0);
  const [availability, setAvailability] = useState(0);
  const [price, setPrice] = useState(0);
  const [service, setService] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    setError('');
    if (rating < 1) {
      setError('اختر تقييماً من 1 إلى 5');
      return;
    }

    startTransition(async () => {
      try {
        const result = await submitPharmacyRating({
          pharmacy_id: pharmacyId,
          reservation_id: reservationId,
          rating,
          availability_rating: availability || undefined,
          price_rating: price || undefined,
          service_rating: service || undefined,
          comment: comment.trim() || undefined,
        });

        if (result.ok) setDone(true);
        else setError(result.error ?? 'تعذّر حفظ التقييم');
      } catch {
        // إجراءات الخادم ترمي عند انقطاع الشبكة ولا تُرجع { ok:false }
        setError('تعذّر الاتصال. تحقّق من الإنترنت وحاول مرة أخرى.');
      }
    });
  }

  if (done) {
    return (
      <div className="pharmacy-rating-card pharmacy-rating-done">
        شكراً! تم حفظ تقييمك.
      </div>
    );
  }

  return (
    <div className="pharmacy-rating-card">
      <div className="pharmacy-rating-title">
        {existingRating ? 'عدّل تقييمك للصيدلية' : 'قيّم تجربتك مع الصيدلية'}
      </div>

      {error && <div className="pharmacy-rating-error">{error}</div>}

      <StarRow label="التقييم العام" value={rating} onChange={setRating} disabled={pending} />
      <StarRow label="توفّر الأدوية" value={availability} onChange={setAvailability} disabled={pending} />
      <StarRow label="السعر" value={price} onChange={setPrice} disabled={pending} />
      <StarRow label="الخدمة" value={service} onChange={setService} disabled={pending} />

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="ملاحظاتك (اختياري)"
        maxLength={500}
        rows={3}
        className="pharmacy-rating-comment"
        disabled={pending}
      />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={pending}
        className="pharmacy-rating-submit"
      >
        {pending ? 'جاري الحفظ...' : 'إرسال التقييم'}
      </button>
    </div>
  );
}
