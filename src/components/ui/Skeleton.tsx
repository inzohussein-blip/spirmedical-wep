import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * ═══════════════════════════════════════════════════════════════
 * Skeleton Primitive — V25 (Design Tokens Aware)
 * ═══════════════════════════════════════════════════════════════
 *
 * Placeholders للتحميل بدلاً من spinners مملة
 *
 * استخدام:
 *   <Skeleton className="h-4 w-32" />              // text line
 *   <Skeleton variant="circle" className="w-10 h-10" />  // avatar
 *   <Skeleton variant="rect" className="w-full h-32" />  // card image
 *
 *   // مجموعات جاهزة:
 *   <SkeletonCard />
 *   <SkeletonListItem />
 *   <SkeletonTable rows={5} />
 * ═══════════════════════════════════════════════════════════════
 */

type SkeletonVariant = 'text' | 'rect' | 'circle';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
}

const VARIANT_CLASSES: Record<SkeletonVariant, string> = {
  text: 'rounded-sm h-3',
  rect: 'rounded-md',
  circle: 'rounded-full',
};

export function Skeleton({
  className,
  variant = 'text',
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-paper-2',
        VARIANT_CLASSES[variant],
        className
      )}
      style={{
        background:
          'linear-gradient(90deg, var(--paper-2) 0%, var(--paper-3) 50%, var(--paper-2) 100%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
      }}
      aria-hidden="true"
      {...props}
    />
  );
}

/* ─── جاهزة: SkeletonCard ─────────────────────────────────── */

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg border border-line p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Skeleton variant="circle" className="w-10 h-10" />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton className="w-32" />
          <Skeleton className="w-20 h-2" />
        </div>
      </div>
      <Skeleton variant="rect" className="w-full h-20" />
      <div className="flex gap-2">
        <Skeleton className="w-16 h-2" />
        <Skeleton className="w-24 h-2" />
      </div>
    </div>
  );
}

/* ─── SkeletonListItem ────────────────────────────────────── */

export function SkeletonListItem() {
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-md border border-line">
      <Skeleton variant="circle" className="w-12 h-12 flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton className="w-3/4" />
        <Skeleton className="w-1/2 h-2" />
      </div>
      <Skeleton variant="rect" className="w-16 h-7 flex-shrink-0" />
    </div>
  );
}

/* ─── SkeletonTable ──────────────────────────────────────── */

export interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export function SkeletonTable({ rows = 5, columns = 4 }: SkeletonTableProps) {
  return (
    <div className="bg-white rounded-lg border border-line overflow-hidden">
      {/* Header */}
      <div className="border-b border-line p-3 flex gap-3 bg-paper-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="flex-1 h-3" />
        ))}
      </div>
      {/* Rows */}
      <div className="divide-y divide-line">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="p-3 flex gap-3 items-center">
            {Array.from({ length: columns }).map((_, colIdx) => (
              <Skeleton
                key={colIdx}
                className="flex-1 h-2.5"
                style={{
                  opacity: 1 - rowIdx * 0.1,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── SkeletonStats (للوحات الإحصاء) ──────────────────── */

export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-lg border border-line p-4 flex flex-col gap-2"
        >
          <Skeleton className="w-16 h-2.5" />
          <Skeleton className="w-20 h-6" />
          <Skeleton className="w-24 h-2" />
        </div>
      ))}
    </div>
  );
}

/* ─── SkeletonDoctorCard (V25.12) ─────────────────────── */
export function SkeletonDoctorCard() {
  return (
    <article
      style={{
        background: 'var(--white)',
        border: '1px solid var(--line)',
        borderRadius: 14,
        padding: 14,
      }}
      aria-hidden="true"
    >
      <div style={{ display: 'flex', gap: 12 }}>
        <Skeleton variant="circle" className="w-14 h-14 flex-shrink-0" />
        <div style={{ flex: 1 }}>
          <Skeleton className="w-3/4 h-4 mb-2" />
          <Skeleton className="w-1/2 h-3 mb-1" />
          <Skeleton className="w-2/5 h-2.5 mb-2" />
          <div className="flex gap-1">
            <Skeleton variant="rect" className="w-14 h-4 rounded" />
            <Skeleton variant="rect" className="w-12 h-4 rounded" />
          </div>
        </div>
      </div>
      <div
        style={{
          marginTop: 10,
          paddingTop: 10,
          borderTop: '1px solid var(--line)',
          display: 'flex',
          gap: 6,
        }}
      >
        <Skeleton variant="rect" className="flex-1 h-8 rounded-md" />
        <Skeleton variant="rect" className="flex-1 h-8 rounded-md" />
      </div>
    </article>
  );
}

/* ─── SkeletonProductCard (V25.12) ────────────────────── */
export function SkeletonProductCard() {
  return (
    <article
      style={{
        background: 'var(--white)',
        border: '1px solid var(--line)',
        borderRadius: 12,
        padding: 12,
      }}
      aria-hidden="true"
    >
      <Skeleton variant="rect" className="w-full h-12 mb-2 rounded-md" />
      <Skeleton className="w-4/5 h-3 mb-1" />
      <Skeleton className="w-1/2 h-2.5 mb-2" />
      <Skeleton className="w-2/5 h-3.5" />
    </article>
  );
}

/* ─── SkeletonProductGrid (V25.12) ────────────────────── */
export function SkeletonProductGrid({ count = 6 }: { count?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonProductCard key={i} />
      ))}
    </div>
  );
}

/* ─── SkeletonChatItem (V25.12) ──────────────────────── */
export function SkeletonChatItem() {
  return (
    <article
      style={{
        background: 'var(--white)',
        border: '1px solid var(--line)',
        borderRadius: 12,
        padding: 12,
      }}
      aria-hidden="true"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Skeleton variant="circle" className="w-11 h-11 flex-shrink-0" />
        <div style={{ flex: 1 }}>
          <Skeleton className="w-2/5 h-3 mb-2" />
          <Skeleton className="w-4/5 h-2.5 mb-1" />
          <Skeleton className="w-1/3 h-2" />
        </div>
      </div>
    </article>
  );
}

/* ─── SkeletonChatList (V25.12) ──────────────────────── */
export function SkeletonChatList({ count = 5 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonChatItem key={i} />
      ))}
    </div>
  );
}

/* ─── SkeletonAvatar (V25.18) ──────────────────────────── */
export function SkeletonAvatar({ size = 44 }: { size?: number }) {
  return (
    <Skeleton
      variant="circle"
      style={{ width: size, height: size, flexShrink: 0 }}
    />
  );
}
