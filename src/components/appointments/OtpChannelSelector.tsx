'use client';

import { useState } from 'react';
import { OtpChannel, OTP_CHANNELS, savePreferredChannel } from '@/lib/services/otp-channels';
import { sendOtpAction, verifyOtpAction } from '@/app/(dashboard)/appointments/new/actions';
import {
  Shield, MessageCircle, Send, Zap, Lightbulb,
} from 'lucide-react';

interface Props {
  phone: string;
  purpose: 'register' | 'login' | 'appointment' | 'password-reset';
  onVerified: () => void;
  onCancel?: () => void;
}

export default function OtpChannelSelector({ phone, onVerified, onCancel }: Props) {
  const [step, setStep] = useState<'choose' | 'verify'>('choose');
  const [selectedChannel, setSelectedChannel] = useState<OtpChannel>('whatsapp');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // إخفاء جزء من الرقم: +964 7XX XXX 678 → +964 ●●● 678
  const maskedPhone = phone.length >= 8
    ? `${phone.slice(0, 4)} ●●● ${phone.slice(-3)}`
    : phone;

  async function handleSendOtp(channel: OtpChannel) {
    setLoading(true);
    setError(null);
    setSelectedChannel(channel);
    savePreferredChannel(channel);

    try {
      const response = await sendOtpAction(phone, channel);
      if (response.success) {
        setStep('verify');
        setResendTimer(60);
        startResendTimer();
      } else {
        setError(response.error || 'فشل إرسال الرمز');
      }
    } catch (e) {
      setError('حدث خطأ. حاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  }

  function startResendTimer() {
    const interval = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  async function handleVerify() {
    if (code.length !== 6) {
      setError('أدخل ٦ أرقام');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const result = await verifyOtpAction(phone, code);
      if (result.success) {
        onVerified();
      } else {
        setError(result.error || 'الرمز غير صحيح');
      }
    } catch (e) {
      setError('حدث خطأ. حاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  }

  // === الخطوة ١: اختيار القناة ===
  if (step === 'choose') {
    return (
      <div className="otp-selector">
        <div className="otp-header">
          <div className="otp-icon">
            <Shield size={32} strokeWidth={2} />
          </div>
          <h2>تأكيد رقم الهاتف</h2>
          <p>اختر طريقة استلام رمز التحقق</p>
          <div className="otp-phone">{maskedPhone}</div>
        </div>

        <div className="otp-channels">
          {/* WhatsApp */}
          <button
            type="button"
            onClick={() => handleSendOtp('whatsapp')}
            disabled={loading}
            className="otp-channel-btn whatsapp"
          >
            <div className="otp-channel-icon" style={{ background: OTP_CHANNELS.whatsapp.color }}>
              <MessageCircle size={22} strokeWidth={2} color="#fff" />
            </div>
            <div className="otp-channel-info">
              <div className="otp-channel-name">WhatsApp</div>
              <div className="otp-channel-desc">{OTP_CHANNELS.whatsapp.description}</div>
              <div className="otp-channel-time">
                <Zap size={11} strokeWidth={2.4} aria-hidden />
                <span>{OTP_CHANNELS.whatsapp.deliveryTime}</span>
              </div>
            </div>
            <div className="otp-channel-arrow">‹</div>
          </button>

          {/* Telegram — مخفيّ حتى تفعيل القناة فعلاً (بوت + user_telegram_links) */}
          {process.env.NEXT_PUBLIC_ENABLE_TELEGRAM_OTP === 'true' && (
          <button
            type="button"
            onClick={() => handleSendOtp('telegram')}
            disabled={loading}
            className="otp-channel-btn telegram"
          >
            <div className="otp-channel-icon" style={{ background: OTP_CHANNELS.telegram.color }}>
              <Send size={22} strokeWidth={2} color="#fff" />
            </div>
            <div className="otp-channel-info">
              <div className="otp-channel-name">Telegram</div>
              <div className="otp-channel-desc">{OTP_CHANNELS.telegram.description}</div>
              <div className="otp-channel-time">
                <Zap size={11} strokeWidth={2.4} aria-hidden />
                <span>{OTP_CHANNELS.telegram.deliveryTime}</span>
              </div>
            </div>
            <div className="otp-channel-arrow">‹</div>
          </button>
          )}
        </div>

        <div className="otp-info-box">
          <div className="otp-info-icon">
            <Lightbulb size={18} strokeWidth={2.2} />
          </div>
          <div className="otp-info-text">
            <strong>لماذا WhatsApp/Telegram؟</strong>
            <span>أسرع وأكثر موثوقية من SMS · ولا تكاليف إضافية عليك</span>
          </div>
        </div>

        {onCancel && (
          <button type="button" onClick={onCancel} className="otp-cancel-btn">
            تغيير الرقم
          </button>
        )}

        <style jsx>{`
          .otp-selector {
            display: flex;
            flex-direction: column;
            gap: 20px;
            padding: 8px;
          }
          .otp-header { text-align: center; }
          .otp-icon {
            width: 72px;
            height: 72px;
            background: var(--emerald-soft, #D9E5DF);
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 36px;
            margin-bottom: 12px;
          }
          .otp-header h2 {
            font-size: 20px;
            font-weight: 800;
            margin: 0 0 6px;
          }
          .otp-header p {
            font-size: 13px;
            color: var(--ink-3, #6E7878);
            margin: 0 0 10px;
          }
          .otp-phone {
            display: inline-block;
            background: var(--paper-2, #EDE6D3);
            padding: 6px 14px;
            border-radius: 8px;
            font-family: 'JetBrains Mono', monospace;
            font-weight: 700;
            font-size: 13px;
          }
          .otp-channels {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .otp-channel-btn {
            background: var(--white, #FFFFFF);
            border: 1px solid var(--line, rgba(15, 26, 28, 0.08));
            border-radius: 14px;
            padding: 14px;
            display: flex;
            align-items: center;
            gap: 12px;
            cursor: pointer;
            transition: all 0.2s;
            text-align: right;
          }
          .otp-channel-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px -6px rgba(0, 0, 0, 0.12);
          }
          .otp-channel-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          .otp-channel-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: white;
            flex-shrink: 0;
          }
          .otp-channel-info { flex: 1; }
          .otp-channel-name {
            font-size: 14px;
            font-weight: 800;
            margin-bottom: 2px;
          }
          .otp-channel-desc {
            font-size: 11px;
            color: var(--ink-3, #6E7878);
            margin-bottom: 4px;
          }
          .otp-channel-time {
            font-size: 10px;
            color: var(--emerald, #0E5C4D);
            font-weight: 700;
          }
          .otp-channel-arrow {
            font-size: 18px;
            color: var(--ink-4, #A4ACAA);
            font-weight: 700;
          }
          .otp-info-box {
            background: var(--amber-soft, #F0DBC2);
            border-radius: 12px;
            padding: 12px;
            display: flex;
            gap: 10px;
            align-items: flex-start;
          }
          .otp-info-icon { font-size: 20px; }
          .otp-info-text {
            font-size: 12px;
            color: var(--amber, #B8540C);
            line-height: 1.5;
          }
          .otp-info-text strong {
            display: block;
            font-weight: 800;
            margin-bottom: 2px;
          }
          .otp-info-text span { display: block; }
          .otp-cancel-btn {
            background: transparent;
            border: 0;
            color: var(--ink-3, #6E7878);
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            padding: 8px;
          }
          .otp-cancel-btn:hover { color: var(--ink, #0F1A1C); }
        `}</style>
      </div>
    );
  }

  // === الخطوة ٢: إدخال الرمز ===
  const channelInfo = OTP_CHANNELS[selectedChannel];

  return (
    <div className="otp-verify">
      <div className="otp-header">
        <div className="otp-icon" style={{ background: channelInfo.color, color: 'white' }}>
          {channelInfo.emoji}
        </div>
        <h2>تحقّق من {channelInfo.name}</h2>
        <p>أرسلنا رمز ٦ أرقام إلى</p>
        <div className="otp-phone">{maskedPhone}</div>
      </div>

      <div className="otp-input-group">
        <label>الرمز السري</label>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          pattern="\d{6}"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
            setError(null);
          }}
          placeholder="000000"
          autoFocus
          className="otp-input"
        />
        {error && <div className="otp-error">{error}</div>}
      </div>

      <button
        type="button"
        onClick={handleVerify}
        disabled={loading || code.length !== 6}
        className="otp-verify-btn"
      >
        {loading ? 'جارٍ التحقق...' : 'تحقّق وتابع ←'}
      </button>

      <div className="otp-resend">
        {resendTimer > 0 ? (
          <span>إعادة الإرسال خلال {resendTimer} ثانية</span>
        ) : (
          <button
            type="button"
            onClick={() => handleSendOtp(selectedChannel)}
            disabled={loading}
            className="otp-resend-btn"
          >
            إعادة إرسال الرمز
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          setStep('choose');
          setCode('');
          setError(null);
        }}
        className="otp-cancel-btn"
      >
        تغيير القناة
      </button>

      <style jsx>{`
        .otp-verify {
          display: flex;
          flex-direction: column;
          gap: 18px;
          padding: 8px;
        }
        .otp-header { text-align: center; }
        .otp-icon {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          margin-bottom: 12px;
        }
        .otp-header h2 {
          font-size: 20px;
          font-weight: 800;
          margin: 0 0 6px;
        }
        .otp-header p {
          font-size: 13px;
          color: var(--ink-3, #6E7878);
          margin: 0 0 8px;
        }
        .otp-phone {
          display: inline-block;
          background: var(--paper-2, #EDE6D3);
          padding: 6px 14px;
          border-radius: 8px;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 700;
          font-size: 13px;
        }
        .otp-input-group { display: flex; flex-direction: column; gap: 6px; }
        .otp-input-group label {
          font-size: 12px;
          font-weight: 700;
          margin-right: 4px;
        }
        .otp-input {
          background: var(--white, #FFFFFF);
          border: 2px solid var(--line, rgba(15, 26, 28, 0.08));
          border-radius: 14px;
          padding: 18px;
          font-size: 26px;
          letter-spacing: 0.5em;
          text-align: center;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 700;
          outline: none;
          transition: border-color 0.2s;
        }
        .otp-input:focus { border-color: var(--emerald, #0E5C4D); }
        .otp-error {
          background: var(--rose-soft, #F0D7D8);
          color: var(--rose, #A82E3D);
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          text-align: center;
        }
        .otp-verify-btn {
          background: var(--emerald, #0E5C4D);
          color: var(--paper-3, #FAF6EB);
          padding: 14px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 800;
          border: 0;
          cursor: pointer;
          box-shadow: 0 6px 16px -4px rgba(14, 92, 77, 0.4);
          transition: all 0.2s;
        }
        .otp-verify-btn:hover:not(:disabled) { transform: translateY(-1px); }
        .otp-verify-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .otp-resend {
          text-align: center;
          font-size: 12px;
          color: var(--ink-3, #6E7878);
        }
        .otp-resend-btn {
          background: transparent;
          border: 0;
          color: var(--emerald, #0E5C4D);
          font-weight: 700;
          cursor: pointer;
          font-size: 13px;
        }
        .otp-cancel-btn {
          background: transparent;
          border: 0;
          color: var(--ink-3, #6E7878);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          padding: 6px;
        }
      `}</style>
    </div>
  );
}
