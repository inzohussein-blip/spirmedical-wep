'use client';

import { Drawer as VaulDrawer } from 'vaul';
import { type ReactNode } from 'react';

/**
 * ════════════════════════════════════════════════════════════════════
 * 🍃 BottomDrawer (V25.32)
 * ════════════════════════════════════════════════════════════════════
 *
 * Bottom Sheet مثل تطبيقات iOS/Android الأصلية
 * مبني على vaul (مثل Shadcn Drawer)
 *
 * Features:
 *   - Drag handle في الأعلى
 *   - swipe down للإغلاق
 *   - Backdrop blur
 *   - يحترم safe-area-inset-bottom
 *
 * Usage:
 *   <BottomDrawer
 *     open={open}
 *     onOpenChange={setOpen}
 *     title="تصفية الأطباء"
 *   >
 *     <div>محتوى الـ drawer</div>
 *   </BottomDrawer>
 * ════════════════════════════════════════════════════════════════════
 */

interface BottomDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function BottomDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: BottomDrawerProps) {
  return (
    <VaulDrawer.Root open={open} onOpenChange={onOpenChange}>
      <VaulDrawer.Portal>
        {/* Backdrop */}
        <VaulDrawer.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            zIndex: 999,
          }}
        />

        {/* Drawer content */}
        <VaulDrawer.Content
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'var(--paper, #FAFAF6)',
            borderRadius: '20px 20px 0 0',
            zIndex: 1000,
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            outline: 'none',
            paddingBottom: 'env(safe-area-inset-bottom)',
            boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.08)',
          }}
        >
          {/* Drag Handle */}
          <div
            aria-hidden="true"
            style={{
              padding: '10px 0 6px',
              display: 'flex',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 40,
                height: 4,
                background: 'var(--line-2, #D3D1C7)',
                borderRadius: 100,
              }}
            />
          </div>

          {/* Header */}
          {(title || description) && (
            <div style={{ padding: '6px 20px 12px', flexShrink: 0 }}>
              {title && (
                <VaulDrawer.Title asChild>
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 900,
                      color: 'var(--ink, #2C2C2A)',
                      margin: 0,
                      marginBottom: description ? 4 : 0,
                    }}
                  >
                    {title}
                  </h3>
                </VaulDrawer.Title>
              )}
              {description && (
                <VaulDrawer.Description asChild>
                  <p
                    style={{
                      fontSize: 12,
                      color: 'var(--ink-3, #5F5E5A)',
                      margin: 0,
                      lineHeight: 1.6,
                    }}
                  >
                    {description}
                  </p>
                </VaulDrawer.Description>
              )}
            </div>
          )}

          {/* Body (scrollable) */}
          <div
            style={{
              padding: '0 20px 16px',
              overflowY: 'auto',
              flex: 1,
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {children}
          </div>

          {/* Footer (sticky) */}
          {footer && (
            <div
              style={{
                padding: '12px 20px 14px',
                borderTop: '0.5px solid var(--line, #E8E5DC)',
                background: 'var(--paper, #FAFAF6)',
                flexShrink: 0,
              }}
            >
              {footer}
            </div>
          )}
        </VaulDrawer.Content>
      </VaulDrawer.Portal>
    </VaulDrawer.Root>
  );
}

/**
 * Drawer trigger button helper
 */
export function DrawerTrigger({
  onClick,
  children,
  style,
  className,
}: {
  onClick: () => void;
  children: ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      style={{
        WebkitTapHighlightColor: 'transparent',
        cursor: 'pointer',
        ...style,
      }}
    >
      {children}
    </button>
  );
}
