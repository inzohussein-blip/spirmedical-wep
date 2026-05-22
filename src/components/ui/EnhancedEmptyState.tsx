import Link from 'next/link';
import { type ReactNode } from 'react';

/**
 * ════════════════════════════════════════════════════════════════════
 * 🎨 EnhancedEmptyState (V25.34)
 * ════════════════════════════════════════════════════════════════════
 *
 * Empty state ودود مع illustration دائري + CTA + secondary actions
 *
 * Usage:
 *   <EnhancedEmptyState
 *     icon="📋"
 *     decorIcon="➕"
 *     title="ما عندك طلبات بعد"
 *     description="احجز أول خدمة وستظهر هنا"
 *     primaryAction={{ href: '/appointments/new', label: 'احجز خدمتك الأولى' }}
 *     secondaryActions={[
 *       { href: '/services', label: '🔍 استكشف الخدمات' },
 *       { href: '/account/help', label: '💬 اسأل دعم' },
 *     ]}
 *   />
 * ════════════════════════════════════════════════════════════════════
 */

interface ActionItem {
  href?: string;
  label: string;
  onClick?: () => void;
}

interface Props {
  icon: ReactNode;
  decorIcon?: ReactNode;
  title: string;
  description?: ReactNode;
  primaryAction?: ActionItem;
  secondaryActions?: ActionItem[];
  variant?: 'emerald' | 'amber' | 'rose' | 'purple';
}

const VARIANT_COLORS: Record<NonNullable<Props['variant']>, { bg: string; border: string; iconColor: string }> = {
  emerald: { bg: '#E1F5EE', border: '#9FE1CB', iconColor: '#0F6E56' },
  amber: { bg: '#FAEEDA', border: '#FAC775', iconColor: '#BA7517' },
  rose: { bg: '#FCEBEB', border: '#F09595', iconColor: '#A32D2D' },
  purple: { bg: '#EEEDFE', border: '#CECBF6', iconColor: '#534AB7' },
};

export default function EnhancedEmptyState({
  icon,
  decorIcon,
  title,
  description,
  primaryAction,
  secondaryActions,
  variant = 'emerald',
}: Props) {
  const colors = VARIANT_COLORS[variant];

  return (
    <div className="empty-state-v2">
      <div className="empty-state-v2-illustration">
        <div
          className="empty-state-v2-bg-circle"
          style={{ background: colors.bg }}
          aria-hidden="true"
        />
        <div
          className="empty-state-v2-fg-circle"
          style={{ border: `0.5px solid ${colors.border}`, color: colors.iconColor }}
          aria-hidden="true"
        >
          <span className="empty-state-v2-main-icon">{icon}</span>
        </div>
        {decorIcon && (
          <div className="empty-state-v2-decor" aria-hidden="true">
            <span>{decorIcon}</span>
          </div>
        )}
      </div>

      <h2 className="empty-state-v2-title" style={{ color: colors.iconColor }}>
        {title}
      </h2>

      {description && (
        <div className="empty-state-v2-description">{description}</div>
      )}

      {primaryAction && (
        primaryAction.href ? (
          <Link href={primaryAction.href} className="empty-state-v2-primary-btn">
            {primaryAction.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={primaryAction.onClick}
            className="empty-state-v2-primary-btn"
          >
            {primaryAction.label}
          </button>
        )
      )}

      {secondaryActions && secondaryActions.length > 0 && (
        <>
          <div className="empty-state-v2-or">أو</div>
          <div className="empty-state-v2-secondary-actions">
            {secondaryActions.map((action, idx) =>
              action.href ? (
                <Link
                  key={idx}
                  href={action.href}
                  className="empty-state-v2-secondary-btn"
                >
                  {action.label}
                </Link>
              ) : (
                <button
                  key={idx}
                  type="button"
                  onClick={action.onClick}
                  className="empty-state-v2-secondary-btn"
                >
                  {action.label}
                </button>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
