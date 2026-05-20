'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight, Send, Loader2, Star, MessageSquare,
  ThumbsUp, ThumbsDown, Lightbulb, Heart,
} from 'lucide-react';
import { toast } from '@/components/ui/Toaster';
import { submitFeedback } from '@/app/admin44/feedback/actions';

const TYPES = [
  { id: 'praise' as const,          label: 'مدح',          emoji: '😊', icon: ThumbsUp,    color: 'var(--emerald)' },
  { id: 'suggestion' as const,      label: 'اقتراح',       emoji: '💡', icon: Lightbulb,   color: 'var(--amber)' },
  { id: 'complaint' as const,       label: 'شكوى',         emoji: '😞', icon: ThumbsDown,  color: 'var(--rose)' },
  { id: 'feature_request' as const, label: 'طلب ميزة',    emoji: '✨', icon: Heart,       color: 'var(--emerald)' },
  { id: 'other' as const,           label: 'أخرى',         emoji: '💬', icon: MessageSquare, color: 'var(--ink-2)' },
];

const CATEGORIES = [
  { id: 'booking',       label: 'الحجوزات' },
  { id: 'consultation',  label: 'الاستشارات' },
  { id: 'app_ui',        label: 'الواجهة' },
  { id: 'doctors',       label: 'الأطباء' },
  { id: 'pharmacy',      label: 'الصيدليات' },
  { id: 'pricing',       label: 'الأسعار' },
  { id: 'support',       label: 'الدعم' },
  { id: 'performance',   label: 'الأداء' },
  { id: 'other',         label: 'أخرى' },
];

export default function FeedbackUserPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<typeof TYPES[number]['id']>('suggestion');
  const [category, setCategory] = useState('app_ui');
  const [rating, setRating] = useState<number>(0);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = () => {
    if (!message.trim()) {
      toast.error('الرسالة مطلوبة');
      return;
    }
    if (message.length < 10) {
      toast.error('الرسالة قصيرة جداً (10 أحرف على الأقل)');
      return;
    }

    startTransition(async () => {
      const r = await submitFeedback({
        type,
        category,
        rating: rating > 0 ? rating : null,
        subject: subject.trim() || null,
        message: message.trim(),
        contact_email: email.trim() || null,
        page_url: typeof window !== 'undefined' ? window.location.href : null,
      });

      if (r.success) {
        toast.success('شكراً! وصلتنا رسالتك ✓');
        setMessage('');
        setSubject('');
        setRating(0);
        setTimeout(() => router.push('/dashboard'), 1500);
      } else {
        toast.error(r.error || 'فشل الإرسال');
      }
    });
  };

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/dashboard" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} />
          </Link>
          <h1 className="scr-page-title">شاركنا رأيك</h1>
          <div className="scr-page-spacer" />
        </div>

        <p className="scr-page-subtitle">
          ملاحظاتك تُساعدنا في تطوير الخدمة. كل اقتراح مهم لنا 💚
        </p>

        {/* Type selector */}
        <h3 style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 8px' }}>
          نوع الملاحظة *
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
          {TYPES.map((t) => {
            const Icon = t.icon;
            const isActive = type === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                style={{
                  padding: 12,
                  background: isActive ? `${t.color}15` : 'var(--white)',
                  border: '2px solid',
                  borderColor: isActive ? t.color : 'var(--line)',
                  borderRadius: 12,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  textAlign: 'start',
                }}
              >
                <div style={{ fontSize: 22 }}>{t.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: isActive ? t.color : 'var(--ink)',
                  }}>
                    {t.label}
                  </div>
                </div>
                {isActive && <Icon size={14} color={t.color} />}
              </button>
            );
          })}
        </div>

        {/* Category */}
        <div style={{ marginBottom: 16 }}>
          <label style={fieldLabel}>الفئة *</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={inputStyle}
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Rating */}
        <div style={{ marginBottom: 16 }}>
          <label style={fieldLabel}>
            تقييمك العام للتطبيق (اختياري)
          </label>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(rating === n ? 0 : n)}
                aria-label={`${n} نجوم`}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                <Star
                  size={32}
                  fill={n <= rating ? 'var(--amber)' : 'none'}
                  color={n <= rating ? 'var(--amber)' : 'var(--ink-3)'}
                  strokeWidth={1.5}
                />
              </button>
            ))}
            {rating > 0 && (
              <span style={{
                marginInlineStart: 8,
                alignSelf: 'center',
                fontSize: 12,
                fontWeight: 800,
                color: 'var(--amber)',
              }}>
                {rating} من 5
              </span>
            )}
          </div>
        </div>

        {/* Subject */}
        <div style={{ marginBottom: 12 }}>
          <label style={fieldLabel}>العنوان (اختياري)</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="مثلاً: تصميم الصفحة الرئيسية"
            style={inputStyle}
            maxLength={100}
          />
        </div>

        {/* Message */}
        <div style={{ marginBottom: 12 }}>
          <label style={fieldLabel}>الرسالة * (10 أحرف على الأقل)</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="اكتب رأيك بحرّية..."
            rows={6}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', minHeight: 100 }}
            maxLength={1000}
          />
          <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 4, textAlign: 'end' }}>
            {message.length}/1000
          </div>
        </div>

        {/* Optional contact */}
        <div style={{ marginBottom: 16 }}>
          <label style={fieldLabel}>
            بريد إلكتروني للتواصل (اختياري)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            style={inputStyle}
          />
          <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 4 }}>
            إذا أردت ردّاً منّا
          </div>
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !message.trim()}
          style={{
            width: '100%',
            padding: 14,
            background: message.trim() ? 'var(--emerald)' : 'var(--paper-3)',
            color: message.trim() ? 'var(--paper-3)' : 'var(--ink-3)',
            border: 'none',
            borderRadius: 12,
            cursor: !message.trim() || isPending ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            fontSize: 14,
            fontWeight: 900,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              جاري الإرسال...
            </>
          ) : (
            <>
              <Send size={16} />
              إرسال الملاحظة
            </>
          )}
        </button>

        <p style={{
          fontSize: 11,
          color: 'var(--ink-3)',
          textAlign: 'center',
          marginTop: 12,
          lineHeight: 1.6,
        }}>
          🔒 ملاحظتك سرية ولن تُنشر علناً
        </p>

        <div style={{ height: 60 }} />
      </div>
    </main>
  );
}

const fieldLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--ink-2)',
  display: 'block',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--line)',
  borderRadius: 10,
  fontSize: 13,
  fontFamily: 'inherit',
  background: 'var(--white)',
};
