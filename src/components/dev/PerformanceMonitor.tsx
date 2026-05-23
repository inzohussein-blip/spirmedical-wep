'use client';

import { useEffect, useState } from 'react';

/**
 * ════════════════════════════════════════════════════════════════════
 * 📊 PerformanceMonitor (V25.40)
 * ════════════════════════════════════════════════════════════════════
 *
 * Floating widget يعرض معلومات الأداء في الـ dev mode
 *
 * يعرض:
 *   ✓ حجم CSS المحمّل (raw + gzipped tilde)
 *   ✓ First Paint, First Contentful Paint, Largest Contentful Paint
 *   ✓ Total resources loaded
 *   ✓ Time to Interactive (approximate)
 *
 * يظهر فقط في:
 *   • Development mode (NODE_ENV !== 'production')
 *   • أو localStorage.spir_perf_monitor === 'true'
 *
 * Keyboard shortcut: Ctrl+Shift+P لإظهار/إخفاء
 * ════════════════════════════════════════════════════════════════════
 */

interface PerformanceMetrics {
  cssSize: number;          // bytes
  cssCount: number;
  totalSize: number;        // كل الـ resources
  fp: number | null;        // First Paint
  fcp: number | null;       // First Contentful Paint
  lcp: number | null;       // Largest Contentful Paint
  tti: number | null;       // Time to Interactive
  domLoaded: number | null;
  pageLoad: number | null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatMs(ms: number | null): string {
  if (ms === null) return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function getPerformanceColor(ms: number | null, good: number, ok: number): string {
  if (ms === null) return '#888';
  if (ms <= good) return '#0F6E56';
  if (ms <= ok) return '#BA7517';
  return '#A32D2D';
}

export default function PerformanceMonitor() {
  const [visible, setVisible] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // فحص إذا مفعّل
    const isDev = process.env.NODE_ENV !== 'production';
    const userEnabled = localStorage.getItem('spir_perf_monitor') === 'true';

    if (!isDev && !userEnabled) return;

    setEnabled(true);
    setVisible(true);

    // keyboard shortcut: Ctrl+Shift+P
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setVisible((v) => !v);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // جمع المقاييس
    const collectMetrics = () => {
      try {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

        // CSS resources
        const cssResources = resources.filter((r) =>
          r.name.includes('.css') || r.initiatorType === 'css' || r.initiatorType === 'link'
        );
        const cssSize = cssResources.reduce((sum, r) => sum + (r.transferSize || r.encodedBodySize || 0), 0);
        const totalSize = resources.reduce((sum, r) => sum + (r.transferSize || r.encodedBodySize || 0), 0);

        // Paint metrics
        const paintEntries = performance.getEntriesByType('paint');
        const fp = paintEntries.find((p) => p.name === 'first-paint')?.startTime ?? null;
        const fcp = paintEntries.find((p) => p.name === 'first-contentful-paint')?.startTime ?? null;

        // LCP via PerformanceObserver (lazy)
        let lcp: number | null = null;
        try {
          const lcpEntries = (performance as unknown as {
            getEntriesByType: (type: string) => Array<{ startTime: number }>;
          }).getEntriesByType?.('largest-contentful-paint');
          if (lcpEntries && lcpEntries.length > 0) {
            lcp = lcpEntries[lcpEntries.length - 1].startTime;
          }
        } catch {
          // غير متوفّر
        }

        // Navigation timing
        const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
        const domLoaded = navEntry ? navEntry.domContentLoadedEventEnd : null;
        const pageLoad = navEntry ? navEntry.loadEventEnd : null;

        // TTI تقريبي (DOM Content Loaded)
        const tti = domLoaded;

        setMetrics({
          cssSize,
          cssCount: cssResources.length,
          totalSize,
          fp,
          fcp,
          lcp,
          tti,
          domLoaded,
          pageLoad,
        });
      } catch (err) {
        console.warn('[PerformanceMonitor] Failed to collect metrics:', err);
      }
    };

    // جمع بعد load
    if (document.readyState === 'complete') {
      setTimeout(collectMetrics, 100);
    } else {
      window.addEventListener('load', () => setTimeout(collectMetrics, 200));
    }

    // LCP observer
    let lcpObserver: PerformanceObserver | null = null;
    try {
      lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          const lastLcp = entries[entries.length - 1];
          setMetrics((prev) => prev ? { ...prev, lcp: lastLcp.startTime } : null);
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      // غير مدعوم
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      lcpObserver?.disconnect();
    };
  }, []);

  if (!enabled || !visible || !metrics) return null;

  // تقييم الأداء
  const cssVerdict = metrics.cssSize < 50_000 ? '🟢 ممتاز' : metrics.cssSize < 150_000 ? '🟡 مقبول' : '🔴 كبير';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 12,
        insetInlineEnd: 12,
        zIndex: 99999,
        background: 'rgba(15, 26, 28, 0.92)',
        color: '#fff',
        borderRadius: 10,
        padding: '10px 14px',
        fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
        fontSize: 11,
        lineHeight: 1.6,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        maxWidth: 320,
      }}
      role="complementary"
      aria-label="Performance Monitor"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
        <span style={{ fontSize: 14 }}>📊</span>
        <strong style={{ flex: 1, fontSize: 12 }}>Spir Performance</strong>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="إخفاء"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 14,
            opacity: 0.6,
            padding: 0,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {/* CSS Info */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ opacity: 0.7 }}>CSS ({metrics.cssCount})</span>
          <span style={{ fontWeight: 700 }}>{formatBytes(metrics.cssSize)} <span style={{ opacity: 0.6 }}>{cssVerdict}</span></span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ opacity: 0.7 }}>Total Resources</span>
          <span>{formatBytes(metrics.totalSize)}</span>
        </div>
      </div>

      {/* Paint Metrics */}
      <div style={{ marginBottom: 8, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ opacity: 0.7 }}>FP</span>
          <span style={{ color: getPerformanceColor(metrics.fp, 1000, 2500) }}>{formatMs(metrics.fp)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ opacity: 0.7 }}>FCP</span>
          <span style={{ color: getPerformanceColor(metrics.fcp, 1800, 3000) }}>{formatMs(metrics.fcp)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ opacity: 0.7 }}>LCP</span>
          <span style={{ color: getPerformanceColor(metrics.lcp, 2500, 4000) }}>{formatMs(metrics.lcp)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ opacity: 0.7 }}>TTI</span>
          <span style={{ color: getPerformanceColor(metrics.tti, 3800, 7300) }}>{formatMs(metrics.tti)}</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.1)', opacity: 0.5, fontSize: 9 }}>
        Ctrl+Shift+P لإخفاء/إظهار
      </div>
    </div>
  );
}
