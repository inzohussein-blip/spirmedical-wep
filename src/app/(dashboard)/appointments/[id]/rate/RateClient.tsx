'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { submitRating } from './actions';
import type { LucideIcon } from 'lucide-react';
import {
  GraduationCap, Clock, Smile, Sparkles, Leaf, Stethoscope, Zap, Target,
  Timer, Wind, HelpCircle,
  ArrowRight, PartyPopper, AlertTriangle,
} from 'lucide-react';

const QUICK_TAGS: Array<{ id: string; label: string; icon: LucideIcon }> = [
  { id: 'professional', label: 'احترافي',     icon: GraduationCap },
  { id: 'punctual',     label: 'في الموعد',   icon: Clock },
  { id: 'friendly',     label: 'ودود',        icon: Smile },
  { id: 'clean',        label: 'نظيف',        icon: Sparkles },
  { id: 'patient',      label: 'صبور',        icon: Leaf },
  { id: 'experienced',  label: 'متمرّس',     icon: Stethoscope },
  { id: 'quick',        label: 'سريع',        icon: Zap },
  { id: 'thorough',     label: 'دقيق',        icon: Target },
];

const NEGATIVE_TAGS: Array<{ id: string; label: string; icon: LucideIcon }> = [
  { id: 'late',     label: 'تأخر',        icon: Timer },
  { id: 'rushed',   label: 'مستعجل',      icon: Wind },
  { id: 'unclear',  label: 'غير واضح',    icon: HelpCircle },
];

export default function RateClient() {
  const params = useParams();
  const router = useRouter();
  const orderId = (params.id as string) || 'preview';

  const [overallRating, setOverallRating] = useState(0);
  const [punctualityRating, setPunctualityRating] = useState(0);
  const [professionalismRating, setProfessionalismRating] = useState(0);
  const [cleanlinessRating, setCleanlinessRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = async () => {
    setError('');

    if (overallRating === 0) {
      setError('يرجى اختيار التقييم العام أولاً');
      return;
    }

    // وضع المعاينة: تخطي DB
    if (orderId === 'preview') {
      setIsSubmitting(true);
      setTimeout(() => {
        setSubmitted(true);
        setTimeout(() => router.push('/dashboard'), 2500);
      }, 600);
      return;
    }

    setIsSubmitting(true);
    const result = await submitRating({
      appointment_id: orderId,
      overall_rating: overallRating,
      punctuality_rating: punctualityRating || undefined,
      professionalism_rating: professionalismRating || undefined,
      cleanliness_rating: cleanlinessRating || undefined,
      review_text: reviewText.trim() || undefined,
      tags: selectedTags,
      is_anonymous: isAnonymous,
    });

    if (!result.ok) {
      setIsSubmitting(false);
      setError(result.error || 'تعذّر إرسال التقييم');
      return;
    }

    setSubmitted(true);
    setTimeout(() => router.push('/dashboard'), 2500);
  };

  if (submitted) {
    return (
      <main className="app-screen">
        <div className="scr-content">
          <div className="rate-success">
            <div className="rate-success-emoji" aria-hidden="true">
              <PartyPopper size={64} strokeWidth={2} />
            </div>
            <h1 className="rate-success-title">شكراً جزيلاً!</h1>
            <p className="rate-success-desc">
              تقييمك يساعدنا على تقديم خدمة أفضل.
              <br />
              نتمنى رؤيتك قريباً!
            </p>
            <Link href="/dashboard" className="rate-success-btn">
              العودة للرئيسية
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="app-screen">
      <div className="scr-content">

        <div className="scr-page-header">
          <Link href={`/appointments/${orderId}`} className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} aria-hidden />
          </Link>
          <h1 className="scr-page-title">تقييم الخدمة</h1>
          <div className="scr-page-spacer" />
        </div>

        <p className="scr-page-subtitle">
          تقييمك مهم لنا · يستغرق 30 ثانية
        </p>

        {/* التقييم العام */}
        <div className="rate-main-card">
          <div className="rate-main-avatar">د</div>
          <div className="rate-main-title">د. أحمد الكاظمي</div>
          <div className="rate-main-meta">طب باطنية</div>

          <div className="rate-question">كيف كانت تجربتك؟</div>

          <div className="rate-stars-big">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setOverallRating(star)}
                className={`rate-star-big ${overallRating >= star ? 'active' : ''}`}
                aria-label={`${star} نجوم`}
              >
                ★
              </button>
            ))}
          </div>

          {overallRating > 0 && (
            <div className="rate-feedback">
              {overallRating === 5 && 'ممتاز! نحن سعداء جداً'}
              {overallRating === 4 && 'جيد جداً'}
              {overallRating === 3 && 'جيد'}
              {overallRating === 2 && 'مقبول'}
              {overallRating === 1 && 'يحتاج تحسين'}
            </div>
          )}
        </div>

        {/* تقييمات تفصيلية */}
        {overallRating > 0 && (
          <>
            <div className="scr-section-head" style={{ marginTop: 16 }}>
              <div className="scr-section-title">تقييمات تفصيلية (اختياري)</div>
            </div>

            <div className="rate-detail-card">
              <div className="rate-detail-row">
                <span className="rate-detail-label">
                  <Clock size={13} strokeWidth={2.2} aria-hidden style={{ verticalAlign: '-2px', marginLeft: 4 }} />
                  الالتزام بالموعد
                </span>
                <div className="rate-stars-small">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setPunctualityRating(s)}
                      className={`rate-star-small ${punctualityRating >= s ? 'active' : ''}`}
                      aria-label={`${s}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="rate-detail-row">
                <span className="rate-detail-label">
                  <GraduationCap size={13} strokeWidth={2.2} aria-hidden style={{ verticalAlign: '-2px', marginLeft: 4 }} />
                  الاحترافية
                </span>
                <div className="rate-stars-small">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setProfessionalismRating(s)}
                      className={`rate-star-small ${professionalismRating >= s ? 'active' : ''}`}
                      aria-label={`${s}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="rate-detail-row">
                <span className="rate-detail-label">
                  <Sparkles size={13} strokeWidth={2.2} aria-hidden style={{ verticalAlign: '-2px', marginLeft: 4 }} />
                  النظافة
                </span>
                <div className="rate-stars-small">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setCleanlinessRating(s)}
                      className={`rate-star-small ${cleanlinessRating >= s ? 'active' : ''}`}
                      aria-label={`${s}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* الوسوم السريعة */}
            <div className="scr-section-head" style={{ marginTop: 20 }}>
              <div className="scr-section-title">ماذا أعجبك؟ (اختر ما يناسب)</div>
            </div>

            <div className="rate-tags">
              {(overallRating >= 4 ? QUICK_TAGS : [...QUICK_TAGS, ...NEGATIVE_TAGS]).map(tag => {
                const Icon = tag.icon;
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`rate-tag ${selectedTags.includes(tag.id) ? 'active' : ''}`}
                  >
                    <Icon size={13} strokeWidth={2.2} aria-hidden />
                    <span>{tag.label}</span>
                  </button>
                );
              })}
            </div>

            {/* تعليق نصي */}
            <div className="scr-section-head" style={{ marginTop: 20 }}>
              <div className="scr-section-title">تعليق (اختياري)</div>
            </div>

            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="اكتب تجربتك بالتفصيل... تجربتك تساعد الآخرين"
              rows={4}
              className="rate-textarea"
              maxLength={500}
            />
            <div className="rate-char-count">
              {reviewText.length}/500 حرف
            </div>

            {/* خصوصية */}
            <label className="rate-anonymous">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              <div>
                <strong>نشر التقييم باسم مجهول</strong>
                <span>لن يظهر اسمك بجانب التقييم</span>
              </div>
            </label>

            {/* رسالة خطأ */}
            {error && (
              <div style={{
                background: 'var(--rose-soft)',
                color: 'var(--rose)',
                padding: '10px 14px',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 12,
                display: 'flex',
                gap: 8,
                alignItems: 'center',
              }}>
                <AlertTriangle size={14} strokeWidth={2.4} />
                <span>{error}</span>
              </div>
            )}

            {/* زر الإرسال */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rate-submit-btn"
            >
              {isSubmitting ? (
                <>
                  <span className="checkout-spinner" aria-hidden="true"></span>
                  <span>جاري الإرسال...</span>
                </>
              ) : (
                <>
                  <span aria-hidden="true">✓</span>
                  <span>إرسال التقييم</span>
                </>
              )}
            </button>

            <div className="rate-skip">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="rate-skip-btn"
              >
                تخطّي التقييم
              </button>
            </div>
          </>
        )}

        <div style={{ height: 80 }} />
      </div>
    </main>
  );
}
