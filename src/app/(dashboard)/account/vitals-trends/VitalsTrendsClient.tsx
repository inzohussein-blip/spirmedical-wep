'use client';

import { useState } from 'react';
import { Heart, Activity, Thermometer, Wind, Droplets, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface VitalPoint {
  date: string;
  bp_sys?: number;
  bp_dia?: number;
  pulse?: number;
  temp?: number;
  spo2?: number;
  sugar?: number;
}

interface Props {
  vitalPoints: VitalPoint[];
}

const VITAL_RANGES = {
  bp_sys: { min: 90, max: 140, unit: 'mmHg', label: 'الضغط الانقباضي' },
  bp_dia: { min: 60, max: 90, unit: 'mmHg', label: 'الضغط الانبساطي' },
  pulse: { min: 60, max: 100, unit: 'bpm', label: 'النبض' },
  temp: { min: 36.5, max: 37.5, unit: '°C', label: 'الحرارة' },
  spo2: { min: 95, max: 100, unit: '%', label: 'الأكسجين' },
  sugar: { min: 70, max: 140, unit: 'mg/dL', label: 'السكر' },
};

export default function VitalsTrendsClient({ vitalPoints }: Props) {
  return (
    <div style={{ marginTop: 16 }}>
      <VitalChart 
        title="ضغط الدم" 
        icon={Heart}
        color="#A32D2D"
        data={vitalPoints.map(p => ({ date: p.date, value: p.bp_sys }))}
        secondData={vitalPoints.map(p => ({ date: p.date, value: p.bp_dia }))}
        secondLabel="انبساطي"
        unit="mmHg"
        rangeLow={90}
        rangeHigh={140}
      />
      
      <VitalChart 
        title="النبض" 
        icon={Activity}
        color="#0F6E56"
        data={vitalPoints.map(p => ({ date: p.date, value: p.pulse }))}
        unit="bpm"
        rangeLow={60}
        rangeHigh={100}
      />
      
      <VitalChart 
        title="الحرارة" 
        icon={Thermometer}
        color="#A57100"
        data={vitalPoints.map(p => ({ date: p.date, value: p.temp }))}
        unit="°C"
        rangeLow={36.5}
        rangeHigh={37.5}
      />
      
      <VitalChart 
        title="الأكسجين" 
        icon={Wind}
        color="#1D9E75"
        data={vitalPoints.map(p => ({ date: p.date, value: p.spo2 }))}
        unit="%"
        rangeLow={95}
        rangeHigh={100}
      />
      
      <VitalChart 
        title="السكر" 
        icon={Droplets}
        color="#BA7517"
        data={vitalPoints.map(p => ({ date: p.date, value: p.sugar }))}
        unit="mg/dL"
        rangeLow={70}
        rangeHigh={140}
      />
    </div>
  );
}

function VitalChart({
  title,
  
  icon: Icon,
  color,
  data,
  secondData,
  secondLabel,
  unit,
  rangeLow,
  rangeHigh,
}: {
  title: string;
  
  icon: any;
  color: string;
  data: Array<{ date: string; value: number | undefined }>;
  secondData?: Array<{ date: string; value: number | undefined }>;
  secondLabel?: string;
  unit: string;
  rangeLow: number;
  rangeHigh: number;
}) {
  // فلتر القيم الفارغة
  const filtered = data.filter(p => p.value !== undefined && p.value !== null);
  
  if (filtered.length === 0) return null;

  const filteredSecond = (secondData || []).filter(p => p.value !== undefined);

  // الحدود
  const allValues = [...filtered.map(p => p.value!), ...filteredSecond.map(p => p.value!), rangeLow, rangeHigh];
  let minVal = Math.min(...allValues);
  let maxVal = Math.max(...allValues);
  const range = maxVal - minVal;
  const padding = range * 0.15 || 5;
  minVal -= padding;
  maxVal += padding;

  // SVG
  const width = 320;
  const height = 100;
  const padX = 30;
  const padY = 15;
  const innerW = width - 2 * padX;
  const innerH = height - 2 * padY;

  // النطاق الطبيعي
  const lowY = padY + (1 - (rangeLow - minVal) / (maxVal - minVal)) * innerH;
  const highY = padY + (1 - (rangeHigh - minVal) / (maxVal - minVal)) * innerH;

  // نقاط
  const points = filtered.map((p, i) => ({
    x: padX + (i / Math.max(filtered.length - 1, 1)) * innerW,
    y: padY + (1 - (p.value! - minVal) / (maxVal - minVal)) * innerH,
    value: p.value!,
    date: p.date,
  }));

  const secondPoints = filteredSecond.map((p, i) => ({
    x: padX + (i / Math.max(filteredSecond.length - 1, 1)) * innerW,
    y: padY + (1 - (p.value! - minVal) / (maxVal - minVal)) * innerH,
    value: p.value!,
  }));

  // Trend
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (filtered.length >= 2) {
    const last = filtered[filtered.length - 1].value!;
    const prev = filtered[filtered.length - 2].value!;
    const pctDiff = Math.abs((last - prev) / prev);
    if (pctDiff < 0.05) trend = 'stable';
    else trend = last > prev ? 'up' : 'down';
  }

  const lastValue = filtered[filtered.length - 1].value!;
  const isInRange = lastValue >= rangeLow && lastValue <= rangeHigh;

  return (
    <div style={{
      background: 'var(--white)',
      border: '1px solid var(--line)',
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon size={16} strokeWidth={2.2} style={{ color }} aria-hidden />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{title}</div>
            <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>طبيعي: {rangeLow}-{rangeHigh} {unit}</div>
          </div>
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{
            fontSize: 18,
            fontWeight: 800,
            color: isInRange ? '#0F6E56' : '#A57100',
          }}>
            {lastValue} <span style={{ fontSize: 11, fontWeight: 600 }}>{unit}</span>
          </div>
          <div style={{
            fontSize: 10,
            color: trend === 'up' ? '#A57100' : trend === 'down' ? '#0F6E56' : '#6B7280',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            justifyContent: 'flex-end',
          }}>
            {trend === 'up' && <TrendingUp size={10} strokeWidth={2.5} />}
            {trend === 'down' && <TrendingDown size={10} strokeWidth={2.5} />}
            {trend === 'stable' && <Minus size={10} strokeWidth={2.5} />}
            {trend === 'up' ? 'ارتفاع' : trend === 'down' ? 'انخفاض' : 'ثابت'}
          </div>
        </div>
      </div>

      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ direction: 'ltr' }}>
        {/* النطاق الطبيعي */}
        <rect
          x={padX}
          y={highY}
          width={innerW}
          height={lowY - highY}
          fill="#E1F5EE"
          opacity={0.5}
        />
        
        {/* Grid */}
        <line x1={padX} y1={padY} x2={padX + innerW} y2={padY} stroke="#E5E7EB" strokeWidth={1} strokeDasharray="2,2" />
        <line x1={padX} y1={padY + innerH} x2={padX + innerW} y2={padY + innerH} stroke="#E5E7EB" strokeWidth={1} strokeDasharray="2,2" />
        
        {/* Y labels */}
        <text x={padX - 5} y={padY + 4} fontSize="9" fill="#9CA3AF" textAnchor="end">{maxVal.toFixed(0)}</text>
        <text x={padX - 5} y={padY + innerH + 4} fontSize="9" fill="#9CA3AF" textAnchor="end">{minVal.toFixed(0)}</text>
        
        {/* Second data line (للضغط الانبساطي) */}
        {secondPoints.length >= 2 && (
          <>
            <path
              d={secondPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
              strokeOpacity={0.4}
              strokeLinejoin="round"
              strokeDasharray="4,2"
            />
            {secondPoints.map((p, i) => (
              <circle key={`s-${i}`} cx={p.x} cy={p.y} r={3} fill={color} opacity={0.6} stroke="white" strokeWidth={1} />
            ))}
          </>
        )}
        
        {/* Main line */}
        {points.length >= 2 && (
          <path
            d={points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        
        {/* Points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3.5} fill={color} stroke="white" strokeWidth={1.5} />
        ))}
      </svg>
      
      {secondData && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 6, fontSize: 10, color: 'var(--ink-3)' }}>
          <span><span style={{ display: 'inline-block', width: 12, height: 2, background: color, marginLeft: 4 }}></span>انقباضي</span>
          {secondLabel && (
            <span><span style={{ display: 'inline-block', width: 12, height: 2, background: color, opacity: 0.4, marginLeft: 4 }}></span>{secondLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
