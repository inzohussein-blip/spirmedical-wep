'use client';

/**
 * ═══════════════════════════════════════════════════════════════
 * 🔘 SubmitButton
 * ═══════════════════════════════════════════════════════════════
 */

import { Loader2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';

interface Props {
  children: React.ReactNode;
  loadingText: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  name?: string;
  value?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function SubmitButton({
  children,
  loadingText,
  variant = 'primary',
  name,
  value,
  onClick,
  disabled,
}: Props) {
  const { pending } = useFormStatus();

  const variantClass =
    variant === 'primary' ? 'auth-cta' :
    variant === 'secondary' ? 'auth-cta auth-cta-secondary' :
    'auth-cta auth-cta-ghost';

  return (
    <button
      type="submit"
      className={variantClass}
      name={name}
      value={value}
      onClick={onClick}
      disabled={pending || disabled}
      aria-busy={pending}
    >
      {pending ? (
        <span className="auth-cta-loading">
          <Loader2 size={18} className="auth-spin" />
          <span>{loadingText}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
