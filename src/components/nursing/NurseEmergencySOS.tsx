'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, X, Phone } from 'lucide-react';
import { toast } from '@/components/ui/Toaster';

/**
 * ═══════════════════════════════════════════════════════════════
 * NurseEmergencySOS (V25.5)
 * ═══════════════════════════════════════════════════════════════
 *
 * زر الطوارئ الأمني للممرض داخل منزل المريض.
 *
 * تفعيله في حال:
 *   - تعرّض الممرض/ة لأي اعتداء
 *   - تهديد عشائري
 *   - مضايقة أمنية
 *
 * عند الضغط:
 *   1. يُرسل GPS فوراً
 *   2. يُحدّد موقع مباشر
 *   3. يُرسل تنبيه للـ Call Center
 *   4. ربط مع خط الطوارئ 911
 * ═══════════════════════════════════════════════════════════════
 */

interface Props {
  orderId?: string;
}

const REASONS = [
  { id: 'attack', label: 'اعتداء جسدي', emoji: '🚨' },
  { id: 'threat', label: 'تهديد', emoji: '⚠️' },
  { id: 'harassment', label: 'مضايقة', emoji: '😨' },
  { id: 'medical', label: 'حالة طبية طارئة', emoji: '🏥' },
  { id: 'other', label: 'أخرى', emoji: '❓' },
];

export default function NurseEmergencySOS({ orderId }: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);

  // Long-press detection (تجنّب الضغط الخطأ)
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (holdProgress > 0 && holdProgress < 100) {
      timer = setInterval(() => {
        setHoldProgress((p) => Math.min(100, p + 5));
      }, 50);
    }
    if (holdProgress >= 100) {
      setShowConfirm(true);
      setHoldProgress(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [holdProgress]);

  const triggerSOS = async () => {
    if (!selectedReason) {
      toast.error('اختر سبب التفعيل');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. التقاط GPS
      let coords: { lat: number; lng: number; acc: number } | null = null;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
          });
        });
        coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          acc: pos.coords.accuracy,
        };
      } catch {
        // لا GPS - نتابع رغم ذلك
      }

      // 2. إرسال للسيرفر
      const response = await fetch('/api/nurse/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          trigger_reason: selectedReason,
          description: description.trim() || null,
          latitude: coords?.lat,
          longitude: coords?.lng,
          accuracy_m: coords?.acc,
        }),
      });

      if (response.ok) {
        toast.success('تم إرسال طلب الطوارئ - سيتم التواصل معك فوراً');
        setShowConfirm(false);
        setSelectedReason(null);
        setDescription('');

        // افتح خط 911
        if (confirm('هل تريد الاتصال بـ 911 فوراً؟')) {
          window.location.href = 'tel:911';
        }
      } else {
        toast.error('فشل الإرسال - اتصل بـ 911 مباشرة');
      }
    } catch {
      toast.error('خطأ غير متوقع - اتصل بـ 911 مباشرة');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating SOS button */}
      <button
        type="button"
        onMouseDown={() => setHoldProgress(1)}
        onMouseUp={() => setHoldProgress(0)}
        onMouseLeave={() => setHoldProgress(0)}
        onTouchStart={() => setHoldProgress(1)}
        onTouchEnd={() => setHoldProgress(0)}
        style={{
          position: 'fixed',
          bottom: 90,
          insetInlineEnd: 16,
          width: 64,
          height: 64,
          background: holdProgress > 0
            ? `conic-gradient(var(--rose-deep) ${holdProgress * 3.6}deg, var(--rose) 0)`
            : 'var(--rose)',
          color: 'var(--paper-3)',
          border: 'none',
          borderRadius: '50%',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(196, 30, 58, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: holdProgress === 0 ? 'sos-pulse 2s ease-in-out infinite' : 'none',
        }}
        aria-label="زر الطوارئ - اضغط مطوّلاً"
      >
        <ShieldAlert size={28} strokeWidth={2.4} />
      </button>

      <style jsx>{`
        @keyframes sos-pulse {
          0%, 100% { box-shadow: 0 8px 24px rgba(196, 30, 58, 0.5); }
          50% { box-shadow: 0 8px 32px rgba(196, 30, 58, 0.8); }
        }
      `}</style>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--paper)',
              borderRadius: '24px 24px 0 0',
              padding: 20,
              width: '100%',
              maxWidth: 480,
              animation: 'sos-modal-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: 'var(--rose)',
                  color: 'var(--paper-3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertTriangle size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>
                  تفعيل الطوارئ الأمني
                </h2>
                <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: '2px 0 0' }}>
                  سيتم التواصل معك خلال ثوانٍ
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                style={{
                  width: 32,
                  height: 32,
                  background: 'var(--paper-3)',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="إغلاق"
              >
                <X size={16} />
              </button>
            </div>

            {/* Reasons */}
            <label style={{ fontSize: 12, fontWeight: 800, display: 'block', marginBottom: 8 }}>
              السبب
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 6,
                marginBottom: 12,
              }}
            >
              {REASONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedReason(r.id)}
                  style={{
                    padding: '10px 8px',
                    background: selectedReason === r.id ? 'var(--rose)' : 'var(--paper-3)',
                    color: selectedReason === r.id ? 'var(--paper-3)' : 'var(--ink-2)',
                    border: '1px solid',
                    borderColor: selectedReason === r.id ? 'var(--rose)' : 'var(--line)',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <span style={{ marginInlineEnd: 4 }}>{r.emoji}</span>
                  {r.label}
                </button>
              ))}
            </div>

            {/* Description */}
            <label style={{ fontSize: 12, fontWeight: 800, display: 'block', marginBottom: 6 }}>
              تفاصيل إضافية (اختياري)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اكتب ما تعرّضت له..."
              rows={2}
              style={{
                width: '100%',
                padding: 10,
                border: '1px solid var(--line)',
                borderRadius: 10,
                fontSize: 12,
                fontFamily: 'inherit',
                marginBottom: 12,
                resize: 'vertical',
              }}
            />

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              <a
                href="tel:911"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: 14,
                  background: 'var(--rose-deep)',
                  color: 'var(--paper-3)',
                  border: 'none',
                  borderRadius: 12,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  fontWeight: 800,
                  textDecoration: 'none',
                }}
              >
                <Phone size={16} />
                اتصال 911
              </a>
              <button
                type="button"
                onClick={triggerSOS}
                disabled={isSubmitting || !selectedReason}
                style={{
                  flex: 1,
                  padding: 14,
                  background: 'var(--rose)',
                  color: 'var(--paper-3)',
                  border: 'none',
                  borderRadius: 12,
                  cursor: !selectedReason ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  fontWeight: 800,
                  opacity: !selectedReason ? 0.5 : 1,
                }}
              >
                {isSubmitting ? 'جارٍ الإرسال...' : 'أرسل + اتصل بالمركز'}
              </button>
            </div>

            <style jsx>{`
              @keyframes sos-modal-up {
                from { transform: translateY(100%); }
                to { transform: translateY(0); }
              }
            `}</style>
          </div>
        </div>
      )}
    </>
  );
}
