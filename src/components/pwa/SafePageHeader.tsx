'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { haptic } from '@/lib/haptic';
import { type ReactNode } from 'react';

/**
 * ═══════════════════════════════════════════════════════════════
 * 📐 Safe Page Header (V25.17)
 * ═══════════════════════════════════════════════════════════════
 *
 * Header موحّد يحترم safe areas (notch) + haptic feedback
 *
 * مميزات:
 *   ✓ Safe area padding تلقائي
 *   ✓ Sticky positioning
 *   ✓ Blur effect عند الـ scroll
 *   ✓ Back button مع haptic
 *   ✓ Action buttons (right side)
 *   ✓ يدعم الـ deep navigation
 *
 * Usage:
 *   <SafePageHeader
 *     title="حجوزاتي"
 *     subtitle="3 حجوزات قادمة"
 *     backHref="/dashboard"
 *     actions={[
 *       { icon: <Filter />, onClick: openFilter, label: 'فلتر' }
 *     ]}
 *   />
 * ═══════════════════════════════════════════════════════════════
 */

export interface HeaderAction {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  badge?: number | string;
}

interface Props {
  /** عنوان الصفحة */
  title: string;
  /** عنوان فرعي */
  subtitle?: string;
  /** رابط زر العودة (افتراضي: router.back) */
  backHref?: string;
  /** إخفاء زر العودة */
  hideBack?: boolean;
  /** أزرار في اليسار (يمين بالعربي) */
  actions?: HeaderAction[];
  /** transparent background */
  transparent?: boolean;
  /** يلتصق فوق */
  sticky?: boolean;
}

export default function SafePageHeader({
  title,
  subtitle,
  backHref,
  hideBack = false,
  actions = [],
  transparent = false,
  sticky = false,
}: Props) {
  const router = useRouter();

  const handleBack = () => {
    haptic.light();
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <header
      className={sticky ? 'safe-header sticky-header' : 'safe-header'}
      style={{
        background: transparent ? 'transparent' : 'var(--paper)',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        paddingInline: 'calc(env(safe-area-inset-left, 0px) + 12px) calc(env(safe-area-inset-right, 0px) + 12px)',
        paddingBottom: 12,
        ...(sticky && {
          position: 'sticky',
          top: 0,
          zIndex: 40,
          backdropFilter: 'blur(12px)',
          background: transparent
            ? 'rgba(244, 239, 226, 0.85)'
            : 'rgba(244, 239, 226, 0.95)',
          borderBottom: '1px solid var(--line)',
        }),
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          minHeight: 44,
        }}
      >
        {!hideBack && (
          <button
            type="button"
            onClick={handleBack}
            aria-label="رجوع"
            style={{
              width: 36,
              height: 36,
              background: 'var(--white)',
              border: '1px solid var(--line)',
              borderRadius: 10,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'transform 0.15s ease',
            }}
            onTouchStart={() => {}}
          >
            <ArrowRight size={18} strokeWidth={2.2} />
          </button>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              fontSize: 17,
              fontWeight: 900,
              margin: 0,
              color: 'var(--ink)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                fontSize: 11,
                color: 'var(--ink-3)',
                margin: '2px 0 0',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Actions */}
        {actions.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {actions.map((action, i) => {
              if (action.href) {
                return (
                  <Link
                    key={i}
                    href={action.href}
                    aria-label={action.label}
                    style={{
                      width: 36,
                      height: 36,
                      background: 'var(--white)',
                      border: '1px solid var(--line)',
                      borderRadius: 10,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--ink-2)',
                      textDecoration: 'none',
                      position: 'relative',
                      fontFamily: 'inherit',
                    }}
                  >
                    {action.icon}
                    {action.badge !== undefined && action.badge !== 0 && (
                      <ActionBadge value={action.badge} />
                    )}
                  </Link>
                );
              }

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => { haptic.light(); action.onClick?.(); }}
                  aria-label={action.label}
                  style={{
                    width: 36,
                    height: 36,
                    background: 'var(--white)',
                    border: '1px solid var(--line)',
                    borderRadius: 10,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--ink-2)',
                    position: 'relative',
                    fontFamily: 'inherit',
                  }}
                >
                  {action.icon}
                  {action.badge !== undefined && action.badge !== 0 && (
                    <ActionBadge value={action.badge} />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}

function ActionBadge({ value }: { value: number | string }) {
  return (
    <span
      style={{
        position: 'absolute',
        top: -4,
        insetInlineEnd: -4,
        minWidth: 16,
        height: 16,
        padding: '0 4px',
        background: 'var(--rose)',
        color: 'var(--paper-3)',
        borderRadius: 8,
        fontSize: 9,
        fontWeight: 900,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {value}
    </span>
  );
}
