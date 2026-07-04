'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Trash2, Eye, EyeOff, Copy, X, Save,
  Loader2, Ticket, Users, Clock, CheckCircle2,
} from 'lucide-react';
import { toast } from '@/components/ui/Toaster';
import {
  createBetaCode, toggleBetaCode, deleteBetaCode,
  generateRandomBetaCode, type BetaCodeInput,
} from './actions';

interface BetaCode {
  id: string;
  code: string;
  description: string | null;
  max_uses: number;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

interface Props {
  codes: BetaCode[];
}

export default function BetaCodesClient({ codes }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);

  const stats = {
    total: codes.length,
    active: codes.filter(c => c.is_active).length,
    used: codes.reduce((sum, c) => sum + c.used_count, 0),
    available: codes.reduce((sum, c) => sum + Math.max(0, c.max_uses - c.used_count), 0),
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('تم نسخ الرمز');
  };

  const handleToggle = (c: BetaCode) => {
    startTransition(async () => {
      const r = await toggleBetaCode(c.id, !c.is_active);
      if (r.success) {
        toast.success(c.is_active ? 'تم التعطيل' : 'تم التفعيل');
        router.refresh();
      } else {
        toast.error(r.error || 'فشل');
      }
    });
  };

  const handleDelete = (c: BetaCode) => {
    if (!confirm(`حذف "${c.code}"؟`)) return;
    startTransition(async () => {
      const r = await deleteBetaCode(c.id);
      if (r.success) {
        toast.success('تم الحذف');
        router.refresh();
      } else {
        toast.error(r.error || 'فشل');
      }
    });
  };

  return (
    <div>
      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 10, marginBottom: 16,
      }}>
        <StatCard label="إجمالي الرموز" value={stats.total} color="var(--ink-2)" icon={<Ticket size={16} />} />
        <StatCard label="نشطة" value={stats.active} color="var(--emerald)" icon={<CheckCircle2 size={16} />} />
        <StatCard label="مستخدمة" value={stats.used} color="var(--amber)" icon={<Users size={16} />} />
        <StatCard label="متاحة" value={stats.available} color="var(--emerald)" icon={<Ticket size={16} />} />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          style={{
            padding: '10px 16px', background: 'var(--emerald)', color: 'var(--paper-3)',
            border: 'none', borderRadius: 10, cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 13, fontWeight: 800,
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <Plus size={16} /> رمز جديد
        </button>
      </div>

      {/* List */}
      {codes.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', background: 'var(--white)', borderRadius: 12 }}>
          <Ticket size={42} color="var(--ink-4)" style={{ opacity: 0.5, marginBottom: 10 }} />
          <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>لم تُنشأ رموز بعد</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {codes.map((c) => {
            const usagePct = c.max_uses > 0 ? Math.round((c.used_count / c.max_uses) * 100) : 0;
            const isExhausted = c.used_count >= c.max_uses;
            const isExpired = c.expires_at && new Date(c.expires_at) < new Date();

            return (
              <article
                key={c.id}
                style={{
                  background: 'var(--white)',
                  border: '1px solid var(--line)',
                  borderRadius: 14,
                  padding: 14,
                  opacity: c.is_active && !isExhausted && !isExpired ? 1 : 0.6,
                  borderInlineStartWidth: 4,
                  borderInlineStartStyle: 'solid',
                  borderInlineStartColor: c.is_active && !isExhausted && !isExpired ? 'var(--emerald)' : 'var(--ink-3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 16,
                      fontWeight: 900,
                      fontFamily: 'monospace',
                      color: 'var(--emerald)',
                      letterSpacing: 1,
                    }}>
                      {c.code}
                    </div>
                    {c.description && (
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                        {c.description}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      onClick={() => handleCopy(c.code)}
                      aria-label="نسخ"
                      title="نسخ الرمز"
                      style={iconBtn('var(--paper-3)', 'var(--ink-2)')}
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={() => handleToggle(c)}
                      disabled={isPending}
                      aria-label={c.is_active ? 'تعطيل' : 'تفعيل'}
                      style={iconBtn(c.is_active ? 'var(--amber-soft)' : 'var(--emerald-soft)', c.is_active ? 'var(--amber)' : 'var(--emerald)')}
                    >
                      {c.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
                      disabled={isPending}
                      aria-label="حذف"
                      style={iconBtn('var(--rose-soft)', 'var(--rose)')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Usage bar */}
                <div style={{ marginBottom: 6 }}>
                  <div style={{
                    height: 6,
                    background: 'var(--paper-3)',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${usagePct}%`,
                      background: isExhausted ? 'var(--rose)' : 'var(--emerald)',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 10,
                  color: 'var(--ink-3)',
                }}>
                  <span>
                    {c.used_count} / {c.max_uses} استخدام ({usagePct}%)
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!c.is_active && <span style={{ color: 'var(--amber)' }}>⏸️ مُعطّل</span>}
                    {isExhausted && <span style={{ color: 'var(--rose)' }}>🔴 مُستنفد</span>}
                    {isExpired && <span style={{ color: 'var(--rose)' }}>⏰ منتهي</span>}
                    {c.expires_at && !isExpired && (
                      <span>
                        ينتهي {new Date(c.expires_at).toLocaleDateString('ar-IQ')}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {showModal && (
        <CreateCodeModal
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); router.refresh(); }}
          isPending={isPending}
          startTransition={startTransition}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, color, icon }: {
  label: string; value: number; color: string; icon: React.ReactNode;
}) {
  return (
    <div style={{
      background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 12, padding: 12,
      borderInlineStartWidth: 4, borderInlineStartStyle: 'solid', borderInlineStartColor: color,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color, marginBottom: 6 }}>
        {icon}
        <span style={{ fontSize: 11, fontWeight: 700 }}>{label}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 900 }}>{value.toLocaleString('ar-IQ')}</div>
    </div>
  );
}

function iconBtn(bg: string, color: string): React.CSSProperties {
  return {
    width: 32, height: 32, background: bg, color, border: 'none', borderRadius: 8,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  };
}

function CreateCodeModal({
  onClose, onSaved, isPending, startTransition,
}: {
  onClose: () => void;
  onSaved: () => void;
  isPending: boolean;
  startTransition: React.TransitionStartFunction;
}) {
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [maxUses, setMaxUses] = useState(1);
  const [expiresAt, setExpiresAt] = useState('');

  const handleRandom = async () => {
    const random = await generateRandomBetaCode();
    setCode(random);
  };

  const handleSave = () => {
    if (!code.trim()) {
      toast.error('الرمز مطلوب');
      return;
    }

    startTransition(async () => {
      const result = await createBetaCode({
        code: code.trim(),
        description: description.trim() || null,
        max_uses: maxUses,
        expires_at: expiresAt || null,
      });

      if (result.success) {
        toast.success('تم إنشاء الرمز ✓');
        onSaved();
      } else {
        toast.error(result.error || 'فشل');
      }
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'var(--paper)', width: '100%', maxWidth: 480,
        borderRadius: 14, padding: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0, flex: 1 }}>رمز Beta جديد</h3>
          <button onClick={onClose} aria-label="إغلاق" style={{
            width: 32, height: 32, background: 'var(--paper-3)', border: 'none',
            borderRadius: '50%', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>الرمز *</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="BETA-VIP"
              style={{ ...inputStyle, fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1 }}
              maxLength={30}
            />
            <button
              type="button"
              onClick={handleRandom}
              style={{
                padding: '8px 12px', background: 'var(--emerald)', color: 'var(--paper-3)',
                border: 'none', borderRadius: 8, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 11, fontWeight: 800, flexShrink: 0,
              }}
            >
              عشوائي
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>الوصف</label>
          <input
            type="text" value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="مثلاً: VIP early users"
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>عدد الاستخدامات *</label>
            <input
              type="number" value={maxUses} onChange={(e) => setMaxUses(Math.max(1, parseInt(e.target.value) || 1))}
              min={1} max={10000}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>تاريخ الانتهاء</label>
            <input
              type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: 12, background: 'var(--paper-3)', color: 'var(--ink-2)',
            border: '1px solid var(--line)', borderRadius: 10, cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
          }}>إلغاء</button>
          <button onClick={handleSave} disabled={isPending} style={{
            flex: 2, padding: 12, background: 'var(--emerald)', color: 'var(--paper-3)',
            border: 'none', borderRadius: 10, cursor: isPending ? 'wait' : 'pointer',
            fontFamily: 'inherit', fontSize: 13, fontWeight: 900,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            إنشاء
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: 'var(--ink-3)',
  display: 'block', marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', border: '1px solid var(--line)',
  borderRadius: 8, fontSize: 13, fontFamily: 'inherit', background: 'var(--white)',
};
