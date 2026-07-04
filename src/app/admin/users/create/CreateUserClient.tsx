'use client';

/**
 * ═══════════════════════════════════════════════════════════════
 * CreateUserClient — UI لإنشاء حساب جديد من Admin
 * ═══════════════════════════════════════════════════════════════
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  IconArrowRight,
  IconCheck,
  IconCopy,
  IconUser,
  IconStethoscope,
  IconShield,
  IconAlertCircle,
} from '@tabler/icons-react';
import { SPECIALIST_META, type SpecialistType } from '@/lib/specialist-types';

type Role = 'patient' | 'specialist' | 'admin' | 'super_admin' | 'manager' | 'support';

interface Props {
  callerRole: string;
}

interface CreateResult {
  success: boolean;
  user_id?: string;
  phone?: string;
  role?: string;
  temp_password?: string;
  login_url?: string;
  message?: string;
  error?: string;
}

// Iraq governorates
const GOVERNORATES = [
  'بغداد', 'النجف', 'كربلاء', 'بابل', 'الديوانية', 'البصرة',
  'ذي قار', 'ميسان', 'المثنى', 'واسط', 'الأنبار', 'صلاح الدين',
  'نينوى', 'كركوك', 'ديالى', 'أربيل', 'السليمانية', 'دهوك',
];

// أدوار الأدمن
const ADMIN_ROLES: { value: Role; label: string; description: string }[] = [
  { value: 'super_admin', label: '👑 Super Admin', description: 'صلاحيات كاملة' },
  { value: 'admin', label: '🛡️ Admin', description: 'إدارة عامة' },
  { value: 'manager', label: '📊 Manager', description: 'إدارة العمليات' },
  { value: 'support', label: '💬 Support', description: 'دعم العملاء' },
];

export default function CreateUserClient({ callerRole }: Props) {
  const router = useRouter();
  
  // Form state
  const [step, setStep] = useState<'role' | 'details' | 'result'>('role');
  const [role, setRole] = useState<Role | null>(null);
  const [specialistType, setSpecialistType] = useState<SpecialistType | ''>('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [governorate, setGovernorate] = useState('النجف');
  const [bio, setBio] = useState('');
  const [yearsExp, setYearsExp] = useState('');
  
  // Submission state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CreateResult | null>(null);
  const [copied, setCopied] = useState(false);

  const canCreateAdmin = callerRole === 'super_admin';

  // ─── Handlers ─────────────────────────────────────────────

  function selectRole(r: Role) {
    setRole(r);
    setStep('details');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          phone,
          full_name: fullName,
          email: email || undefined,
          governorate,
          specialist_type: role === 'specialist' ? specialistType : undefined,
          specialist_bio: role === 'specialist' ? bio : undefined,
          specialist_years_exp: role === 'specialist' ? Number(yearsExp) || undefined : undefined,
        }),
      });

      const data = (await res.json()) as CreateResult;
      setResult(data);
      setStep('result');
    } catch {
      setResult({ success: false, error: 'فشل الاتصال بالخادم' });
      setStep('result');
    } finally {
      setLoading(false);
    }
  }

  function copyCredentials() {
    if (!result?.temp_password) return;
    const text = `Spir Medical - بيانات الدخول\n━━━━━━━━━━━━━━━━━━━━━━\nرقم الهاتف: ${result.phone}\nكلمة السرّ المؤقّتة: ${result.temp_password}\nرابط الدخول: ${result.login_url}\n━━━━━━━━━━━━━━━━━━━━━━\n⚠️ يرجى تغيير كلمة السرّ بعد أول دخول`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  function resetForm() {
    setStep('role');
    setRole(null);
    setSpecialistType('');
    setPhone('');
    setFullName('');
    setEmail('');
    setGovernorate('النجف');
    setBio('');
    setYearsExp('');
    setResult(null);
  }

  // ─── Render ───────────────────────────────────────────────

  return (
    <main style={{ minHeight: '100vh', background: '#F8F9FA', padding: '20px 14px 80px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <Link
            href="/admin"
            style={{
              width: 38, height: 38, borderRadius: '50%',
              background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              textDecoration: 'none', color: '#202124',
              border: '1px solid #DADCE0',
            }}
          >
            <IconArrowRight size={18} stroke={1.75} style={{ transform: 'scaleX(-1)' }} />
          </Link>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: '#202124', margin: 0 }}>
            إنشاء حساب جديد
          </h1>
        </div>

        {/* Step 1: Role Selection */}
        {step === 'role' && (
          <div>
            <p style={{ fontSize: 14, color: '#5F6368', marginBottom: 16 }}>
              اختر نوع الحساب الذي تريد إنشاءه:
            </p>

            {/* Patient */}
            <button
              type="button"
              onClick={() => selectRole('patient')}
              style={{
                width: '100%', textAlign: 'right',
                padding: 16, marginBottom: 10,
                background: '#fff', border: '1px solid #DADCE0',
                borderRadius: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 12,
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: '#E6F3EF', color: '#01875F',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <IconUser size={24} stroke={1.75} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#202124' }}>مراجع (مريض)</div>
                <div style={{ fontSize: 12, color: '#5F6368', marginTop: 2 }}>
                  حساب لمستخدم عادي يحجز الخدمات
                </div>
              </div>
              <IconArrowRight size={18} stroke={1.75} style={{ transform: 'scaleX(-1)', color: '#9AA0A6' }} />
            </button>

            {/* Specialist */}
            <button
              type="button"
              onClick={() => selectRole('specialist')}
              style={{
                width: '100%', textAlign: 'right',
                padding: 16, marginBottom: 10,
                background: '#fff', border: '1px solid #DADCE0',
                borderRadius: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 12,
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: '#FEF7E0', color: '#B06000',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <IconStethoscope size={24} stroke={1.75} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#202124' }}>مختصّ / مزوّد خدمة</div>
                <div style={{ fontSize: 12, color: '#5F6368', marginTop: 2 }}>
                  طبيب · ممرّض · فني مختبر · صيدلي · إلخ
                </div>
              </div>
              <IconArrowRight size={18} stroke={1.75} style={{ transform: 'scaleX(-1)', color: '#9AA0A6' }} />
            </button>

            {/* Admin (super_admin only) */}
            {canCreateAdmin && (
              <button
                type="button"
                onClick={() => selectRole('admin')}
                style={{
                  width: '100%', textAlign: 'right',
                  padding: 16, marginBottom: 10,
                  background: '#fff', border: '1px solid #DADCE0',
                  borderRadius: 12, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: '#FCE8E6', color: '#C71C56',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <IconShield size={24} stroke={1.75} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#202124' }}>أدمن / إدارة</div>
                  <div style={{ fontSize: 12, color: '#5F6368', marginTop: 2 }}>
                    Super Admin · Manager · Support
                  </div>
                </div>
                <IconArrowRight size={18} stroke={1.75} style={{ transform: 'scaleX(-1)', color: '#9AA0A6' }} />
              </button>
            )}
          </div>
        )}

        {/* Step 2: Details Form */}
        {step === 'details' && role && (
          <form onSubmit={handleSubmit}>
            <div style={{
              background: '#fff', borderRadius: 12,
              padding: 20, border: '1px solid #DADCE0',
            }}>
              {/* If admin role - select specific role */}
              {role === 'admin' && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#202124', display: 'block', marginBottom: 8 }}>
                    نوع الأدمن *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    required
                    style={{
                      width: '100%', padding: 12,
                      border: '1px solid #DADCE0', borderRadius: 8,
                      fontSize: 14, background: '#fff',
                    }}
                  >
                    {ADMIN_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label} — {r.description}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Specialist type */}
              {role === 'specialist' && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#202124', display: 'block', marginBottom: 8 }}>
                    تخصّص المختصّ *
                  </label>
                  <select
                    value={specialistType}
                    onChange={(e) => setSpecialistType(e.target.value as SpecialistType)}
                    required
                    style={{
                      width: '100%', padding: 12,
                      border: '1px solid #DADCE0', borderRadius: 8,
                      fontSize: 14, background: '#fff',
                    }}
                  >
                    <option value="">— اختر التخصّص —</option>
                    {Object.values(SPECIALIST_META).map((meta) => (
                      <option key={meta.type} value={meta.type}>
                        {meta.icon} {meta.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Phone */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#202124', display: 'block', marginBottom: 8 }}>
                  رقم الهاتف *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07XX XXX XXXX"
                  required
                  dir="ltr"
                  style={{
                    width: '100%', padding: 12,
                    border: '1px solid #DADCE0', borderRadius: 8,
                    fontSize: 14, textAlign: 'right',
                  }}
                />
              </div>

              {/* Full Name */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#202124', display: 'block', marginBottom: 8 }}>
                  الاسم الكامل *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: محمد علي حسين"
                  required
                  style={{
                    width: '100%', padding: 12,
                    border: '1px solid #DADCE0', borderRadius: 8,
                    fontSize: 14,
                  }}
                />
              </div>

              {/* Email (optional) */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#202124', display: 'block', marginBottom: 8 }}>
                  البريد الإلكتروني <span style={{ color: '#9AA0A6', fontWeight: 400 }}>(اختياري)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  dir="ltr"
                  style={{
                    width: '100%', padding: 12,
                    border: '1px solid #DADCE0', borderRadius: 8,
                    fontSize: 14, textAlign: 'right',
                  }}
                />
              </div>

              {/* Governorate */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#202124', display: 'block', marginBottom: 8 }}>
                  المحافظة
                </label>
                <select
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  style={{
                    width: '100%', padding: 12,
                    border: '1px solid #DADCE0', borderRadius: 8,
                    fontSize: 14, background: '#fff',
                  }}
                >
                  {GOVERNORATES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Specialist extra fields */}
              {role === 'specialist' && (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#202124', display: 'block', marginBottom: 8 }}>
                      سنوات الخبرة
                    </label>
                    <input
                      type="number"
                      value={yearsExp}
                      onChange={(e) => setYearsExp(e.target.value)}
                      placeholder="5"
                      min="0"
                      max="60"
                      style={{
                        width: '100%', padding: 12,
                        border: '1px solid #DADCE0', borderRadius: 8,
                        fontSize: 14,
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#202124', display: 'block', marginBottom: 8 }}>
                      نبذة عن المختصّ <span style={{ color: '#9AA0A6', fontWeight: 400 }}>(اختياري)</span>
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="خبرة في... · متخصّص في..."
                      rows={3}
                      style={{
                        width: '100%', padding: 12,
                        border: '1px solid #DADCE0', borderRadius: 8,
                        fontSize: 14, resize: 'vertical',
                      }}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setStep('role')}
                style={{
                  flex: 1, padding: '14px 16px',
                  background: '#fff', color: '#5F6368',
                  border: '1px solid #DADCE0', borderRadius: 12,
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                رجوع
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 2, padding: '14px 16px',
                  background: loading ? '#9AA0A6' : '#01875F',
                  color: '#fff',
                  border: 0, borderRadius: 12,
                  fontSize: 14, fontWeight: 600,
                  cursor: loading ? 'wait' : 'pointer',
                }}
              >
                {loading ? '⏳ جاري الإنشاء...' : '✓ إنشاء الحساب'}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Result */}
        {step === 'result' && result && (
          <div>
            {result.success ? (
              <div style={{
                background: '#E6F3EF', borderRadius: 12,
                padding: 20, marginBottom: 16,
                border: '1px solid #01875F',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <IconCheck size={24} stroke={2} color="#01875F" />
                  <h2 style={{ fontSize: 16, fontWeight: 600, color: '#01875F', margin: 0 }}>
                    تم إنشاء الحساب بنجاح!
                  </h2>
                </div>

                <div style={{ background: '#fff', borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 12, color: '#5F6368', marginBottom: 4 }}>رقم الهاتف:</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, fontFamily: 'monospace', direction: 'ltr', textAlign: 'right' }}>
                    {result.phone}
                  </div>

                  <div style={{ fontSize: 12, color: '#5F6368', marginBottom: 4 }}>كلمة السرّ المؤقّتة:</div>
                  <div style={{
                    fontSize: 16, fontWeight: 700,
                    fontFamily: 'monospace', direction: 'ltr', textAlign: 'right',
                    background: '#FEF7E0', padding: 10, borderRadius: 6,
                    marginBottom: 12,
                  }}>
                    {result.temp_password}
                  </div>

                  <div style={{ fontSize: 11, color: '#B06000', marginBottom: 12 }}>
                    ⚠️ احفظ هذه البيانات وأرسلها للمستخدم بطريقة آمنة
                  </div>

                  <button
                    type="button"
                    onClick={copyCredentials}
                    style={{
                      width: '100%', padding: 12,
                      background: copied ? '#01875F' : '#202124',
                      color: '#fff', border: 0, borderRadius: 8,
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    {copied ? (
                      <>
                        <IconCheck size={16} stroke={2} />
                        تم النسخ!
                      </>
                    ) : (
                      <>
                        <IconCopy size={16} stroke={1.75} />
                        نسخ بيانات الدخول
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                background: '#FCE8E6', borderRadius: 12,
                padding: 20, marginBottom: 16,
                border: '1px solid #C71C56',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <IconAlertCircle size={24} stroke={2} color="#C71C56" />
                  <h2 style={{ fontSize: 16, fontWeight: 600, color: '#C71C56', margin: 0 }}>
                    فشل إنشاء الحساب
                  </h2>
                </div>
                <p style={{ fontSize: 14, color: '#202124', margin: 0 }}>
                  {result.error}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={resetForm}
                style={{
                  flex: 1, padding: '14px 16px',
                  background: '#01875F', color: '#fff',
                  border: 0, borderRadius: 12,
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                إنشاء حساب آخر
              </button>
              <Link
                href="/admin/specialists"
                style={{
                  flex: 1, padding: '14px 16px',
                  background: '#fff', color: '#202124',
                  border: '1px solid #DADCE0', borderRadius: 12,
                  fontSize: 14, fontWeight: 600,
                  textDecoration: 'none', textAlign: 'center',
                }}
              >
                عرض المختصّين
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
