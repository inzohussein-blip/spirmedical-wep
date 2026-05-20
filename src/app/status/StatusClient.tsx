'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle2, AlertTriangle, XCircle, RefreshCw,
  Database, Lock, FolderOpen, Loader2, Clock,
} from 'lucide-react';

interface HealthCheck {
  ok: boolean;
  latency_ms?: number;
  error?: string;
}

interface HealthData {
  status: 'healthy' | 'degraded' | 'down';
  version: string;
  timestamp: string;
  uptime_seconds: number;
  checks: {
    database: HealthCheck;
    auth: HealthCheck;
    storage: HealthCheck;
  };
  region?: string;
}

const SERVICE_META = [
  { id: 'database',  name: 'قاعدة البيانات',     icon: Database,    description: 'حفظ واسترجاع البيانات' },
  { id: 'auth',      name: 'تسجيل الدخول',       icon: Lock,        description: 'المصادقة والحسابات' },
  { id: 'storage',   name: 'تخزين الملفات',      icon: FolderOpen,  description: 'الصور والمستندات' },
] as const;

export default function StatusClient() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/monitoring/health', { cache: 'no-store' });
      const json = await res.json();
      setData(json);
      setError(null);
      setLastUpdate(new Date());
    } catch (e) {
      setError('فشل الاتصال - تحقّق من اتصال الإنترنت');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30_000);  // كل 30 ثانية
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Loader2 size={32} className="animate-spin" color="var(--emerald)" />
        <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 12 }}>
          جاري الفحص...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        style={{
          padding: 24,
          background: 'var(--rose-soft)',
          border: '1px solid var(--rose)',
          borderRadius: 12,
          textAlign: 'center',
        }}
      >
        <XCircle size={32} color="var(--rose)" />
        <p style={{ fontSize: 13, fontWeight: 700, marginTop: 8 }}>
          {error || 'لم نتمكّن من جلب البيانات'}
        </p>
        <button
          type="button"
          onClick={fetchStatus}
          style={{
            marginTop: 12,
            padding: '8px 16px',
            background: 'var(--rose)',
            color: 'var(--paper-3)',
            border: 'none',
            borderRadius: 100,
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const overall = {
    healthy:  { label: 'كل الخدمات تعمل', color: 'var(--emerald)', icon: CheckCircle2, bg: 'var(--emerald-soft)' },
    degraded: { label: 'بعض الخدمات بطيئة', color: 'var(--amber)', icon: AlertTriangle, bg: 'var(--amber-soft)' },
    down:     { label: 'هناك مشاكل', color: 'var(--rose)', icon: XCircle, bg: 'var(--rose-soft)' },
  }[data.status];

  const OverallIcon = overall.icon;
  const uptimeHours = Math.floor(data.uptime_seconds / 3600);
  const uptimeDays = Math.floor(uptimeHours / 24);

  return (
    <div>
      {/* Overall status */}
      <div
        style={{
          background: overall.bg,
          border: `2px solid ${overall.color}`,
          borderRadius: 14,
          padding: 18,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <OverallIcon size={36} color={overall.color} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: overall.color }}>
            {overall.label}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
            {data.region && `📍 ${data.region} · `}
            تحديث تلقائي كل 30 ثانية
          </div>
        </div>
        <button
          type="button"
          onClick={fetchStatus}
          aria-label="تحديث الآن"
          style={{
            width: 36,
            height: 36,
            background: 'var(--white)',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <RefreshCw size={16} color={overall.color} />
        </button>
      </div>

      {/* Services list */}
      <h3 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 10px' }}>
        تفاصيل الخدمات
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {SERVICE_META.map((service) => {
          const check = data.checks[service.id as keyof typeof data.checks];
          const Icon = service.icon;
          const isOk = check.ok;
          const color = isOk ? 'var(--emerald)' : 'var(--rose)';

          return (
            <article
              key={service.id}
              style={{
                background: 'var(--white)',
                border: '1px solid var(--line)',
                borderRadius: 12,
                padding: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                borderInlineStartWidth: 4,
                borderInlineStartStyle: 'solid',
                borderInlineStartColor: color,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: `${color}15`,
                  color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={18} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800 }}>{service.name}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                  {service.description}
                </div>
              </div>

              <div style={{ textAlign: 'end', flexShrink: 0 }}>
                {isOk ? (
                  <CheckCircle2 size={20} color="var(--emerald)" />
                ) : (
                  <XCircle size={20} color="var(--rose)" />
                )}
                {check.latency_ms != null && (
                  <div style={{ fontSize: 9, color: 'var(--ink-3)', marginTop: 2 }}>
                    {check.latency_ms}ms
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* Stats */}
      <div
        style={{
          background: 'var(--paper-3)',
          borderRadius: 12,
          padding: 14,
          marginBottom: 16,
        }}
      >
        <h4 style={{ fontSize: 12, fontWeight: 800, margin: '0 0 8px' }}>إحصائيات</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <Stat label="الإصدار" value={data.version} />
          <Stat label="مدّة التشغيل" value={uptimeDays > 0 ? `${uptimeDays} يوم` : `${uptimeHours} ساعة`} />
          <Stat label="آخر فحص" value={lastUpdate ? lastUpdate.toLocaleTimeString('ar-IQ') : '-'} />
        </div>
      </div>

      {/* Info */}
      <div
        style={{
          background: 'var(--emerald-soft)',
          borderRadius: 10,
          padding: 12,
          fontSize: 11,
          color: 'var(--ink-2)',
          lineHeight: 1.7,
        }}
      >
        <strong>💡 معلومة:</strong> هذه الصفحة تفحص حالة الخدمات الأساسية فقط.
        لمراقبة شاملة، نستخدم Vercel Analytics و Supabase Dashboard داخلياً.
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-2)' }}>{value}</div>
    </div>
  );
}
