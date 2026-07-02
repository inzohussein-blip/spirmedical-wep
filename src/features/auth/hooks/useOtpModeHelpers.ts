'use client';

/**
 * ═══════════════════════════════════════════════════════════════
 * ⚙️ useOtpModeHelpers
 * ═══════════════════════════════════════════════════════════════
 */

import { useMemo } from 'react';
import type { OtpMode } from '../types';

export function useOtpModeHelpers(mode: OtpMode | undefined) {
  return useMemo(() => {
    const m = mode ?? 'disabled';
    return {
      mode: m,
      requiresOtp: m === 'required',
      allowsOtp: m === 'required' || m === 'optional',
      allowsSkip: m === 'disabled' || m === 'optional',
    };
  }, [mode]);
}
