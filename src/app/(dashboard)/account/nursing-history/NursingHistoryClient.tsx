'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Syringe, Droplet, Bandage, Stethoscope, Activity, Footprints,
  Calendar, ChevronLeft, Filter, FileText, User, Heart, Thermometer,
  ChevronDown, ChevronUp,
} from 'lucide-react';

interface Visit {
  id: string;
  user_id: string;
  appointment_id: string | null;
  specialist_id: string | null;
  procedure_type: string;
  procedure_details: Record<string, unknown> | null;
  vital_signs: {
    bp?: string;
    pulse?: number;
    temp?: number;
    spo2?: number;
  } | null;
  notes: string | null;
  complications: string | null;
  follow_up_required: boolean;
  performed_at: string;
  created_at: string;
}

interface Specialist {
  id: string;
  full_name: string | null;
}

interface Props {
  visits: Visit[];
  specialistsMap: Record<string, Specialist>;
}

const PROCEDURE_META: Record<string, { label: string; icon: typeof Syringe; color: string }> = {
  injection:     { label: 'زرق إبر',           icon: Syringe,     color: '#0F6B58' },
  iv:            { label: 'تركيب مغذٍ وريدي',   icon: Droplet,     color: '#1E88E5' },
  cannula:       { label: 'تركيب كانيولا',     icon: Activity,    color: '#7E57C2' },
  wound_care:    { label: 'تضميد جروح',        icon: Bandage,     color: '#E67E22' },
  diabetic_foot: { label: 'القدم السكري',      icon: Footprints,  color: '#D32F2F' },
  catheter:      { label: 'قسطرة بولية',       icon: Stethoscope, color: '#5C6BC0' },
  vaccination:   { label: 'تطعيمات',           icon: Syringe,     color: '#26A69A' },
};

export default function NursingHistoryClient({ visits, specialistsMap }: Props) {
  const [filter, setFilter] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredVisits = filter
    ? visits.filter(v => v.procedure_type === filter)
    : visits;

  const procedureCounts = visits.reduce((acc, v) => {
    acc[v.procedure_type] = (acc[v.procedure_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 16, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Link
          href="/account"
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'var(--paper-3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            color: 'var(--ink-2)',
          }}
        >
          <ChevronLeft size={20} />
        </Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>
            سجل التمريض
          </h1>
          <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: '2px 0 0' }}>
            تاريخك الطبي مع خدمة التمريض
          </p>
        </div>
      </div>

      {/* Stats */}
      {visits.length > 0 && (
        <div style={{
          background: 'var(--emerald-soft)',
          borderRadius: 14,
          padding: 16,
          marginBottom: 16,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--emerald-deep)' }}>
            {visits.length}
          </div>
          <div style={{ fontSize: 12, color: 'var(--emerald-deep)', fontWeight: 700 }}>
            {visits.length === 1 ? 'زيارة' : 'زيارة تمريضية'}
          </div>
        </div>
      )}

      {/* Filters */}
      {Object.keys(procedureCounts).length > 1 && (
        <div style={{
          display: 'flex',
          gap: 6,
          marginBottom: 16,
          overflowX: 'auto',
          paddingBottom: 4,
        }}>
          <button
            type="button"
            onClick={() => setFilter('')}
            style={{
              padding: '6px 12px',
              background: !filter ? 'var(--emerald)' : 'var(--white)',
              color: !filter ? 'var(--paper-3)' : 'var(--ink-2)',
              border: '1px solid',
              borderColor: !filter ? 'var(--emerald)' : 'var(--line)',
              borderRadius: 100,
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            الكل ({visits.length})
          </button>
          {Object.entries(procedureCounts).map(([type, count]) => {
            const meta = PROCEDURE_META[type];
            if (!meta) return null;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setFilter(type)}
                style={{
                  padding: '6px 12px',
                  background: filter === type ? meta.color : 'var(--white)',
                  color: filter === type ? 'var(--paper-3)' : 'var(--ink-2)',
                  border: '1px solid',
                  borderColor: filter === type ? meta.color : 'var(--line)',
                  borderRadius: 100,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {meta.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Visits list */}
      {filteredVisits.length === 0 ? (
        <div style={{
          background: 'var(--white)',
          padding: 40,
          borderRadius: 14,
          textAlign: 'center',
          border: '1px solid var(--line)',
        }}>
          <Syringe size={48} color="var(--ink-3)" style={{ marginBottom: 8 }} />
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px' }}>
            لا توجد زيارات حتى الآن
          </h3>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '0 0 16px' }}>
            ستظهر هنا بعد أول زيارة تمريضية
          </p>
          <Link
            href="/appointments/new?service=home-nursing"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              background: 'var(--emerald)',
              color: 'var(--paper-3)',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 800,
              textDecoration: 'none',
            }}
          >
            احجز خدمة تمريضية
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredVisits.map((visit) => {
            const meta = PROCEDURE_META[visit.procedure_type];
            const Icon = meta?.icon || Syringe;
            const specialist = visit.specialist_id ? specialistsMap[visit.specialist_id] : null;
            const isExpanded = expandedId === visit.id;
            const date = new Date(visit.performed_at);

            return (
              <div
                key={visit.id}
                style={{
                  background: 'var(--white)',
                  borderRadius: 14,
                  border: '1px solid var(--line)',
                  overflow: 'hidden',
                }}
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : visit.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    width: '100%',
                    padding: 14,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'start',
                  }}
                >
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: `${meta?.color || 'var(--emerald)'}15`,
                    color: meta?.color || 'var(--emerald)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={22} strokeWidth={2.2} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>
                      {meta?.label || visit.procedure_type}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={11} />
                      <span>{date.toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      <span>·</span>
                      <span>{date.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {isExpanded && (
                  <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--line)', paddingTop: 12 }}>
                    {/* Specialist */}
                    {specialist && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 10,
                        padding: 10,
                        background: 'var(--paper-3)',
                        borderRadius: 10,
                      }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: 'var(--emerald-soft)',
                          color: 'var(--emerald)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <User size={14} />
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>
                          {specialist.full_name || 'الكادر التمريضي'}
                        </div>
                      </div>
                    )}

                    {/* Vital signs */}
                    {visit.vital_signs && Object.keys(visit.vital_signs).length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <h4 style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-3)', margin: '0 0 6px' }}>
                          المؤشرات الحيوية
                        </h4>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
                          gap: 6,
                        }}>
                          {visit.vital_signs.bp && (
                            <VitalCard icon={<Heart size={14} />} label="الضغط" value={visit.vital_signs.bp} />
                          )}
                          {visit.vital_signs.pulse && (
                            <VitalCard icon={<Activity size={14} />} label="النبض" value={`${visit.vital_signs.pulse}`} />
                          )}
                          {visit.vital_signs.temp && (
                            <VitalCard icon={<Thermometer size={14} />} label="الحرارة" value={`${visit.vital_signs.temp}°`} />
                          )}
                          {visit.vital_signs.spo2 && (
                            <VitalCard icon={<Droplet size={14} />} label="SpO₂" value={`${visit.vital_signs.spo2}%`} />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {visit.notes && (
                      <div style={{ marginBottom: 10 }}>
                        <h4 style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-3)', margin: '0 0 4px' }}>
                          ملاحظات
                        </h4>
                        <div style={{
                          padding: 10,
                          background: 'var(--paper-3)',
                          borderRadius: 8,
                          fontSize: 12,
                          color: 'var(--ink-2)',
                          lineHeight: 1.6,
                        }}>
                          {visit.notes}
                        </div>
                      </div>
                    )}

                    {/* Complications */}
                    {visit.complications && (
                      <div style={{ marginBottom: 10 }}>
                        <h4 style={{ fontSize: 11, fontWeight: 800, color: 'var(--rose)', margin: '0 0 4px' }}>
                          ⚠️ مضاعفات
                        </h4>
                        <div style={{
                          padding: 10,
                          background: 'var(--rose-soft)',
                          color: 'var(--rose)',
                          borderRadius: 8,
                          fontSize: 12,
                          lineHeight: 1.6,
                        }}>
                          {visit.complications}
                        </div>
                      </div>
                    )}

                    {visit.follow_up_required && (
                      <div style={{
                        padding: 10,
                        background: 'var(--amber-soft)',
                        color: 'var(--amber)',
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 700,
                        textAlign: 'center',
                      }}>
                        🔔 مطلوب متابعة لاحقة
                      </div>
                    )}
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

function VitalCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{
      padding: 8,
      background: 'var(--paper-3)',
      borderRadius: 8,
      textAlign: 'center',
    }}>
      <div style={{ color: 'var(--emerald)', display: 'flex', justifyContent: 'center', marginBottom: 2 }}>
        {icon}
      </div>
      <div style={{ fontSize: 9, color: 'var(--ink-3)', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 900 }}>{value}</div>
    </div>
  );
}
