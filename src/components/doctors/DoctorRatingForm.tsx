'use client';

import { useState, useTransition } from 'react';
import { Star, CheckCircle2, AlertTriangle } from 'lucide-react';
import { submitDoctorRating } from './actions';

interface Props {
  doctorId: string;
  appointmentId?: string;
  consultationId?: string;
  doctorName?: string;
  interactionType?: 'home_visit' | 'clinic_visit' | 'video' | 'chat' | 'subscription';
  existingRating?: {
    rating: number;
    expertise_rating?: number;
    communication_rating?: number;
    punctuality_rating?: number;
    empathy_rating?: number;
    comment?: string;
    would_recommend?: boolean;
  } | null;
}

/**
 * ════════════════════════════════════════════════════════════════════
 * ⭐ V25.45: DoctorRatingForm
 * ════════════════════════════════════════════════════════════════════
 */

export default function DoctorRatingForm({
  doctorId,
  appointmentId,
  consultationId,
  doctorName,
  interactionType,
  existingRating,
}: Props) {
  const [rating, setRating] = useState(existingRating?.rating || 0);
  const [expertiseRating, setExpertiseRating] = useState(existingRating?.expertise_rating || 0);
  const [communicationRating, setCommunicationRating] = useState(existingRating?.communication_rating || 0);
  const [punctualityRating, setPunctualityRating] = useState(existingRating?.punctuality_rating || 0);
  const [empathyRating, setEmpathyRating] = useState(existingRating?.empathy_rating || 0);
  const [comment, setComment] = useState(existingRating?.comment || '');
  const [wouldRecommend, setWouldRecommend] = useState(existingRating?.would_recommend ?? true);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  function handleSubmit() {
    if (rating === 0) {
      setFeedback({ ok: false, msg: 'يرجى اختيار التقييم العام' });
      return;
    }
    
    setFeedback(null);
    
    startTransition(async () => {
      const result = await submitDoctorRating({
        doctor_id: doctorId,
        appointment_id: appointmentId,
        consultation_id: consultationId,
        rating,
        expertise_rating: expertiseRating || undefined,
        communication_rating: communicationRating || undefined,
        punctuality_rating: punctualityRating || undefined,
        empathy_rating: empathyRating || undefined,
        comment: comment.trim() || undefined,
        would_recommend: wouldRecommend,
        interaction_type: interactionType,
      });
      
      if (result.ok) {
        setFeedback({ ok: true, msg: 'شكراً لتقييمك! يساعدنا في تحسين الخدمة.' });
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
        قيّم تجربتك مع الطبيب
      </h3>
      
      {doctorName && (
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 12 }}>
          الطبيب: {doctorName}
        </div>
      )}

      {/* التقييم العام */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>
          التقييم العام *
        </label>
        <StarRating value={rating} onChange={setRating} size={28} />
      </div>

      {/* التقييمات التفصيلية */}
      <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
        <DetailRating label="الخبرة والمهنية" value={expertiseRating} onChange={setExpertiseRating} />
        <DetailRating label="التواصل والشرح" value={communicationRating} onChange={setCommunicationRating} />
        <DetailRating label="الالتزام بالوقت" value={punctualityRating} onChange={setPunctualityRating} />
        <DetailRating label="التعاطف والاهتمام" value={empathyRating} onChange={setEmpathyRating} />
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
        <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 4, textAlign: 'left' }}>
          {comment.length} / 500
        </div>
      </div>

      {/* Would recommend */}
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
        أرشّح هذا الطبيب لغيري
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
