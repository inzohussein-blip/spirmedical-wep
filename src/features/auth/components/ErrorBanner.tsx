'use client';

/**
 * ═══════════════════════════════════════════════════════════════
 * ⚠️ ErrorBanner
 * ═══════════════════════════════════════════════════════════════
 */

import { AlertCircle } from 'lucide-react';

interface Props {
  message: string;
  code?: string;
  hint?: string;
}

export function ErrorBanner({ message, code, hint }: Props) {
  return (
    <div className="auth-error" role="alert">
      <AlertCircle size={18} className="auth-error-icon" />
      <div className="auth-error-body">
        <span className="auth-error-text">{message}</span>
        {code && (
          <span className="auth-error-code">
            {hint ?? 'خطأ غير معروف'} ({code})
          </span>
        )}
      </div>
    </div>
  );
}
