'use client';

import { useState, useTransition } from 'react';
import { Star, CheckCircle2, AlertTriangle } from 'lucide-react';
import { submitServiceRating, type ServiceRatingInput } from './actions';

interface Props {
  serviceType: 'hospital' | 'dental' | 'optical';
  serviceId: string;
  appointmentId?: string;
  serviceName?: string;
  procedureLabel?: string;  // للـ dental/optical
  existingRating?: {
    rating: number;
    [key: string]: number | boolean | string | undefined | null;
  } | null;
}

/**
 * ════════════════════════════════════════════════════════════════════
 * ⭐ V25.47: Universal Service Rating Form
 * ════════════════════════════════════════════════════════════════════
 * يدعم hospital + dental + optical في component واحد
 * ════════════════════════════════════════════════════════════════════
 */

const RATING_DIMENSIONS: Record<string, Array<{ key: string; label: string }>> = {
  hospital: [
    { key: 'cleanliness_rating', label: 'النظافة' },
    { key: 'staff_rating', label: 'الكادر' },
    { key: 'facilities_rating', label: 'التجهيزات' },
    { key: 'wait_time_rating', label: 'الالتزام بالمواعيد' },
  ],
  dental: [
    { key: 'expertise_rating', label: 'المهنية والخبرة' },
    { key: 'hygiene_rating', label: 'النظافة والتعقيم' },
    { key: 'price_rating', label: 'السعر' },
    { key: 'comfort_rating', label: 'الراحة وعدم الألم' },
  ],
  optical: [
    { key: 'selection_rating', label: 'التشكيلة' },
    { key: 'price_rating', label: 'السعر' },
    { key: 'service_rating', label: 'الخدمة' },
    { key: 'quality_rating', label: 'الجودة' },
  ],
};

const SERVICE_META = {
  hospital: { label: 'المستشفى', emoji: '🏥' },
  dental: { label: 'عيادة الأسنان', emoji: '🦷' },
  optical: { label: 'متجر النظارات', emoji: '👓' },
};

export default function ServiceRatingForm({
  serviceType,
  serviceId,
  appointmentId,
  serviceName,
  procedureLabel,
  existingRating,
}: Props) {
  const [rating, setRating] = useState((existingRating?.rating as number) || 0);
  const [detailRatings, setDetailRatings] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    RATING_DIMENSIONS[serviceType].forEach((d) => {
      init[d.key] = (existingRating?.[d.key] as number) || 0;
    });
    return init;
  });
  const [comment, setComment] = useState((existingRating?.comment as string) || '');
  const [wouldRecommend, setWouldRecommend] = useState(
    (existingRating?.would_recommend as boolean) ?? true
  );
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const meta = SERVICE_META[serviceType];
  const dimensions = RATING_DIMENSIONS[serviceType];

  function handleSubmit() {
    if (rating === 0) {
      setFeedback({ ok: false, msg: 'يرجى اختيار التقييم العام' });
      return;
    }

    setFeedback(null);

    const input: ServiceRatingInput = {
      service_type: serviceType,
      service_id: serviceId,
      appointment_id: appointmentId,
      rating,
      comment: comment.trim() || undefined,
      would_recommend: wouldRecommend,
      detail_ratings: detailRatings,
    };

    startTransition(async () => {
      const result = await submitServiceRating(input);

      if (result.ok) {
        setFeedback({ ok: true, msg: 'شكراً لتقييمك!' });
      } else {
        setFeedback({ ok: false, msg: result.error || 'فشل الحفظ' });
      }
    });
  }

  return (
    <div style={{
      background: 'var(--white)',
      border: '1px solid var(--line)',
      borderRadius: 14,
      padding: 16,
      marginTop: 12,
    }}>
      <h3 style={{
        fontSize: 15,
        fontWeight: 700,
        margin: '0 0 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <Star size={18} strokeWidth={2.2} fill="#A57100" stroke="#A57100" aria-hidden />
        قيّم تجربتك مع {meta.label} {meta.emoji}
      </h3>

      {(serviceName || procedureLabel) && (
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 12 }}>
          {serviceName && <div>📍 {serviceName}</div>}
          {procedureLabel && <div>📋 {procedureLabel}</div>}
        </div>
      )}

      {/* التقييم العام */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>
          التقييم العام *
        </label>
        <StarRating value={rating} onChange={setRating} size={28} />
      </div>

      {/* تقييمات تفصيلية */}
      <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
        {dimensions.map((dim) => (
          <DetailRating
            key={dim.key}
            label={dim.label}
            value={detailRatings[dim.key] || 0}
            onChange={(v) => setDetailRatings({ ...detailRatings, [dim.key]: v })}
          />
        ))}
      </div>

      {/* تعليق */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-2)', display: 'block', marginBottom: 4 }}>
          تعليقك (اختياري)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="شارك تجربتك..."
          rows={3}
          maxLength={500}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid var(--line)',
            borderRadius: 8,
            fontSize: 13,
            fontFamily: 'inherit',
            resize: 'vertical',
          }}
        />
      </div>

      {/* Recommend */}
      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 12px',
        background: 'var(--paper-2)',
        borderRadius: 8,
        fontSize: 13,
        marginBottom: 12,
        cursor: 'pointer',
      }}>
        <input
          type="checkbox"
          checked={wouldRecommend}
          onChange={(e) => setWouldRecommend(e.target.checked)}
        />
        أرشّح هذا المكان لغيري
      </label>

      {/* Feedback */}
      {feedback && (
        <div style={{
          padding: '10px 14px',
          borderRadius: 10,
          fontSize: 12,
          fontWeight: 600,
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: feedback.ok ? '#E1F5EE' : '#FCEBEB',
          color: feedback.ok ? '#04342C' : '#791F1F',
        }}>
          {feedback.ok ? <CheckCircle2 size={14} strokeWidth={2.5} /> : <AlertTriangle size={14} strokeWidth={2.5} />}
          {feedback.msg}
        </div>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending || rating === 0}
        style={{
          width: '100%',
          padding: 12,
          background: rating === 0 ? 'var(--ink-3)' : '#0F6E56',
          color: 'white',
          border: 0,
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 700,
          cursor: rating === 0 ? 'not-allowed' : 'pointer',
          opacity: rating === 0 ? 0.5 : 1,
        }}
      >
        {isPending ? 'جارٍ الإرسال...' : existingRating ? 'تحديث التقييم' : 'إرسال التقييم'}
      </button>
    </div>
  );
}

function StarRating({ value, onChange, size = 24 }: { value: number; onChange: (v: number) => void; size?: number }) {
  const [hover, setHover] = useState(0);
  const displayValue = hover || value;

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          style={{
            background: 'transparent',
            border: 0,
            cursor: 'pointer',
            padding: 2,
          }}
        >
          <Star
            size={size}
            strokeWidth={2}
            fill={star <= displayValue ? '#FAC775' : 'transparent'}
            stroke={star <= displayValue ? '#A57100' : '#9CA3AF'}
          />
        </button>
      ))}
    </div>
  );
}

function DetailRating({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{label}</span>
      <StarRating value={value} onChange={onChange} size={16} />
    </div>
  );
}
