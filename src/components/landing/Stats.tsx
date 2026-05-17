'use client';

import { useState, useEffect, useRef } from 'react';

interface Stat {
  value: number;
  suffix: string;
  label: string;
  sublabel?: string;
}

const STATS: Stat[] = [
  { value: 5000, suffix: '+', label: 'مستخدم نشط', sublabel: 'يستخدم التطبيق يومياً' },
  { value: 200, suffix: '+', label: 'طبيب وأخصائي', sublabel: 'في كل التخصصات' },
  { value: 18, suffix: '', label: 'محافظة عراقية', sublabel: 'تغطية شاملة' },
  { value: 4.8, suffix: '/5', label: 'تقييم متوسط', sublabel: '+1,200 تقييم' },
];

function useCountUp(target: number, duration = 2000, start = false): number {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!start) return;

    let frame: number;
    const startTime = performance.now();
    const isDecimal = !Number.isInteger(target);

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      // easeOutQuart
      const eased = 1 - Math.pow(1 - progress, 4);
      const value = target * eased;
      setCurrent(isDecimal ? Math.round(value * 10) / 10 : Math.floor(value));

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      } else {
        setCurrent(target);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, start]);

  return current;
}

function StatCard({ stat, visible }: { stat: Stat; visible: boolean }) {
  const current = useCountUp(stat.value, 2000, visible);
  const isDecimal = !Number.isInteger(stat.value);
  const displayValue = isDecimal ? current.toFixed(1) : current.toLocaleString('ar-IQ');

  return (
    <div className="landing-stat-card">
      <div className="landing-stat-number">
        {displayValue}
        <span className="landing-stat-suffix">{stat.suffix}</span>
      </div>
      <div className="landing-stat-label">{stat.label}</div>
      {stat.sublabel && (
        <div className="landing-stat-sublabel">{stat.sublabel}</div>
      )}
    </div>
  );
}

export default function LandingStats() {
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !visible) {
          setVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [visible]);

  return (
    <section ref={sectionRef} className="landing-stats">
      <div className="landing-wrap">
        <div className="landing-stats-grid">
          {STATS.map((stat, i) => (
            <StatCard key={i} stat={stat} visible={visible} />
          ))}
        </div>
      </div>
    </section>
  );
}
