'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageCircle, Send, Smartphone, Check, X, Shield, Loader2,
  AlertTriangle, ChevronLeft,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Props {
  initialEnabled: boolean;
  initialChannel: 'whatsapp' | 'telegram' | 'sms';
  waVerified: boolean;
  userPhone: string;
}

interface ChannelOption {
  id: 'whatsapp' | 'telegram' | 'sms';
  label: string;
  description: string;
  icon: LucideIcon;
  brandColor: string;
  recommended?: boolean;
  disabled?: boolean;
  disabledReason?: string;
}

export default function WhatsAppOtpSettings({
  initialEnabled,
  initialChannel,
  waVerified,
  userPhone,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [channel, setChannel] = useState(initialChannel);
  const [verifying, setVerifying] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifySuccess, setVerifySuccess] = useState(false);

  const channels: ChannelOption[] = [
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      description: 'فوري · مع زر نسخ تلقائي · مجاناً',
      icon: MessageCircle,
      brandColor: '#25D366',
      recommended: true,
      disabled: !waVerified,
      disabledReason: 'يجب التحقق من رقم WhatsApp أولاً',
    },
    {
      id: 'telegram',
      label: 'Telegram',
      description: 'فوري · للحسابات المربوطة',
      icon: Send,
      brandColor: '#0088CC',
    },
    {
      id: 'sms',
      label: 'SMS عادي',
      description: '5-30 ثانية · يعمل بلا إنترنت',
      icon: Smartphone,
      brandColor: '#6E7878',
    },
  ];

  async function handleToggle(newEnabled: boolean) {
    setEnabled(newEnabled);
    startTransition(async () => {
      try {
        const res = await fetch('/api/whatsapp/settings/toggle-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            enabled: newEnabled,
            preferredChannel: channel,
          }),
        });

        const data = await res.json();

        if (!data.success) {
          setEnabled(!newEnabled);
          if (data.requiresVerification) {
            setVerifying(true);
          }
          return;
        }

        router.refresh();
      } catch {
        setEnabled(!newEnabled);
      }
    });
  }

  async function handleChannelChange(newChannel: 'whatsapp' | 'telegram' | 'sms') {
    setChannel(newChannel);

    if (enabled) {
      startTransition(async () => {
        await fetch('/api/whatsapp/settings/toggle-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            enabled: true,
            preferredChannel: newChannel,
          }),
        });
      });
    }
  }

  async function handleStartVerification() {
    setVerifying(true);
    setVerifyError(null);
    setVerifySuccess(false);

    try {
      const res = await fetch('/api/whatsapp/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: userPhone,
          channel: 'whatsapp',
          purpose: 'verify_phone',
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setVerifyError(data.error || 'فشل إرسال الرمز');
      }
    } catch {
      setVerifyError('خطأ في الاتصال');
    }
  }

  async function handleVerifyCode() {
    if (verifyCode.length !== 6) {
      setVerifyError('الرمز يجب أن يكون 6 أرقام');
      return;
    }

    setVerifyError(null);

    try {
      const res = await fetch('/api/whatsapp/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: userPhone,
          code: verifyCode,
          purpose: 'verify_phone',
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setVerifyError(data.error || 'الرمز غير صحيح');
        return;
      }

      setVerifySuccess(true);
      setTimeout(() => {
        setVerifying(false);
        router.refresh();
      }, 1500);
    } catch {
      setVerifyError('خطأ في الاتصال');
    }
  }

  return (
    <div className="card-pro" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'var(--emerald-soft)',
            color: 'var(--emerald)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Shield size={20} strokeWidth={2} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>
            التحقق بخطوتين (OTP)
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ink-3)' }}>
            رمز تحقق إضافي عند تسجيل الدخول من جهاز جديد
          </p>
        </div>

        {/* Toggle switch */}
        <button
          type="button"
          onClick={() => handleToggle(!enabled)}
          disabled={isPending}
          aria-label={enabled ? 'تعطيل OTP' : 'تفعيل OTP'}
          style={{
            position: 'relative',
            width: 48,
            height: 28,
            borderRadius: 100,
            background: enabled ? 'var(--emerald)' : 'var(--ink-5)',
            border: 'none',
            cursor: isPending ? 'wait' : 'pointer',
            transition: 'background 0.2s',
            padding: 0,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 2,
              [enabled ? 'right' : 'left']: 2,
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: '#fff',
              transition: 'all 0.2s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
            }}
          />
        </button>
      </div>

      {/* قنوات OTP */}
      {enabled && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--ink-6)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', marginBottom: 10 }}>
            القناة المفضّلة
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {channels.map((ch) => {
              const ChIcon = ch.icon;
              const isSelected = channel === ch.id;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => !ch.disabled && handleChannelChange(ch.id)}
                  disabled={ch.disabled || isPending}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 12,
                    border: isSelected
                      ? '2px solid var(--emerald)'
                      : '1px solid var(--ink-6)',
                    borderRadius: 12,
                    background: ch.disabled ? 'var(--paper-2)' : '#fff',
                    cursor: ch.disabled ? 'not-allowed' : 'pointer',
                    opacity: ch.disabled ? 0.6 : 1,
                    textAlign: 'right',
                    width: '100%',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: ch.brandColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <ChIcon size={20} color="#fff" strokeWidth={2} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{ch.label}</span>
                      {ch.recommended && (
                        <span
                          style={{
                            fontSize: 9,
                            background: 'var(--emerald-soft)',
                            color: 'var(--emerald)',
                            padding: '2px 6px',
                            borderRadius: 100,
                            fontWeight: 700,
                          }}
                        >
                          موصى به
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                      {ch.disabled ? ch.disabledReason : ch.description}
                    </div>
                  </div>
                  {isSelected && !ch.disabled && (
                    <Check size={18} strokeWidth={2.4} style={{ color: 'var(--emerald)' }} />
                  )}
                  {ch.disabled && ch.id === 'whatsapp' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartVerification();
                      }}
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        background: 'var(--emerald)',
                        color: '#fff',
                        border: 0,
                        padding: '6px 10px',
                        borderRadius: 8,
                        cursor: 'pointer',
                      }}
                    >
                      تحقّق
                      <ChevronLeft size={12} strokeWidth={2.4} style={{ marginRight: 2 }} />
                    </button>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal التحقق من WhatsApp */}
      {verifying && (
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
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 24,
              maxWidth: 360,
              width: '100%',
              textAlign: 'center',
            }}
          >
            {verifySuccess ? (
              <>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'var(--emerald-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}
                >
                  <Check size={32} strokeWidth={2.5} style={{ color: 'var(--emerald)' }} />
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800 }}>
                  تم التحقق بنجاح!
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-3)' }}>
                  رقم WhatsApp مُفعّل الآن
                </p>
              </>
            ) : (
              <>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    background: '#25D366',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}
                >
                  <MessageCircle size={28} color="#fff" strokeWidth={2} />
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800 }}>
                  التحقق من رقم WhatsApp
                </h3>
                <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--ink-3)' }}>
                  أدخل الرمز المرسل إلى:
                  <br />
                  <strong style={{ direction: 'ltr', display: 'inline-block' }}>
                    {userPhone}
                  </strong>
                </p>

                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: 24,
                    fontWeight: 700,
                    textAlign: 'center',
                    letterSpacing: 8,
                    border: '2px solid var(--ink-6)',
                    borderRadius: 12,
                    marginBottom: 12,
                    outline: 'none',
                  }}
                  autoFocus
                />

                {verifyError && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'var(--rose-soft)',
                      color: 'var(--rose)',
                      padding: '8px 12px',
                      borderRadius: 8,
                      fontSize: 12,
                      marginBottom: 12,
                    }}
                  >
                    <AlertTriangle size={14} strokeWidth={2.2} />
                    {verifyError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={verifyCode.length !== 6}
                  style={{
                    width: '100%',
                    padding: 12,
                    background: 'var(--emerald)',
                    color: '#fff',
                    border: 0,
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: verifyCode.length === 6 ? 'pointer' : 'not-allowed',
                    opacity: verifyCode.length === 6 ? 1 : 0.5,
                    marginBottom: 8,
                  }}
                >
                  تحقّق
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setVerifying(false);
                    setVerifyCode('');
                    setVerifyError(null);
                  }}
                  style={{
                    background: 'transparent',
                    border: 0,
                    color: 'var(--ink-3)',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  إلغاء
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {isPending && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            color: 'var(--ink-3)',
            marginTop: 12,
          }}
        >
          <Loader2 size={12} strokeWidth={2.4} className="animate-spin" />
          جاري الحفظ...
        </div>
      )}
    </div>
  );
}
