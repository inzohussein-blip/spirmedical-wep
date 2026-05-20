'use client';

import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { haptic } from '@/lib/haptic';

/**
 * ═══════════════════════════════════════════════════════════════
 * 📳 Haptic Button (V25.16)
 * ═══════════════════════════════════════════════════════════════
 *
 * Button مع haptic feedback تلقائي
 *
 * Usage:
 *   <HapticButton hapticStrength="medium" onClick={...}>
 *     احجز الآن
 *   </HapticButton>
 *
 * Strengths:
 *   - light:     تنقّل، tap عادي
 *   - selection: تبديل (checkbox)
 *   - medium:    تأكيد عملية (دفع)
 *   - heavy:     تحذير
 *   - success:   نجح
 *   - error:     فشل
 * ═══════════════════════════════════════════════════════════════
 */

type HapticStrength =
  | 'light'
  | 'selection'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'error'
  | 'warning'
  | 'none';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  hapticStrength?: HapticStrength;
}

const HapticButton = forwardRef<HTMLButtonElement, Props>(
  ({ hapticStrength = 'light', onClick, children, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // ▶ haptic feedback
      if (hapticStrength !== 'none') {
        switch (hapticStrength) {
          case 'light':     haptic.light(); break;
          case 'selection': haptic.selection(); break;
          case 'medium':    haptic.medium(); break;
          case 'heavy':     haptic.heavy(); break;
          case 'success':   haptic.success(); break;
          case 'error':     haptic.error(); break;
          case 'warning':   haptic.warning(); break;
        }
      }

      onClick?.(e);
    };

    return (
      <button ref={ref} onClick={handleClick} {...props}>
        {children}
      </button>
    );
  }
);

HapticButton.displayName = 'HapticButton';

export default HapticButton;
