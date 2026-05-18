'use client';

import { useState, useCallback } from 'react';
import { AlertTriangle, Trash2, AlertCircle, Info } from 'lucide-react';
import {
  BottomSheet,
  BottomSheetHeader,
  BottomSheetBody,
  BottomSheetFooter,
} from './BottomSheet';

/**
 * ═══════════════════════════════════════════════════════════════
 * ConfirmDialog — بديل native confirm() (V25.2)
 * ═══════════════════════════════════════════════════════════════
 *
 * استخدام عبر hook (الموصى به):
 *   const { confirm, ConfirmDialog } = useConfirm();
 *
 *   async function handleDelete() {
 *     const ok = await confirm({
 *       title: 'حذف الموقع',
 *       message: 'هل أنت متأكد؟',
 *       variant: 'danger',
 *     });
 *     if (ok) {
 *       // ... تنفيذ الحذف
 *     }
 *   }
 *
 *   return (
 *     <>
 *       <button onClick={handleDelete}>حذف</button>
 *       <ConfirmDialog />
 *     </>
 *   );
 * ═══════════════════════════════════════════════════════════════
 */

export type ConfirmVariant = 'danger' | 'warning' | 'info' | 'default';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  /** هل يحتاج كتابة كلمة للتأكيد؟ */
  requireText?: string;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

const VARIANT_CONFIG: Record<
  ConfirmVariant,
  { icon: React.ReactElement; color: string; bg: string }
> = {
  danger: {
    icon: <Trash2 size={20} strokeWidth={2.2} />,
    color: 'var(--rose)',
    bg: 'var(--rose-soft)',
  },
  warning: {
    icon: <AlertTriangle size={20} strokeWidth={2.2} />,
    color: 'var(--amber)',
    bg: 'var(--amber-soft)',
  },
  info: {
    icon: <Info size={20} strokeWidth={2.2} />,
    color: 'var(--emerald)',
    bg: 'var(--emerald-soft)',
  },
  default: {
    icon: <AlertCircle size={20} strokeWidth={2.2} />,
    color: 'var(--ink)',
    bg: 'var(--paper-3)',
  },
};

export function useConfirm() {
  const [state, setState] = useState<ConfirmState | null>(null);
  const [textInput, setTextInput] = useState('');

  const confirm = useCallback(
    (options: ConfirmOptions): Promise<boolean> => {
      return new Promise<boolean>((resolve) => {
        setTextInput('');
        setState({ ...options, resolve });
      });
    },
    []
  );

  const handleClose = useCallback(() => {
    if (state) {
      state.resolve(false);
      setState(null);
      setTextInput('');
    }
  }, [state]);

  const handleConfirm = useCallback(() => {
    if (state) {
      // إذا يحتاج كتابة، نتأكد منها
      if (state.requireText && textInput.trim() !== state.requireText) {
        return;
      }
      state.resolve(true);
      setState(null);
      setTextInput('');
    }
  }, [state, textInput]);

  const config = state ? VARIANT_CONFIG[state.variant ?? 'default'] : null;
  const canConfirm =
    !state?.requireText || textInput.trim() === state.requireText;

  const ConfirmDialog = useCallback(() => {
    if (!state || !config) return null;

    return (
      <BottomSheet open={true} onClose={handleClose} maxHeight="auto">
        <BottomSheetHeader title="" showCloseButton={false} />

        {/* Icon + Title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            padding: '8px 20px 16px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: config.bg,
              color: config.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {config.icon}
          </div>
          <h3
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: 'var(--ink)',
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            {state.title}
          </h3>
          {state.message && (
            <p
              style={{
                fontSize: 13,
                color: 'var(--ink-3)',
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              {state.message}
            </p>
          )}
        </div>

        {/* Required text input (للحذف الحرج) */}
        {state.requireText && (
          <BottomSheetBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--ink-3)',
                }}
              >
                اكتب &quot;{state.requireText}&quot; للتأكيد:
              </label>
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={state.requireText}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${
                    textInput && !canConfirm ? 'var(--rose)' : 'var(--line)'
                  }`,
                  borderRadius: 10,
                  fontSize: 13,
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
                autoFocus
              />
            </div>
          </BottomSheetBody>
        )}

        {/* Actions */}
        <BottomSheetFooter>
          <button
            type="button"
            onClick={handleClose}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'var(--white)',
              color: 'var(--ink)',
              border: '1px solid var(--line)',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {state.cancelText ?? 'إلغاء'}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            style={{
              flex: 1,
              padding: '12px 16px',
              background:
                state.variant === 'danger'
                  ? 'var(--rose)'
                  : state.variant === 'warning'
                    ? 'var(--amber)'
                    : 'var(--emerald)',
              color: 'var(--paper-3)',
              border: 'none',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 800,
              cursor: canConfirm ? 'pointer' : 'not-allowed',
              opacity: canConfirm ? 1 : 0.5,
              fontFamily: 'inherit',
            }}
          >
            {state.confirmText ?? 'تأكيد'}
          </button>
        </BottomSheetFooter>
      </BottomSheet>
    );
  }, [state, config, textInput, canConfirm, handleClose, handleConfirm]);

  return { confirm, ConfirmDialog };
}
