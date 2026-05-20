'use client';

import {
  useState, useRef, useCallback, useEffect,
  type ReactNode, type CSSProperties,
} from 'react';
import { haptic } from '@/lib/haptic';

/**
 * ═══════════════════════════════════════════════════════════════
 * ↔️ Tab Swipe (V25.17)
 * ═══════════════════════════════════════════════════════════════
 *
 * Swipe بين الـ tabs مثل native apps
 *   ✓ Smooth transitions
 *   ✓ Progress indicator
 *   ✓ Haptic feedback
 *   ✓ يحترم RTL
 *
 * Usage:
 *   <TabSwipe
 *     tabs={[
 *       { id: 'all', label: 'الكل', content: <AllList /> },
 *       { id: 'pending', label: 'معلّق', content: <PendingList /> },
 *       { id: 'done', label: 'مُكتمل', content: <DoneList /> },
 *     ]}
 *     defaultTab="all"
 *   />
 * ═══════════════════════════════════════════════════════════════
 */

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
  badge?: number | string;
  icon?: ReactNode;
}

interface Props {
  tabs: TabItem[];
  defaultTab?: string;
  /** Disable swipe (يبقى الـ click فقط) */
  disableSwipe?: boolean;
  /** Callback عند تغيير الـ tab */
  onTabChange?: (tabId: string) => void;
  /** Style للـ tabs container */
  className?: string;
}

export default function TabSwipe({
  tabs,
  defaultTab,
  disableSwipe = false,
  onTabChange,
  className,
}: Props) {
  const initialIndex = tabs.findIndex((t) => t.id === defaultTab);
  const [activeIndex, setActiveIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);
  const startTime = useRef<number>(0);

  const switchTab = useCallback((index: number) => {
    if (index < 0 || index >= tabs.length) return;
    haptic.selection();
    setActiveIndex(index);
    onTabChange?.(tabs[index].id);
  }, [tabs, onTabChange]);

  // ─── Touch handlers ───
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disableSwipe) return;
    startX.current = e.touches[0].clientX;
    startTime.current = Date.now();
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disableSwipe || startX.current === null) return;
    const dx = e.touches[0].clientX - startX.current;

    // resistance على الحواف
    let nextOffset = dx;
    if ((activeIndex === 0 && dx > 0) || (activeIndex === tabs.length - 1 && dx < 0)) {
      nextOffset = dx * 0.3;
    }

    setDragOffset(nextOffset);
  };

  const handleTouchEnd = () => {
    if (disableSwipe || startX.current === null) return;
    const dt = Date.now() - startTime.current;
    const velocity = Math.abs(dragOffset) / dt;
    const threshold = velocity > 0.5 ? 30 : 80;

    if (Math.abs(dragOffset) >= threshold) {
      // RTL: swipe لليمين = الـ tab السابق (index--)
      // swipe لليسار = الـ tab التالي (index++)
      if (dragOffset > 0 && activeIndex > 0) {
        switchTab(activeIndex - 1);
      } else if (dragOffset < 0 && activeIndex < tabs.length - 1) {
        switchTab(activeIndex + 1);
      }
    }

    startX.current = null;
    setDragOffset(0);
    setIsDragging(false);
  };

  // ─── Scroll active tab into view ───
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const activeTab = document.querySelector(`[data-tab-id="${tabs[activeIndex]?.id}"]`);
    if (activeTab) {
      activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeIndex, tabs]);

  return (
    <div className={className}>
      {/* Tabs header */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          overflowX: 'auto',
          paddingBottom: 4,
          marginBottom: 12,
          position: 'relative',
          scrollbarWidth: 'none',
        }}
        role="tablist"
      >
        <style>{`
          [role="tablist"]::-webkit-scrollbar { display: none; }
        `}</style>

        {tabs.map((tab, i) => {
          const isActive = i === activeIndex;
          return (
            <button
              key={tab.id}
              data-tab-id={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => switchTab(i)}
              style={{
                padding: '8px 14px',
                background: isActive ? 'var(--emerald)' : 'var(--white)',
                color: isActive ? 'var(--paper-3)' : 'var(--ink-2)',
                border: '1px solid',
                borderColor: isActive ? 'var(--emerald)' : 'var(--line)',
                borderRadius: 100,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 12,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
            >
              {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
              {tab.label}
              {tab.badge !== undefined && tab.badge !== 0 && (
                <span
                  style={{
                    minWidth: 18,
                    height: 18,
                    padding: '0 5px',
                    background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--rose)',
                    color: isActive ? 'var(--paper-3)' : 'var(--paper-3)',
                    borderRadius: 9,
                    fontSize: 9,
                    fontWeight: 900,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Progress dots (للـ swipe hint) */}
      {tabs.length > 1 && tabs.length <= 5 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 4,
          marginBottom: 12,
        }}>
          {tabs.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === activeIndex ? 16 : 5,
                height: 5,
                borderRadius: 3,
                background: i === activeIndex ? 'var(--emerald)' : 'var(--paper-3)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      )}

      {/* Swipeable content */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          overflow: 'hidden',
          touchAction: 'pan-y',
        } as CSSProperties}
      >
        <div
          style={{
            transform: `translateX(${dragOffset}px)`,
            transition: isDragging ? 'none' : 'transform 0.25s ease',
            willChange: 'transform',
          }}
        >
          {tabs[activeIndex]?.content}
        </div>
      </div>
    </div>
  );
}
