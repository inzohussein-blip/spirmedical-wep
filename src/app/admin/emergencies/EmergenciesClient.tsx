'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle, MapPin, Phone, Clock, CheckCircle2, Loader2,
  XCircle, Eye, User,
} from 'lucide-react';
import { toast } from '@/components/ui/Toaster';

interface Emergency {
  id: string;
  specialist_id: string;
  appointment_id: string | null;
  trigger_reason: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracy_m: number | null;
  status: 'open' | 'responding' | 'resolved' | 'false_alarm';
  contacted_911: boolean;
  call_center_notified: boolean;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
}

interface Specialist {
  id: string;
  full_name: string | null;
  phone: string | null;
}

interface Props {
  emergencies: Emergency[];
  specialistsMap: Record<string, Specialist>;
  currentFilter?: string;
}

const REASON_LABELS: Record<string, { label: string; emoji: string }> = {
  attack: { label: 'اعتداء جسدي', emoji: '🚨' },
  threat: { label: 'تهديد', emoji: '⚠️' },
  harassment: { label: 'مضايقة', emoji: '😨' },
  medical: { label: 'حالة طبية طارئة', emoji: '🏥' },
  other: { label: 'أخرى', emoji: '❓' },
};

const STATUS_CONFIG: Record<Emergency['status'], { label: string; color: string; bg: string }> = {
  open: { label: 'مفتوحة', color: '#fff', bg: 'var(--rose)' },
  responding: { label: 'يُستجاب لها', color: '#fff', bg: 'var(--amber)' },
  resolved: { label: 'تم الحل', color: '#fff', bg: 'var(--emerald)' },
  false_alarm: { label: 'إنذار كاذب', color: '#fff', bg: 'var(--ink-3)' },
};

export default function EmergenciesClient({
  emergencies,
  specialistsMap,
  currentFilter,
}: Props) {
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const updateStatus = async (id: string, status: Emergency['status']) => {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/admin/emergency-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });

      if (res.ok) {
        toast.success('تم التحديث');
        router.refresh();
      } else {
        toast.error('فشل التحديث');
      }
    } catch {
      toast.error('خطأ في الاتصال');
    } finally {
      setUpdatingId(null);
    }
  };

  const filters: Array<{ id: string; label: string; count: number }> = [
    { id: '', label: 'الكل', count: emergencies.length },
    { id: 'open', label: 'مفتوحة', count: emergencies.filter(e => e.status === 'open').length },
    { id: 'responding', label: 'يُستجاب لها', count: emergencies.filter(e => e.status === 'responding').length },
    { id: 'resolved', label: 'محلولة', count: emergencies.filter(e => e.status === 'resolved').length },
  ];

  return (
    <div>
      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 16,
        overflowX: 'auto',
        paddingBottom: 4,
      }}>
        {filters.map(f => (
          <Link
            key={f.id}
            href={f.id ? `/admin/emergencies?status=${f.id}` : '/admin/emergencies'}
            style={{
              padding: '8px 14px',
              background: (currentFilter || '') === f.id ? 'var(--emerald)' : 'var(--white)',
              color: (currentFilter || '') === f.id ? 'var(--paper-3)' : 'var(--ink-2)',
              border: '1px solid',
              borderColor: (currentFilter || '') === f.id ? 'var(--emerald)' : 'var(--line)',
              borderRadius: 100,
              fontSize: 12,
              fontWeight: 700,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {f.label} ({f.count})
          </Link>
        ))}
      </div>

      {/* List */}
      {emergencies.length === 0 ? (
        <div style={{
          background: 'var(--white)',
          padding: 40,
          borderRadius: 14,
          textAlign: 'center',
          border: '1px solid var(--line)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>✨</div>
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px' }}>
            لا توجد حالات طوارئ
          </h3>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: 0 }}>
            الكل بأمان والحمد لله
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {emergencies.map(e => {
            const specialist = specialistsMap[e.specialist_id];
            const reason = e.trigger_reason ? REASON_LABELS[e.trigger_reason] : null;
            const statusCfg = STATUS_CONFIG[e.status];
            const timeAgo = getTimeAgo(e.created_at);

            return (
              <div
                key={e.id}
                style={{
                  background: 'var(--white)',
                  border: '1px solid',
                  borderColor: e.status === 'open' ? 'var(--rose)' : 'var(--line)',
                  borderRadius: 14,
                  padding: 16,
                  position: 'relative',
                }}
              >
                {/* Status badge */}
                <div style={{
                  position: 'absolute',
                  top: 12,
                  insetInlineEnd: 12,
                  padding: '4px 10px',
                  background: statusCfg.bg,
                  color: statusCfg.color,
                  borderRadius: 100,
                  fontSize: 10,
                  fontWeight: 800,
                }}>
                  {statusCfg.label}
                </div>

                {/* Specialist info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'var(--emerald-soft)',
                    color: 'var(--emerald)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <User size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800 }}>
                      {specialist?.full_name || 'ممرض غير معروف'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={11} />
                      <span>{timeAgo}</span>
                      {specialist?.phone && (
                        <>
                          <span>·</span>
                          <a href={`tel:${specialist.phone}`} style={{ color: 'var(--emerald)', textDecoration: 'none' }}>
                            {specialist.phone}
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reason + Description */}
                {reason && (
                  <div style={{
                    background: 'var(--rose-soft)',
                    padding: '10px 12px',
                    borderRadius: 10,
                    marginBottom: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                    <span style={{ fontSize: 20 }}>{reason.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--rose)' }}>
                        {reason.label}
                      </div>
                      {e.description && (
                        <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>
                          {e.description}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* GPS */}
                {e.latitude && e.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${e.latitude},${e.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 12px',
                      background: 'var(--paper-3)',
                      borderRadius: 8,
                      fontSize: 11,
                      color: 'var(--emerald)',
                      textDecoration: 'none',
                      fontWeight: 700,
                      marginBottom: 10,
                    }}
                  >
                    <MapPin size={14} />
                    <span>
                      {e.latitude.toFixed(5)}, {e.longitude.toFixed(5)}
                      {e.accuracy_m && ` (دقة ${Math.round(e.accuracy_m)}م)`}
                    </span>
                    <span style={{ marginInlineStart: 'auto', fontSize: 10 }}>← Maps</span>
                  </a>
                )}

                {/* Actions */}
                {e.status === 'open' && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    {specialist?.phone && (
                      <a
                        href={`tel:${specialist.phone}`}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: 'var(--emerald)',
                          color: 'var(--paper-3)',
                          textDecoration: 'none',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 800,
                          textAlign: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                        }}
                      >
                        <Phone size={14} />
                        اتصال
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => updateStatus(e.id, 'responding')}
                      disabled={updatingId === e.id}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: 'var(--amber)',
                        color: 'var(--paper-3)',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      {updatingId === e.id ? '...' : 'تحت المعالجة'}
                    </button>
                  </div>
                )}

                {e.status === 'responding' && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <button
                      type="button"
                      onClick={() => updateStatus(e.id, 'resolved')}
                      disabled={updatingId === e.id}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: 'var(--emerald)',
                        color: 'var(--paper-3)',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      <CheckCircle2 size={14} style={{ display: 'inline', verticalAlign: -2, marginInlineEnd: 4 }} />
                      تم الحل
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatus(e.id, 'false_alarm')}
                      disabled={updatingId === e.id}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: 'var(--ink-3)',
                        color: 'var(--paper-3)',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      <XCircle size={14} style={{ display: 'inline', verticalAlign: -2, marginInlineEnd: 4 }} />
                      إنذار كاذب
                    </button>
                  </div>
                )}

                {e.resolution_notes && (
                  <div style={{
                    marginTop: 8,
                    padding: 10,
                    background: 'var(--emerald-soft)',
                    borderRadius: 8,
                    fontSize: 11,
                    color: 'var(--emerald-deep)',
                  }}>
                    <strong>ملاحظات الحل:</strong> {e.resolution_notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getTimeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'الآن';
  if (minutes < 60) return `قبل ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `قبل ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return `قبل ${days} يوم`;
}
