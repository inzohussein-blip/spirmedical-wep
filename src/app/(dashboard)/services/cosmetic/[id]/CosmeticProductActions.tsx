'use client';

import { useState, useTransition } from 'react';
import { Heart, Star, MessageSquare, X, Save, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toggleCosmeticWishlist, submitCosmeticReview } from './actions';

interface Props {
  productId: string;
  productName: string;
  isInWishlist: boolean;
  existingReview: {
    id: string;
    rating: number;
    title: string | null;
    comment: string | null;
    would_recommend: boolean;
  } | null;
}

export default function CosmeticProductActions({ 
  productId, 
  productName,
  isInWishlist: initialWishlist,
  existingReview,
}: Props) {
  const [isInWishlist, setIsInWishlist] = useState(initialWishlist);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  function handleWishlist() {
    startTransition(async () => {
      const result = await toggleCosmeticWishlist(productId);
      if (result.ok) {
        setIsInWishlist(result.added ?? false);
        setFeedback(result.added ? 'أُضيف للمفضّلة' : 'حُذف من المفضّلة');
        setTimeout(() => setFeedback(null), 2000);
      }
    });
  }

  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
      <button
        type="button"
        onClick={handleWishlist}
        disabled={isPending}
        style={{
          flex: 1,
          padding: 12,
          background: isInWishlist ? '#FCEBEB' : 'var(--white)',
          color: isInWishlist ? '#A32D2D' : 'var(--ink)',
          border: `1px solid ${isInWishlist ? '#F09595' : 'var(--line)'}`,
          borderRadius: 12,
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        <Heart 
          size={16} 
          strokeWidth={2.2}
          fill={isInWishlist ? '#A32D2D' : 'transparent'}
        />
        {isInWishlist ? 'مُفضّل' : 'أضف للمفضّلة'}
      </button>

      <button
        type="button"
        onClick={() => setShowReviewModal(true)}
        style={{
          flex: 1,
          padding: 12,
          background: '#0F6E56',
          color: 'white',
          border: 0,
          borderRadius: 12,
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        <Star size={16} strokeWidth={2.2} />
        {existingReview ? 'تعديل التقييم' : 'قيّم المنتج'}
      </button>

      {feedback && (
        <div style={{
          position: 'fixed',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 16px',
          background: '#0F6E56',
          color: 'white',
          borderRadius: 24,
          fontSize: 12,
          fontWeight: 700,
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          {feedback}
        </div>
      )}

      {showReviewModal && (
        <ReviewModal
          productId={productId}
          productName={productName}
          existingReview={existingReview}
          onClose={() => setShowReviewModal(false)}
        />
      )}
    </div>
  );
}

function ReviewModal({ 
  productId, productName, existingReview, onClose 
}: { 
  productId: string;
  productName: string;
  existingReview: Props['existingReview'];
  onClose: () => void;
}) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [title, setTitle] = useState(existingReview?.title || '');
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [wouldRecommend, setWouldRecommend] = useState(existingReview?.would_recommend ?? true);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    if (rating === 0) {
      setError('يرجى اختيار تقييم');
      return;
    }
    
    setError(null);
    startTransition(async () => {
      const result = await submitCosmeticReview({
        product_id: productId,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim() || undefined,
        would_recommend: wouldRecommend,
      });
      
      if (result.ok) {
        onClose();
      } else {
        setError(result.error || 'فشل الحفظ');
      }
    });
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--white)', borderRadius: 16, padding: 20,
          width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>قيّم المنتج</h2>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
              {productName}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 0, cursor: 'pointer' }}>
            <X size={20} strokeWidth={2.2} />
          </button>
        </div>

        {/* Rating */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', display: 'block', marginBottom: 8 }}>
            تقييمك *
          </label>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                style={{ background: 'transparent', border: 0, cursor: 'pointer', padding: 2 }}
              >
                <Star
                  size={32}
                  strokeWidth={2}
                  fill={star <= rating ? '#FAC775' : 'transparent'}
                  stroke={star <= rating ? '#A57100' : '#9CA3AF'}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-2)', display: 'block', marginBottom: 4 }}>
            عنوان المراجعة (اختياري)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: منتج رائع ✨"
            maxLength={100}
            style={{
              width: '100%',
              padding: 10,
              border: '1px solid var(--line)',
              borderRadius: 8,
              fontSize: 13,
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Comment */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-2)', display: 'block', marginBottom: 4 }}>
            تجربتك مع المنتج
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="شارك تجربتك..."
            rows={4}
            maxLength={500}
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
          <div style={{ fontSize: 10, color: 'var(--ink-3)', textAlign: 'left', marginTop: 2 }}>
            {comment.length} / 500
          </div>
        </div>

        {/* Recommend */}
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: 10,
          background: 'var(--paper-2)',
          borderRadius: 8,
          fontSize: 12,
          marginBottom: 12,
          cursor: 'pointer',
        }}>
          <input
            type="checkbox"
            checked={wouldRecommend}
            onChange={(e) => setWouldRecommend(e.target.checked)}
          />
          أرشّح هذا المنتج لغيري
        </label>

        {error && (
          <div style={{
            padding: 10,
            background: '#FCEBEB',
            color: '#791F1F',
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 600,
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <AlertTriangle size={12} strokeWidth={2.5} />
            {error}
          </div>
        )}

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
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Save size={14} strokeWidth={2.2} />
          {isPending ? 'جارٍ الإرسال...' : existingReview ? 'تحديث' : 'إرسال التقييم'}
        </button>
      </div>
    </div>
  );
}
