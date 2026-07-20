'use client';

import { AlertTriangle } from 'lucide-react';

/**
 * رسالة خطأ مضمّنة صغيرة (⚠ + نص) — مشتركة، بالتوكنز.
 * للتدفّقات ذات التنسيق المضمّن (inline styles) التي لا صنف CSS جاهزاً لها.
 */
export default function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        color: 'var(--rose, #A82E3D)',
        fontSize: 11.5,
        fontWeight: 800,
        marginTop: 5,
      }}
    >
      <AlertTriangle size={13} strokeWidth={2.4} aria-hidden />
      <span>{message}</span>
    </div>
  );
}
