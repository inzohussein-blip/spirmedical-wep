'use client';

/**
 * ═══════════════════════════════════════════════════════════════
 * 👥 RoleSelector
 * ═══════════════════════════════════════════════════════════════
 */

import { useRouter } from 'next/navigation';
import { User, Stethoscope, Eye, ShieldCheck } from 'lucide-react';
import { haptic } from '@/lib/haptic';
import type { Role } from '../types';
import { ROLE_INFO } from '../lib/role-info';

const ICONS = {
  User, Stethoscope, Eye, ShieldCheck,
} as const;

interface Props {
  currentRole: Role;
  publicRoles: readonly Role[];
}

export function RoleSelector({ currentRole, publicRoles }: Props) {
  const router = useRouter();

  return (
    <div className="role-tabs" role="tablist" aria-label="نوع الحساب">
      {publicRoles.map((r) => {
        const meta = ROLE_INFO[r];
        const Icon = ICONS[meta.iconName];
        return (
          <button
            key={r}
            role="tab"
            aria-selected={currentRole === r}
            onClick={() => {
              haptic.selection();
              router.push(`/login?role=${r}`);
            }}
            className={`role-tab ${currentRole === r ? 'active' : ''}`}
            type="button"
          >
            <Icon size={14} />
            <span>{r === 'patient' ? 'مراجع' : 'أخصائي'}</span>
          </button>
        );
      })}
    </div>
  );
}
