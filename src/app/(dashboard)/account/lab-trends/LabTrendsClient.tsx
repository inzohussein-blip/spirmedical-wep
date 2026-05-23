'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';

interface TrendableTest {
  testId: string;
  testName: string;
  unit: string | null;
  normalRangeText: string | null;
  normalMin: number | null;
  normalMax: number | null;
  results: Array<{
    value: number;
    valueText: string;
    status: string;
    date: string;
  }>;
}

interface Props {
  trendableTests: TrendableTest[];
}

/**
 * ════════════════════════════════════════════════════════════════════
 * 🩸 V25.43: Lab Trends Charts (SVG-based, no library)
 * ════════════════════════════════════════════════════════════════════
 * 
 * يعرض لكل تحليل رسم بياني خطّي مع:
 *   ✓ آخر نتيجة + الاتجاه (↑/↓/→)
 *   ✓ النطاق الطبيعي (مظلّل)
 *   ✓ تاريخ كل نقطة
 * ════════════════════════════════════════════════════════════════════
 */

const STATUS_COLORS: Record<string, string> = {
  normal: '#0F6E56',
  low: '#A57100',
  high: '#A57100',
  critical: '#A32D2D',
  inconclusive: '#6B7280',
};

export default function LabTrendsClient({ trendableTests }: Props) {
  return (
    <div style={{ marginTop: 16 }}>
      {trendableTests.map((test) => (
        <TestTrendCard key={test.testId} test={test} />
      ))}
    </div>
  );
}

function TestTrendCard({ test }: { test: TrendableTest }) {
  const { results, normalMin, normalMax, normalRangeText, unit, testName } = test;
  
  // الـ trend
  let trend: 'up' | 'down' | 'stable' | null = null;
  if (results.length >= 2) {
    const last = results[results.length - 1].value;
    const prev = results[results.length - 2].value;
    const diff = last - prev;
    const pctDiff = Math.abs(diff / prev);
    
    if (pctDiff < 0.05) trend = 'stable';
    else if (diff > 0) trend = 'up';
    else trend = 'down';
  }

  const lastResult = results[results.length - 1];
  
  // حدود الرسم
  const allValues = results.map((r) => r.value);
  let minVal = Math.min(...allValues);
  let maxVal = Math.max(...allValues);
  
  // أضِف النطاق الطبيعي
  if (normalMin !== null) minVal = Math.min(minVal, normalMin);
  if (normalMax !== null) maxVal = Math.max(maxVal, normalMax);
  
  // padding
  const range = maxVal - minVal;
  const padding = range * 0.2 || 10;
  minVal -= padding;
  maxVal += padding;
  
  // SVG dimensions
  const width = 320;
  const height = 120;
  const padX = 30;
  const padY = 20;
  const innerW = width - 2 * padX;
  const innerH = height - 2 * padY;
  
  // نقاط
  const points = results.map((r, i) => {
    const x = padX + (i / Math.max(results.length - 1, 1)) * innerW;
    const y = padY + (1 - (r.value - minVal) / (maxVal - minVal)) * innerH;
    return { x, y, value: r.value, valueText: r.valueText, status: r.status, date: r.date };
  });
  
  // path للـ line
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  
  // النطاق الطبيعي
  let normalRangeRect = null;
  if (normalMin !== null && normalMax !== null) {
    const minY = padY + (1 - (normalMin - minVal) / (maxVal - minVal)) * innerH;
    const maxY = padY + (1 - (normalMax - minVal) / (maxVal - minVal)) * innerH;
    normalRangeRect = {
      y: maxY,
      height: minY - maxY,
    };
  }

  return (
    <div style={{
      background: 'var(--white)',
      border: '1px solid var(--line)',
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
            {testName}
          </div>
          {normalRangeText && (
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
              المعدّل الطبيعي: {normalRangeText}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ 
            fontSize: 18, 
            fontWeight: 800,
            color: STATUS_COLORS[lastResult.status] || '#6B7280',
          }}>
            {lastResult.valueText} {unit}
          </div>
          {trend && (
            <div style={{ 
              fontSize: 11, 
              color: trend === 'up' ? '#A57100' : trend === 'down' ? '#0F6E56' : '#6B7280',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              justifyContent: 'flex-end',
            }}>
              {trend === 'up' && <TrendingUp size={12} strokeWidth={2.5} />}
              {trend === 'down' && <TrendingDown size={12} strokeWidth={2.5} />}
              {trend === 'stable' && <Minus size={12} strokeWidth={2.5} />}
              {trend === 'up' ? 'ارتفاع' : trend === 'down' ? 'انخفاض' : 'ثابت'}
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      {results.length >= 2 ? (
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ direction: 'ltr' }}>
          {/* النطاق الطبيعي */}
          {normalRangeRect && (
            <rect
              x={padX}
              y={normalRangeRect.y}
              width={innerW}
              height={normalRangeRect.height}
              fill="#E1F5EE"
              opacity={0.5}
            />
          )}
          
          {/* Grid lines */}
          <line x1={padX} y1={padY} x2={padX + innerW} y2={padY} stroke="#E5E7EB" strokeWidth={1} strokeDasharray="2,2" />
          <line x1={padX} y1={padY + innerH / 2} x2={padX + innerW} y2={padY + innerH / 2} stroke="#E5E7EB" strokeWidth={1} strokeDasharray="2,2" />
          <line x1={padX} y1={padY + innerH} x2={padX + innerW} y2={padY + innerH} stroke="#E5E7EB" strokeWidth={1} strokeDasharray="2,2" />
          
          {/* Y labels */}
          <text x={padX - 5} y={padY + 4} fontSize="9" fill="#9CA3AF" textAnchor="end">{maxVal.toFixed(0)}</text>
          <text x={padX - 5} y={padY + innerH + 4} fontSize="9" fill="#9CA3AF" textAnchor="end">{minVal.toFixed(0)}</text>
          
          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#0F6E56"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          
          {/* Points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={4}
                fill={STATUS_COLORS[p.status] || '#6B7280'}
                stroke="white"
                strokeWidth={2}
              />
            </g>
          ))}
        </svg>
      ) : (
        <div style={{ 
          padding: 20, 
          textAlign: 'center', 
          color: 'var(--ink-3)',
          background: 'var(--paper-2)',
          borderRadius: 10,
          fontSize: 12,
        }}>
          نتيجة واحدة فقط - يلزم نتيجتان لعرض الاتجاه
        </div>
      )}

      {/* Recent results list */}
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', marginBottom: 6 }}>
          آخر نتائج:
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {results.slice(-3).reverse().map((r, i) => {
            const date = new Date(r.date).toLocaleDateString('ar-IQ', { day: 'numeric', month: 'short' });
            return (
              <div key={i} style={{
                fontSize: 11,
                padding: '4px 10px',
                background: 'var(--paper-2)',
                borderRadius: 8,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}>
                <Calendar size={10} strokeWidth={2.2} aria-hidden />
                <span style={{ color: 'var(--ink-3)' }}>{date}:</span>
                <strong style={{ color: STATUS_COLORS[r.status] || 'var(--ink)' }}>
                  {r.valueText}
                </strong>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
