'use client';

/**
 * ═══════════════════════════════════════════════════════════════
 * 🔐 OtpSkipDialog
 * ═══════════════════════════════════════════════════════════════
 */

import { ShieldCheck, KeyRound, Zap } from 'lucide-react';

interface Props {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function OtpSkipDialog({ open, onCancel, onConfirm }: Props) {
  if (!open) return null;

  return (
    <div className="auth-confirm" role="dialog" aria-modal="true" aria-labelledby="otp-skip-title">
      <div className="auth-confirm-backdrop" onClick={onCancel} />
      <div className="auth-confirm-card">
        <div className="auth-confirm-icon">
          <ShieldCheck size={28} />
        </div>
        <h3 id="otp-skip-title" className="auth-confirm-title">
          دخول بدون رمز تحقق؟
        </h3>
        <p className="auth-confirm-body">
          نوصي بإرسال رمز للتحقق لحماية حسابك. الدخول بدون رمز
          يعني أن حسابك أقل حماية لو ضاع جهازك.
        </p>
        <div className="auth-confirm-actions">
          <button type="button" className="auth-confirm-btn ghost" onClick={onCancel}>
            <KeyRound size={16} />
            <span>أرسل لي الرمز</span>
          </button>
          <button type="button" className="auth-confirm-btn danger" onClick={onConfirm}>
            <Zap size={16} />
            <span>أكمل بدون رمز</span>
          </button>
        </div>
      </div>
    </div>
  );
}
