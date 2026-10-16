'use client';

/**
 * ═══════════════════════════════════════════════════════════════
 * CreateUserClient — إنشاءُ حسابٍ من الإدارة، وتسليمُه عبر واتساب
 * ═══════════════════════════════════════════════════════════════
 *
 * - الخطأ يبقى في النموذج (كان ينقل إلى شاشة «فشل» تمحو الحقول كلّها).
 * - المريضُ والمختصّ يدخلان بالرقم + رمز الدخول؛ الإدارةُ بالبريد.
 * - بعد الإنشاء زرُّ واتساب من هاتف المدير: رابطُ تفعيلٍ يختار به صاحبُ الحساب رمزَه
 *   (حين يعمل التحقّقُ العكسيّ)، أو الرمزُ المؤقّت احتياطاً.
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  IconArrowRight,
  IconBrandWhatsapp,
  IconCheck,
  IconCopy,
  IconUser,
  IconStethoscope,
  IconShield,
  IconAlertCircle,
} from '@tabler/icons-react';
import { SPECIALIST_META, type SpecialistType } from '@/lib/specialist-types';
import { activationMessage, credentialsMessage, displayPhone, waChatLink } from '@/lib/whatsapp/share';

type Role = 'patient' | 'specialist' | 'admin' | 'super_admin' | 'manager' | 'support';
type Kind = 'patient' | 'specialist' | 'staff';

interface Props {
  callerRole: string;
}

interface CreateResult {
  success: boolean;
  user_id?: string;
  phone?: string;
  full_name?: string;
  role?: Role;
  login_method?: 'phone_pin' | 'email_password';
  email?: string;
  temp_pin?: string;
  temp_password?: string;
  login_url?: string;
  activation_url?: string;
  warning?: string;
  error?: string;
  existing_user_id?: string;
  existing_role?: string;
}

const GOVERNORATES = [
  'بغداد', 'النجف', 'كربلاء', 'بابل', 'الديوانية', 'البصرة',
  'ذي قار', 'ميسان', 'المثنى', 'واسط', 'الأنبار', 'صلاح الدين',
  'نينوى', 'كركوك', 'ديالى', 'أربيل', 'السليمانية', 'دهوك',
];

const STAFF_ROLES: { value: Role; label: string; description: string; superOnly: boolean }[] = [
  { value: 'super_admin', label: '👑 مدير عام', description: 'صلاحيات كاملة', superOnly: true },
  { value: 'admin', label: '🛡️ مدير', description: 'إدارة عامة', superOnly: true },
  { value: 'manager', label: '📊 مشرف', description: 'إدارة العمليات', superOnly: false },
  { value: 'support', label: '💬 دعم', description: 'دعم العملاء', superOnly: false },
];

const PHONE_RE = /^07\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CreateUserClient({ callerRole }: Props) {
  const [kind, setKind] = useState<Kind | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [specialistType, setSpecialistType] = useState<SpecialistType | ''>('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [governorate, setGovernorate] = useState('النجف');
  const [bio, setBio] = useState('');
  const [yearsExp, setYearsExp] = useState('');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<CreateResult | null>(null);
  const [result, setResult] = useState<CreateResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const isSuper = callerRole === 'super_admin';
  const staffRoles = STAFF_ROLES.filter((r) => isSuper || !r.superOnly);
  const phoneLogin = role === 'patient' || role === 'specialist';

  function choose(k: Kind) {
    setKind(k);
    setRole(k === 'staff' ? staffRoles[0].value : k);
    setErrors({});
    setFailure(null);
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!PHONE_RE.test(phone)) e.phone = 'رقمٌ عراقيّ من 11 خانة يبدأ بـ07';
    if (fullName.trim().length < 2) e.fullName = 'الاسم الكامل مطلوب';
    if (role === 'specialist' && !specialistType) e.specialistType = 'اختر التخصّص';
    if (!phoneLogin && !EMAIL_RE.test(email.trim())) e.email = 'بريدُ الدخول مطلوب لحساب الإدارة';
    if (phoneLogin && email.trim() && !EMAIL_RE.test(email.trim())) e.email = 'البريد غير صالح';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!role || loading || !validate()) return;
    setLoading(true);
    setFailure(null);
    try {
      const res = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          phone,
          full_name: fullName.trim(),
          email: email.trim() || undefined,
          governorate,
          specialist_type: role === 'specialist' ? specialistType : undefined,
          specialist_bio: role === 'specialist' ? bio.trim() || undefined : undefined,
          specialist_years_exp: role === 'specialist' ? Number(yearsExp) || undefined : undefined,
        }),
      });
      const data = (await res.json()) as CreateResult;
      if (data.success) setResult(data);
      else setFailure(data); // يبقى النموذجُ كما هو — يُصحَّح الحقلُ ويُعاد الإرسال
    } catch {
      setFailure({ success: false, error: 'تعذّر الاتصال بالخادم — تحقّق من الإنترنت وحاول مجدّداً' });
    } finally {
      setLoading(false);
    }
  }

  function copy(label: string, text: string) {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(label);
        setTimeout(() => setCopied(null), 2500);
      },
      () => setCopied(null),
    );
  }

  function resetForm() {
    setKind(null);
    setRole(null);
    setSpecialistType('');
    setPhone('');
    setFullName('');
    setEmail('');
    setGovernorate('النجف');
    setBio('');
    setYearsExp('');
    setErrors({});
    setFailure(null);
    setResult(null);
  }

  const profileHref = (id: string, r?: string) =>
    r === 'specialist' ? `/admin/specialists/${id}` : r === 'patient' ? `/admin/patients/${id}` : '/admin/admins';

  return (
    <main style={{ minHeight: '100vh', background: '#F8F9FA', padding: '20px 14px 80px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <Link href="/admin" aria-label="رجوع إلى لوحة التحكم" style={backBtn}>
            <IconArrowRight size={18} stroke={1.75} />
          </Link>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#202124', margin: 0 }}>إنشاء حساب جديد</h1>
        </div>

        {/* ─── ١. نوع الحساب ─── */}
        {!result && !kind && (
          <div>
            <p style={{ fontSize: 14, color: '#5F6368', marginBottom: 16 }}>اختر نوع الحساب:</p>
            <KindCard
              onClick={() => choose('specialist')}
              icon={<IconStethoscope size={24} stroke={1.75} />}
              tint="#FEF7E0"
              color="var(--amber, #B06000)"
              title="مختصّ / مزوّد خدمة"
              subtitle="طبيب · ممرّض · محلّل مختبر · صيدلي… يدخل برقمه ورمز الدخول"
            />
            <KindCard
              onClick={() => choose('patient')}
              icon={<IconUser size={24} stroke={1.75} />}
              tint="var(--emerald-soft, #E6F3EF)"
              color="var(--emerald, #01875F)"
              title="مراجع (مريض)"
              subtitle="حساب لمستخدمٍ يحجز الخدمات — يدخل برقمه ورمز الدخول"
            />
            {staffRoles.length > 0 && (
              <KindCard
                onClick={() => choose('staff')}
                icon={<IconShield size={24} stroke={1.75} />}
                tint="#FCE8E6"
                color="var(--rose, #C71C56)"
                title="فريق الإدارة"
                subtitle={staffRoles.map((r) => r.label.replace(/^\S+ /, '')).join(' · ') + ' — يدخل بالبريد'}
              />
            )}
          </div>
        )}

        {/* ─── ٢. البيانات ─── */}
        {!result && kind && role && (
          <form onSubmit={handleSubmit} noValidate>
            {failure && (
              <div role="alert" style={alertBox}>
                <IconAlertCircle size={20} stroke={2} style={{ flexShrink: 0, color: 'var(--rose, #C71C56)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#202124' }}>{failure.error}</div>
                  {failure.existing_user_id && (
                    <Link href={profileHref(failure.existing_user_id, failure.existing_role)} style={{ fontSize: 13, color: 'var(--emerald, #01875F)', fontWeight: 700 }}>
                      فتح الحساب القائم ←
                    </Link>
                  )}
                </div>
              </div>
            )}

            <div style={card}>
              {kind === 'staff' && (
                <Field label="الدور *" htmlFor="staffRole">
                  <select id="staffRole" value={role} onChange={(e) => setRole(e.target.value as Role)} style={input}>
                    {staffRoles.map((r) => (
                      <option key={r.value} value={r.value}>{r.label} — {r.description}</option>
                    ))}
                  </select>
                </Field>
              )}

              {role === 'specialist' && (
                <Field label="التخصّص *" htmlFor="specialistType" error={errors.specialistType}>
                  <select
                    id="specialistType"
                    value={specialistType}
                    onChange={(e) => setSpecialistType(e.target.value as SpecialistType)}
                    style={input}
                    aria-invalid={!!errors.specialistType}
                  >
                    <option value="">— اختر التخصّص —</option>
                    {Object.values(SPECIALIST_META).map((meta) => (
                      <option key={meta.type} value={meta.type}>{meta.icon} {meta.label}</option>
                    ))}
                  </select>
                </Field>
              )}

              <Field label="الاسم الكامل *" htmlFor="fullName" error={errors.fullName}>
                <input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: محمد علي حسين" autoComplete="off" style={input} aria-invalid={!!errors.fullName} />
              </Field>

              <Field
                label="رقم الهاتف *"
                htmlFor="phone"
                error={errors.phone}
                hint={phoneLogin ? 'رقمُ واتساب صاحب الحساب — به يدخل وإليه تُرسل بيانات الدخول' : undefined}
              >
                <input id="phone" type="tel" inputMode="numeric" dir="ltr" value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  placeholder="07XXXXXXXXX" style={{ ...input, textAlign: 'right' }} aria-invalid={!!errors.phone} />
              </Field>

              <Field
                label={phoneLogin ? 'البريد الإلكتروني (اختياري)' : 'بريد الدخول *'}
                htmlFor="email"
                error={errors.email}
                hint={phoneLogin ? 'للمراسلة فقط — الدخولُ بالرقم ورمز الدخول' : 'به يدخل إلى لوحة الإدارة'}
              >
                <input id="email" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com" style={{ ...input, textAlign: 'right' }} aria-invalid={!!errors.email} />
              </Field>

              <Field label="المحافظة" htmlFor="governorate">
                <select id="governorate" value={governorate} onChange={(e) => setGovernorate(e.target.value)} style={input}>
                  {GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>

              {role === 'specialist' && (
                <>
                  <Field label="سنوات الخبرة" htmlFor="yearsExp">
                    <input id="yearsExp" type="number" inputMode="numeric" min={0} max={60} value={yearsExp}
                      onChange={(e) => setYearsExp(e.target.value)} placeholder="5" style={input} />
                  </Field>
                  <Field label="نبذة (اختياري)" htmlFor="bio">
                    <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
                      placeholder="خبرة في… · متخصّص في…" style={{ ...input, resize: 'vertical' }} />
                  </Field>
                  <p style={{ fontSize: 12, color: '#5F6368', margin: 0, lineHeight: 1.7 }}>
                    يُعتمد المختصّ فوراً لأنّ الإدارة أنشأته — ويظهر لطلبات نوعه مباشرة.
                  </p>
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button type="button" onClick={() => { setKind(null); setRole(null); setFailure(null); }} style={secondaryBtn}>
                رجوع
              </button>
              <button type="submit" disabled={loading} style={{ ...primaryBtn, flex: 2, opacity: loading ? 0.7 : 1, cursor: loading ? 'wait' : 'pointer' }}>
                {loading ? '⏳ جارٍ الإنشاء…' : '✓ إنشاء الحساب'}
              </button>
            </div>
          </form>
        )}

        {/* ─── ٣. النتيجة والتسليم ─── */}
        {result && <ResultCard result={result} copied={copied} copy={copy} />}

        {result && (
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button type="button" onClick={resetForm} style={{ ...primaryBtn, flex: 1 }}>إنشاء حساب آخر</button>
            {result.user_id && (
              <Link href={profileHref(result.user_id, result.role)} style={{ ...secondaryBtn, textAlign: 'center', textDecoration: 'none' }}>
                فتح الحساب
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function ResultCard({
  result,
  copied,
  copy,
}: {
  result: CreateResult;
  copied: string | null;
  copy: (label: string, text: string) => void;
}) {
  const name = result.full_name ?? '';
  const phone = result.phone ?? '';
  const phoneLogin = result.login_method === 'phone_pin';

  const activationLink = result.activation_url
    ? waChatLink(phone, activationMessage({ name, role: result.role ?? '', url: result.activation_url }))
    : null;
  const credentialsLink = result.temp_pin
    ? waChatLink(phone, credentialsMessage({ name, role: result.role ?? '', phone, pin: result.temp_pin, loginUrl: result.login_url ?? '' }))
    : null;

  return (
    <div style={{ ...card, border: '1px solid var(--emerald, #01875F)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <IconCheck size={24} stroke={2} color="#01875F" />
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--emerald, #01875F)', margin: 0 }}>
          أُنشئ حساب {name}
        </h2>
      </div>

      {result.warning && <div role="alert" style={{ ...alertBox, marginBottom: 12 }}>{result.warning}</div>}

      {phoneLogin ? (
        <>
          <Row label="الدخول">الرقم <bdi dir="ltr">{displayPhone(phone)}</bdi> + رمز الدخول</Row>

          <div style={{ fontSize: 13, fontWeight: 700, color: '#202124', margin: '14px 0 8px' }}>
            أرسل له بيانات الدخول عبر واتساب:
          </div>
          {activationLink && (
            <>
              <a href={activationLink} target="_blank" rel="noopener noreferrer" style={waBtn} data-testid="wa-activation">
                <IconBrandWhatsapp size={20} stroke={1.75} />
                إرسال رابط التفعيل (موصى به)
              </a>
              <p style={{ fontSize: 12, color: '#5F6368', margin: '6px 0 12px', lineHeight: 1.7 }}>
                يفتح الرابطَ ويؤكّد رقمه برسالة واتساب ويختار رمزه بنفسه — لا يمرّ الرمزُ في المحادثة.
              </p>
            </>
          )}
          {credentialsLink && (
            <a href={credentialsLink} target="_blank" rel="noopener noreferrer"
              style={activationLink ? waBtnSecondary : waBtn} data-testid="wa-credentials">
              <IconBrandWhatsapp size={20} stroke={1.75} />
              {activationLink ? 'أو أرسل الرمز المؤقّت' : 'إرسال بيانات الدخول'}
            </a>
          )}

          {result.temp_pin && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, color: '#5F6368', marginBottom: 4 }}>رمز الدخول المؤقّت (يظهر مرّةً واحدة):</div>
              <div style={secretBox} dir="ltr">{result.temp_pin}</div>
              <button type="button" onClick={() => copy('pin', result.temp_pin!)} style={copyBtn}>
                {copied === 'pin' ? <><IconCheck size={16} stroke={2} /> نُسخ</> : <><IconCopy size={16} stroke={1.75} /> نسخ الرمز</>}
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <Row label="بريد الدخول"><bdi dir="ltr">{result.email}</bdi></Row>
          <div style={{ fontSize: 12, color: '#5F6368', margin: '12px 0 4px' }}>كلمة السرّ المؤقّتة (تظهر مرّةً واحدة):</div>
          <div style={secretBox} dir="ltr">{result.temp_password}</div>
          <button
            type="button"
            onClick={() => copy('cred', `سباير ميديكال — لوحة الإدارة\nالبريد: ${result.email}\nكلمة السرّ المؤقّتة: ${result.temp_password}\nالدخول: ${result.login_url}`)}
            style={copyBtn}
          >
            {copied === 'cred' ? <><IconCheck size={16} stroke={2} /> نُسخت</> : <><IconCopy size={16} stroke={1.75} /> نسخ بيانات الدخول</>}
          </button>
        </>
      )}
    </div>
  );
}

function KindCard(props: { onClick: () => void; icon: React.ReactNode; tint: string; color: string; title: string; subtitle: string }) {
  return (
    <button type="button" onClick={props.onClick} style={kindCard}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: props.tint, color: props.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {props.icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#202124' }}>{props.title}</div>
        <div style={{ fontSize: 12, color: '#5F6368', marginTop: 2, lineHeight: 1.6 }}>{props.subtitle}</div>
      </div>
      <IconArrowRight size={18} stroke={1.75} style={{ transform: 'scaleX(-1)', color: '#9AA0A6' }} />
    </button>
  );
}

function Field(props: { label: string; htmlFor: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor={props.htmlFor} style={{ fontSize: 13, fontWeight: 700, color: '#202124', display: 'block', marginBottom: 8 }}>
        {props.label}
      </label>
      {props.children}
      {props.hint && !props.error && <div style={{ fontSize: 12, color: '#5F6368', marginTop: 6 }}>{props.hint}</div>}
      {props.error && <div role="alert" style={{ fontSize: 12, color: 'var(--rose, #C71C56)', marginTop: 6, fontWeight: 600 }}>{props.error}</div>}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14, padding: '6px 0' }}>
      <span style={{ color: '#5F6368' }}>{label}</span>
      <span style={{ fontWeight: 700, color: '#202124' }}>{children}</span>
    </div>
  );
}

const card: React.CSSProperties = { background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #DADCE0' };
const input: React.CSSProperties = { width: '100%', padding: 12, border: '1px solid #DADCE0', borderRadius: 8, fontSize: 16, background: '#fff' };
const backBtn: React.CSSProperties = { width: 44, height: 44, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#202124', border: '1px solid #DADCE0' };
const kindCard: React.CSSProperties = { width: '100%', textAlign: 'right', padding: 16, marginBottom: 10, background: '#fff', border: '1px solid #DADCE0', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 };
const primaryBtn: React.CSSProperties = { padding: '14px 16px', background: 'var(--emerald, #01875F)', color: '#fff', border: 0, borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' };
const secondaryBtn: React.CSSProperties = { flex: 1, padding: '14px 16px', background: '#fff', color: '#202124', border: '1px solid #DADCE0', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' };
const alertBox: React.CSSProperties = { display: 'flex', gap: 10, alignItems: 'flex-start', background: '#FCE8E6', border: '1px solid var(--rose, #C71C56)', borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 13 };
const waBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48, padding: '12px 16px', borderRadius: 12, background: '#1FA855', color: '#fff', fontSize: 14, fontWeight: 800, textDecoration: 'none' };
const waBtnSecondary: React.CSSProperties = { ...waBtn, background: '#fff', color: '#137A3D', border: '1px solid #1FA855' };
const secretBox: React.CSSProperties = { fontSize: 20, fontWeight: 800, letterSpacing: 2, fontFamily: 'monospace', textAlign: 'center', background: '#FEF7E0', padding: 10, borderRadius: 8, marginBottom: 8 };
const copyBtn: React.CSSProperties = { width: '100%', minHeight: 44, padding: 10, background: '#202124', color: '#fff', border: 0, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 };
