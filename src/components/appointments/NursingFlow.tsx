'use client';

// ═══════════════════════════════════════════════════════════════════
// NursingFlow v1 (V25.5) - الواجهة الكاملة لخدمة التمريض المنزلي
// ═══════════════════════════════════════════════════════════════════
// بناءً على وثيقة المواصفات الفنية لأيقونة "التمريض المنزلي والتداوي"
//
// الخطوات:
// 1. اختيار نوع الإجراء التمريضي (7 خيارات)
// 2. استمارة التحسس الدوائي (إلزامي)
// 3. الوصفة الطبية + تنبيه الأمراض المعدية
// 4. تفضيلات الكادر (جنس الممرض)
// 5. الموعد + الجدولة الدورية (اختياري)
// 6. العنوان + المراجعة + التأكيد
// ═══════════════════════════════════════════════════════════════════

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from '@/components/ui/Toaster';
import { haptic } from '@/lib/haptic';
import FamilyMemberPicker from '@/components/family/FamilyMemberPicker';
import CameraCapture from '@/components/pwa/CameraCapture';
import UserLocationPickerWrapper, { type LocationData } from '@/components/maps/UserLocationPickerWrapper';
import { useFormErrors } from '@/lib/forms/useFormErrors';
import MissingFieldsSummary from '@/components/forms/MissingFieldsSummary';
import FieldError from '@/components/forms/FieldError';
import {
  validateNursing,
  validateNursingFields,
  NURSING_STEP_FIELDS,
  NURSING_FIELD_LABELS,
  NURSING_FIELD_ORDER,
} from '@/lib/validations/nursing';
import {
  Syringe, Droplet, Bandage, Stethoscope, Activity, Footprints,
  AlertTriangle, FileImage, ShieldCheck, Calendar, MapPin, Phone,
  CheckCircle2, ChevronLeft, ChevronRight, X, Upload, Pill, Repeat,
  User, UserCircle, Users, Clock, Loader2,
} from 'lucide-react';

/** نتيجة الإرسال — تسمح بعرض أخطاء الحقول القادمة من الخادم. */
export interface NursingSubmitResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

const NURSING_BASE_PRICE = 25000;

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface NursingSubmission {
  procedure_type: string;
  procedure_label: string;

  // التحسس
  allergy_form: {
    penicillin?: boolean;
    sulfa?: boolean;
    aspirin?: boolean;
    iodine?: boolean;
    latex?: boolean;
    other?: string;
    filled_at: string;
  };

  // الوصفة
  prescription_image_url?: string;
  prescription_skipped?: boolean;

  // الأمراض المعدية
  infectious_disease_alert?: {
    hepatitis_b?: boolean;
    hepatitis_c?: boolean;
    hiv?: boolean;
    covid?: boolean;
    tb?: boolean;
    other?: string;
  };

  // الكادر
  nurse_gender_preference: 'male' | 'female' | 'any';

  // الموعد
  scheduledAt: string;
  recurring_schedule?: {
    enabled: boolean;
    interval_hours: number;
    end_date?: string;
  };

  // العنوان
  address: string;
  phone: string;
  patientGender?: 'male' | 'female';
  location_lat?: number;
  location_lng?: number;

  // الملاحظات
  notes?: string;

  // ✨ V25.8: Family member (null = self)
  family_member_id?: string | null;

  totalPrice: number;
}

interface Props {
  userPhone?: string;
  userAddress?: string;
  userGender?: 'male' | 'female' | null;
  onSubmit: (data: NursingSubmission) => Promise<NursingSubmitResult | void>;
  savedLocations?: Array<{
    id: string;
    label: string;
    icon: string;
    address: string;
    lat: number;
    lng: number;
  }>;
}

// ═══════════════════════════════════════════════════════════════════
// قائمة الإجراءات (مطابقة لـ PDF)
// ═══════════════════════════════════════════════════════════════════
const PROCEDURES = [
  {
    id: 'injection',
    label: 'زرق إبر',
    icon: Syringe,
    desc: 'حقن عضلية، وريدية، تحت الجلد',
    price: 25000,
    duration: 30,
  },
  {
    id: 'iv',
    label: 'تركيب مغذٍ وريدي',
    icon: Droplet,
    desc: 'مغذيات وعلاجات وريدية',
    price: 35000,
    duration: 60,
  },
  {
    id: 'cannula',
    label: 'تركيب كانيولا',
    icon: Activity,
    desc: 'تأمين مجرى وريدي للمريض',
    price: 30000,
    duration: 30,
  },
  {
    id: 'wound_care',
    label: 'تضميد جروح',
    icon: Bandage,
    desc: 'غيار جراحي معقّم بعد العمليات',
    price: 30000,
    duration: 45,
  },
  {
    id: 'diabetic_foot',
    label: 'القدم السكري',
    icon: Footprints,
    desc: 'تنظيف وغيار - معقّم ومتخصص',
    price: 40000,
    duration: 60,
  },
  {
    id: 'catheter',
    label: 'قسطرة بولية',
    icon: Stethoscope,
    desc: 'سحب أو تبديل القسطرة البولية',
    price: 35000,
    duration: 45,
  },
  {
    id: 'vaccination',
    label: 'تطعيمات',
    icon: Syringe,
    desc: 'حقن لقاحات الأطفال أو الكبار',
    price: 20000,
    duration: 20,
  },
];

const ALLERGIES = [
  { key: 'penicillin' as const, label: 'البنسلين', emoji: '💊' },
  { key: 'sulfa' as const,      label: 'السلفا',   emoji: '⚠️' },
  { key: 'aspirin' as const,    label: 'الأسبرين', emoji: '🩹' },
  { key: 'iodine' as const,     label: 'اليود',    emoji: '🧴' },
  { key: 'latex' as const,      label: 'اللاتكس',  emoji: '🧤' },
];

const INFECTIOUS = [
  { key: 'hepatitis_b' as const, label: 'التهاب الكبد B' },
  { key: 'hepatitis_c' as const, label: 'التهاب الكبد C' },
  { key: 'hiv' as const,         label: 'فيروس HIV' },
  { key: 'covid' as const,       label: 'كوفيد-19' },
  { key: 'tb' as const,          label: 'السل (TB)' },
];

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════
function getMinDate(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

function getMaxDate(): string {
  const max = new Date();
  max.setDate(max.getDate() + 30);
  return max.toISOString().split('T')[0];
}

// ═══════════════════════════════════════════════════════════════════
// المكوّن الرئيسي
// ═══════════════════════════════════════════════════════════════════
export default function NursingFlow({
  userPhone = '',
  userAddress = '',
  userGender = null,
  onSubmit,
  savedLocations = [],
}: Props) {
  // ─── State (مُجمَّع في كائن واحد) ─────────────
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. الإجراء
  const [procedureId, setProcedureId] = useState<string | null>(null);

  // 2. التحسس
  const [allergies, setAllergies] = useState<NursingSubmission['allergy_form']>({
    filled_at: '',
  });
  const [allergyConfirmed, setAllergyConfirmed] = useState(false);

  // 3. الوصفة + المعدية
  const [prescriptionImage, setPrescriptionImage] = useState<string | null>(null);
  const [prescriptionSkipped, setPrescriptionSkipped] = useState(false);
  const [infectious, setInfectious] = useState<NursingSubmission['infectious_disease_alert']>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 4. تفضيلات الكادر
  const [nurseGender, setNurseGender] = useState<'male' | 'female' | 'any'>('any');

  // 5. الموعد
  const [scheduledDate, setScheduledDate] = useState(getMinDate());
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [recurringEnabled, setRecurringEnabled] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState(8);
  const [recurringEndDate, setRecurringEndDate] = useState('');

  // 6. العنوان
  const [address, setAddress] = useState(userAddress);
  const [phone, setPhone] = useState(userPhone);
  const [notes, setNotes] = useState('');
  // ✨ V33: إحداثيات GPS من منتقي الخريطة
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);

  // ✨ V25.8: Family member
  const searchParams = useSearchParams();
  const initialFamilyId = searchParams?.get('family') ?? null;
  const [familyMemberId, setFamilyMemberId] = useState<string | null>(initialFamilyId);

  const procedure = PROCEDURES.find((p) => p.id === procedureId);

  // ✨ أخطاء الحقول + التمرير/التركيز (بدل زرّ «التالي» المُعطَّل الصامت)
  const fe = useFormErrors(NURSING_FIELD_ORDER);
  const validationInput = {
    procedureId,
    allergyConfirmed,
    prescriptionImage,
    prescriptionSkipped,
    scheduledDate,
    scheduledTime,
    address,
    phone,
  };

  // منتقي الخريطة: يملأ العنوان + الإحداثيات
  const handleMapLocation = (loc: LocationData) => {
    const text =
      loc.address?.trim() || `📍 ${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`;
    setAddress(text);
    setGpsLocation({ lat: loc.latitude, lng: loc.longitude });
    if (text.trim().length >= 10) fe.clearError('address');
  };

  // التحقّق من الخطوة الحالية عند «التالي»
  const handleNext = () => {
    const fields = NURSING_STEP_FIELDS[step] || [];
    const { ok, fieldErrors } = validateNursingFields(fields, validationInput);
    if (!ok) {
      fe.setErrors(fieldErrors);
      fe.focusFirst(fieldErrors);
      haptic.error();
      return;
    }
    fe.clearAll();
    setStep((s) => (s + 1) as typeof step);
  };

  // ─── Image upload handler ─────────────────────
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('الصورة كبيرة جداً (الحد الأقصى 5 ميجا)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setPrescriptionImage(ev.target?.result as string);
      fe.clearError('prescription');
    };
    reader.readAsDataURL(file);
  };

  // ─── Submit ─────────────────────────────────
  const handleSubmit = async () => {
    // ✨ تحقّق كامل قبل الإرسال — يُظهر الحقول الناقصة ويقفز للخطوة المناسبة
    const { ok, fieldErrors } = validateNursing(validationInput);
    if (!ok) {
      fe.setErrors(fieldErrors);
      const firstBadStep = Object.keys(NURSING_STEP_FIELDS)
        .map(Number)
        .find((s) => (NURSING_STEP_FIELDS[s] || []).some((f) => fieldErrors[f]));
      if (firstBadStep && firstBadStep !== step) {
        setStep(firstBadStep as typeof step);
      }
      fe.focusFirst(fieldErrors);
      haptic.error();
      return;
    }
    if (!procedure) return;

    setIsSubmitting(true);

    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString();

      const res = await onSubmit({
        procedure_type: procedure.id,
        procedure_label: procedure.label,
        allergy_form: {
          ...allergies,
          filled_at: new Date().toISOString(),
        },
        prescription_image_url: prescriptionImage || undefined,
        prescription_skipped: prescriptionSkipped,
        infectious_disease_alert: Object.keys(infectious || {}).length > 0 ? infectious : undefined,
        nurse_gender_preference: nurseGender,
        scheduledAt,
        recurring_schedule: recurringEnabled ? {
          enabled: true,
          interval_hours: recurringInterval,
          end_date: recurringEndDate || undefined,
        } : undefined,
        address,
        phone,
        patientGender: userGender || undefined,
        notes: notes.trim() || undefined,
        family_member_id: familyMemberId,
        totalPrice: procedure.price,
        location_lat: gpsLocation?.lat,
        location_lng: gpsLocation?.lng,
      });
      // أخطاء حقول من الخادم
      if (res && res.ok === false && res.fieldErrors && Object.keys(res.fieldErrors).length > 0) {
        fe.setErrors(res.fieldErrors);
        if (res.fieldErrors.address || res.fieldErrors.phone) setStep(6);
        else if (res.fieldErrors.procedure) setStep(1);
        fe.focusFirst(res.fieldErrors);
        setIsSubmitting(false);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل الحجز');
      setIsSubmitting(false);
    }
  };

  // ─── Render ─────────────────────────────────
  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Progress bar */}
      <div style={{
        position: 'sticky',
        top: 0,
        background: 'var(--paper)',
        zIndex: 10,
        paddingBottom: 12,
        marginBottom: 12,
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>
            الخطوة {step} من 6
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--emerald)' }}>
            {procedure && `${procedure.price.toLocaleString('ar-IQ')} د.ع`}
          </div>
        </div>
        <div style={{
          height: 4,
          background: 'var(--line)',
          borderRadius: 100,
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${(step / 6) * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, var(--emerald), var(--emerald-deep))',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* ════════ STEP 1: اختيار الإجراء ════════ */}
      {step === 1 && (
        <section ref={fe.registerRef('procedure')}>
          <h2 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 4px' }}>
            ما هو الإجراء التمريضي المطلوب؟
          </h2>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '0 0 16px' }}>
            اختر نوع الخدمة لمساعدتنا في تخصيص الممرض المناسب
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PROCEDURES.map((proc) => {
              const Icon = proc.icon;
              const isSelected = procedureId === proc.id;
              return (
                <button
                  key={proc.id}
                  type="button"
                  onClick={() => { setProcedureId(proc.id); fe.clearError('procedure'); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 14,
                    background: isSelected ? 'var(--emerald-soft)' : 'var(--white)',
                    border: '2px solid',
                    borderColor: isSelected ? 'var(--emerald)' : 'var(--line)',
                    borderRadius: 14,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'start',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: isSelected ? 'var(--emerald)' : 'var(--emerald-soft)',
                    color: isSelected ? 'var(--paper-3)' : 'var(--emerald)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={22} strokeWidth={2} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: 'var(--ink)',
                      marginBottom: 2,
                    }}>
                      {proc.label}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                      {proc.desc}
                    </div>
                  </div>
                  <div style={{
                    textAlign: 'end',
                    flexShrink: 0,
                  }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 900,
                      color: isSelected ? 'var(--emerald)' : 'var(--ink)',
                    }}>
                      {proc.price.toLocaleString('ar-IQ')}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--ink-3)' }}>د.ع</div>
                  </div>
                  {isSelected && (
                    <CheckCircle2 size={20} color="var(--emerald)" strokeWidth={2.4} />
                  )}
                </button>
              );
            })}
          </div>
          <FieldError message={fe.fieldErrors.procedure} />
        </section>
      )}

      {/* ════════ STEP 2: التحسس الدوائي ════════ */}
      {step === 2 && (
        <section ref={fe.registerRef('allergy')}>
          <h2 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 4px' }}>
            استمارة التحسس الدوائي
          </h2>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '0 0 16px' }}>
            هل يعاني المريض من أي تحسس دوائي؟ (إلزامي)
          </p>

          <div style={{ marginBottom: 14 }}>
            {ALLERGIES.map((a) => (
              <label
                key={a.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  background: allergies[a.key] ? 'var(--rose-soft)' : 'var(--white)',
                  border: '1px solid',
                  borderColor: allergies[a.key] ? 'var(--rose)' : 'var(--line)',
                  borderRadius: 12,
                  cursor: 'pointer',
                  marginBottom: 8,
                  transition: 'all 0.15s',
                }}
              >
                <input
                  type="checkbox"
                  checked={!!allergies[a.key]}
                  onChange={(e) => setAllergies({ ...allergies, [a.key]: e.target.checked })}
                  style={{ width: 18, height: 18, accentColor: 'var(--rose)' }}
                />
                <span style={{ fontSize: 20 }}>{a.emoji}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>
                  حساسية {a.label}
                </span>
                {allergies[a.key] && (
                  <span style={{
                    fontSize: 10,
                    fontWeight: 800,
                    background: 'var(--rose)',
                    color: 'var(--paper-3)',
                    padding: '2px 8px',
                    borderRadius: 100,
                  }}>
                    تحذير
                  </span>
                )}
              </label>
            ))}
          </div>

          <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>
            تحسسات أخرى (اختياري)
          </label>
          <input
            type="text"
            value={allergies.other ?? ''}
            onChange={(e) => setAllergies({ ...allergies, other: e.target.value })}
            placeholder="مثال: المأكولات البحرية، الحليب..."
            style={{
              width: '100%',
              padding: '12px 14px',
              background: 'var(--white)',
              border: '1px solid var(--line)',
              borderRadius: 12,
              fontSize: 13,
              fontFamily: 'inherit',
              marginBottom: 16,
            }}
          />

          {/* Confirmation */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: 14,
            background: allergyConfirmed ? 'var(--emerald-soft)' : 'var(--amber-soft)',
            border: '2px solid',
            borderColor: allergyConfirmed ? 'var(--emerald)' : 'var(--amber)',
            borderRadius: 12,
            cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              checked={allergyConfirmed}
              onChange={(e) => { setAllergyConfirmed(e.target.checked); if (e.target.checked) fe.clearError('allergy'); }}
              style={{ width: 20, height: 20, accentColor: 'var(--emerald)' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>
                أُؤكّد أن المعلومات المُدخلة صحيحة
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                للحماية القانونية وسلامة المريض
              </div>
            </div>
          </label>
          <FieldError message={fe.fieldErrors.allergy} />
        </section>
      )}

      {/* ════════ STEP 3: الوصفة + المعدية ════════ */}
      {step === 3 && (
        <section ref={fe.registerRef('prescription')}>
          <h2 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 4px' }}>
            الوصفة الطبية والحالة الصحية
          </h2>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '0 0 16px' }}>
            رفع الوصفة الطبية إلزامي لحماية المريض والكادر
          </p>

          {/* Prescription Upload */}
          <div style={{
            background: 'var(--white)',
            border: '2px dashed',
            borderColor: prescriptionImage ? 'var(--emerald)' : 'var(--line)',
            borderRadius: 14,
            padding: 16,
            marginBottom: 12,
            textAlign: 'center',
          }}>
            {prescriptionImage ? (
              <div>
                <img
                  src={prescriptionImage}
                  alt="الوصفة"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 200,
                    borderRadius: 8,
                    marginBottom: 8,
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setPrescriptionImage(null);
                    setPrescriptionSkipped(false);
                  }}
                  style={{
                    background: 'var(--rose-soft)',
                    color: 'var(--rose)',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  حذف الصورة
                </button>
              </div>
            ) : (
              <>
                <FileImage size={40} color="var(--ink-3)" style={{ marginBottom: 8 }} />
                <h4 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 4px' }}>
                  ارفع صورة الوصفة الطبية
                </h4>
                <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: '0 0 12px' }}>
                  PNG / JPG · الحد الأقصى 5 ميجا
                </p>
                <CameraCapture
                  mode="both"
                  maxFiles={1}
                  label="ارفع أو التقط صورة"
                  onCapture={(files) => {
                    const file = files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setPrescriptionImage(reader.result as string);
                      fe.clearError('prescription');
                      toast.success('تم رفع الصورة');
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </>
            )}
          </div>

          {/* Skip option */}
          {!prescriptionImage && (
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: 12,
              background: prescriptionSkipped ? 'var(--amber-soft)' : 'var(--paper-3)',
              border: '1px solid',
              borderColor: prescriptionSkipped ? 'var(--amber)' : 'var(--line)',
              borderRadius: 10,
              cursor: 'pointer',
              marginBottom: 16,
            }}>
              <input
                type="checkbox"
                checked={prescriptionSkipped}
                onChange={(e) => { setPrescriptionSkipped(e.target.checked); if (e.target.checked) fe.clearError('prescription'); }}
                style={{ width: 16, height: 16, accentColor: 'var(--amber)' }}
              />
              <div style={{ flex: 1, fontSize: 12 }}>
                <div style={{ fontWeight: 700 }}>ليس لدي وصفة (سيراها الممرض)</div>
                <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>
                  ⚠️ قد يرفض الممرض إعطاء حقن دون وصفة موقّعة
                </div>
              </div>
            </label>
          )}

          {/* Infectious diseases */}
          <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 8px' }}>
            هل يعاني المريض من أمراض معدية؟
          </h3>
          <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: '0 0 10px' }}>
            مهم لاتخاذ احتياطات الحماية للكادر
          </p>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            marginBottom: 12,
          }}>
            {INFECTIOUS.map((d) => {
              const isChecked = !!infectious?.[d.key];
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setInfectious({
                    ...infectious,
                    [d.key]: !isChecked,
                  })}
                  style={{
                    padding: '8px 14px',
                    background: isChecked ? 'var(--amber)' : 'var(--white)',
                    color: isChecked ? 'var(--paper-3)' : 'var(--ink-2)',
                    border: '1px solid',
                    borderColor: isChecked ? 'var(--amber)' : 'var(--line)',
                    borderRadius: 100,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {isChecked && <CheckCircle2 size={12} style={{ marginInlineEnd: 4, display: 'inline' }} />}
                  {d.label}
                </button>
              );
            })}
          </div>

          <input
            type="text"
            value={infectious?.other ?? ''}
            onChange={(e) => setInfectious({ ...infectious, other: e.target.value })}
            placeholder="ذكر أمراض أخرى (اختياري)"
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'var(--white)',
              border: '1px solid var(--line)',
              borderRadius: 10,
              fontSize: 12,
              fontFamily: 'inherit',
            }}
          />
          <FieldError message={fe.fieldErrors.prescription} />
        </section>
      )}

      {/* ════════ STEP 4: تفضيل الكادر ════════ */}
      {step === 4 && (
        <section>
          <h2 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 4px' }}>
            تفضيل جنس الكادر التمريضي
          </h2>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '0 0 16px' }}>
            لضمان الراحة والخصوصية - يُحترم اختيارك دائماً
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { id: 'female' as const, label: 'ممرضة (أنثى)', desc: 'تفضيل أنثى للخدمة', icon: UserCircle, recommended: userGender === 'female' },
              { id: 'male' as const, label: 'ممرض (ذكر)', desc: 'تفضيل ذكر للخدمة', icon: User, recommended: userGender === 'male' },
              { id: 'any' as const, label: 'لا فرق', desc: 'أيهما متاح وأقرب', icon: Users },
            ].map((opt) => {
              const Icon = opt.icon;
              const isSelected = nurseGender === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setNurseGender(opt.id)}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: 16,
                    background: isSelected ? 'var(--emerald-soft)' : 'var(--white)',
                    border: '2px solid',
                    borderColor: isSelected ? 'var(--emerald)' : 'var(--line)',
                    borderRadius: 14,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'start',
                  }}
                >
                  <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: isSelected ? 'var(--emerald)' : 'var(--paper-3)',
                    color: isSelected ? 'var(--paper-3)' : 'var(--ink-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Icon size={28} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 2 }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{opt.desc}</div>
                  </div>
                  {opt.recommended && (
                    <span style={{
                      position: 'absolute',
                      top: 8,
                      insetInlineEnd: 8,
                      background: 'var(--amber)',
                      color: 'var(--paper-3)',
                      fontSize: 9,
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: 6,
                    }}>
                      موصى
                    </span>
                  )}
                  {isSelected && <CheckCircle2 size={22} color="var(--emerald)" />}
                </button>
              );
            })}
          </div>

          <div style={{
            marginTop: 16,
            padding: 12,
            background: 'var(--emerald-soft)',
            borderRadius: 10,
            fontSize: 11,
            color: 'var(--emerald-deep)',
            display: 'flex',
            gap: 8,
            alignItems: 'flex-start',
          }}>
            <ShieldCheck size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>كل الكادر التمريضي معتمد رسمياً من نقابة التمريض ووزارة الصحة العراقية</span>
          </div>
        </section>
      )}

      {/* ════════ STEP 5: الموعد + الجدولة ════════ */}
      {step === 5 && (
        <section>
          <h2 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 4px' }}>
            متى تحتاج الخدمة؟
          </h2>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '0 0 16px' }}>
            اختر الموعد الأنسب لك
          </p>

          {/* Date */}
          <div ref={fe.registerRef('date')}>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>
              التاريخ
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => { setScheduledDate(e.target.value); fe.clearError('date'); }}
              min={getMinDate()}
              max={getMaxDate()}
              aria-invalid={fe.hasError('date')}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'var(--white)',
                border: `1px solid ${fe.hasError('date') ? 'var(--rose)' : 'var(--line)'}`,
                borderRadius: 12,
                fontSize: 14,
                fontFamily: 'inherit',
                marginBottom: 4,
              }}
            />
            <FieldError message={fe.fieldErrors.date} />
          </div>

          {/* Time */}
          <div ref={fe.registerRef('time')} style={{ marginTop: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>
              الوقت
            </label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => { setScheduledTime(e.target.value); fe.clearError('time'); }}
              aria-invalid={fe.hasError('time')}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'var(--white)',
                border: `1px solid ${fe.hasError('time') ? 'var(--rose)' : 'var(--line)'}`,
                borderRadius: 12,
                fontSize: 14,
                fontFamily: 'inherit',
                marginBottom: 4,
              }}
            />
            <FieldError message={fe.fieldErrors.time} />
          </div>
          <div style={{ marginBottom: 12 }} />

          {/* Recurring */}
          <div style={{
            background: recurringEnabled ? 'var(--emerald-soft)' : 'var(--paper-3)',
            border: '1px solid',
            borderColor: recurringEnabled ? 'var(--emerald)' : 'var(--line)',
            borderRadius: 14,
            padding: 14,
            marginBottom: 16,
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              marginBottom: recurringEnabled ? 12 : 0,
            }}>
              <input
                type="checkbox"
                checked={recurringEnabled}
                onChange={(e) => setRecurringEnabled(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: 'var(--emerald)' }}
              />
              <Repeat size={18} color={recurringEnabled ? 'var(--emerald)' : 'var(--ink-3)'} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800 }}>
                  تكرار العلاج (كورس)
                </div>
                <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>
                  للمضادات الحيوية والإبر الدورية
                </div>
              </div>
            </label>

            {recurringEnabled && (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 6,
                  marginBottom: 10,
                }}>
                  {[
                    { val: 8, label: 'كل 8 ساعات', sub: '3 يومياً' },
                    { val: 12, label: 'كل 12 ساعة', sub: 'مرّتين' },
                    { val: 24, label: 'كل 24 ساعة', sub: 'مرّة' },
                  ].map((r) => (
                    <button
                      key={r.val}
                      type="button"
                      onClick={() => setRecurringInterval(r.val)}
                      style={{
                        padding: '10px 6px',
                        background: recurringInterval === r.val ? 'var(--emerald)' : 'var(--white)',
                        color: recurringInterval === r.val ? 'var(--paper-3)' : 'var(--ink-2)',
                        border: '1px solid',
                        borderColor: recurringInterval === r.val ? 'var(--emerald)' : 'var(--line)',
                        borderRadius: 10,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 800 }}>{r.label}</div>
                      <div style={{ fontSize: 9, opacity: 0.8 }}>{r.sub}</div>
                    </button>
                  ))}
                </div>

                <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 4 }}>
                  تاريخ انتهاء الكورس
                </label>
                <input
                  type="date"
                  value={recurringEndDate}
                  onChange={(e) => setRecurringEndDate(e.target.value)}
                  min={scheduledDate}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--white)',
                    border: '1px solid var(--line)',
                    borderRadius: 10,
                    fontSize: 12,
                    fontFamily: 'inherit',
                  }}
                />
              </>
            )}
          </div>
        </section>
      )}

      {/* ════════ STEP 6: العنوان + التأكيد ════════ */}
      {step === 6 && (
        <section>
          <h2 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 4px' }}>
            مراجعة وتأكيد الطلب
          </h2>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '0 0 16px' }}>
            تأكد من المعلومات قبل الإرسال
          </p>

          {/* ✨ V25.8: Family Member Picker */}
          <div style={{ marginBottom: 14 }}>
            <FamilyMemberPicker
              value={familyMemberId}
              onChange={setFamilyMemberId}
            />
          </div>

          {/* Saved locations */}
          {savedLocations.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6 }}>
                المواقع المحفوظة
              </label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {savedLocations.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => {
                      setAddress(loc.address);
                      setGpsLocation({ lat: loc.lat, lng: loc.lng });
                      fe.clearError('address');
                    }}
                    style={{
                      padding: '8px 12px',
                      background: 'var(--paper-3)',
                      border: '1px solid var(--line)',
                      borderRadius: 100,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {loc.icon} {loc.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Address */}
          <div ref={fe.registerRef('address')}>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>
              <MapPin size={12} style={{ display: 'inline', verticalAlign: -2 }} /> العنوان
            </label>

            {/* ✨ V33: منتقي الخريطة التفاعلي (MapLibre) */}
            <div style={{ marginBottom: 10 }}>
              <UserLocationPickerWrapper
                height={220}
                showAddress={false}
                showGovernorate={false}
                label="حدّد موقعك على الخريطة"
                description="حرّك الدبوس أو اضغط «موقعي الحالي» — سنملأ العنوان تلقائياً"
                initialLocation={
                  gpsLocation
                    ? { latitude: gpsLocation.lat, longitude: gpsLocation.lng }
                    : undefined
                }
                onLocationChange={handleMapLocation}
              />
            </div>

            <textarea
              value={address}
              onChange={(e) => { setAddress(e.target.value); fe.clearError('address'); }}
              placeholder="أضف تفاصيل: الحي، الشارع، رقم الدار، علامة مميزة..."
              rows={2}
              aria-invalid={fe.hasError('address')}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'var(--white)',
                border: `1px solid ${fe.hasError('address') ? 'var(--rose)' : 'var(--line)'}`,
                borderRadius: 12,
                fontSize: 13,
                fontFamily: 'inherit',
                marginBottom: 4,
                resize: 'vertical',
              }}
            />
            <FieldError message={fe.fieldErrors.address} />
          </div>

          {/* Phone */}
          <div ref={fe.registerRef('phone')} style={{ marginTop: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>
              <Phone size={12} style={{ display: 'inline', verticalAlign: -2 }} /> رقم التواصل
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value.replace(/[^\d]/g, '')); fe.clearError('phone'); }}
              placeholder="07XXXXXXXXX"
              maxLength={11}
              aria-invalid={fe.hasError('phone')}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'var(--white)',
                border: `1px solid ${fe.hasError('phone') ? 'var(--rose)' : 'var(--line)'}`,
                borderRadius: 12,
                fontSize: 13,
                fontFamily: 'inherit',
                marginBottom: 4,
              }}
            />
            <FieldError message={fe.fieldErrors.phone} />
          </div>

          {/* Notes */}
          <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>
            ملاحظات إضافية (اختياري)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="مثال: المريض كبير في السن - يفضّل القدوم في الصباح"
            rows={2}
            style={{
              width: '100%',
              padding: '12px 14px',
              background: 'var(--white)',
              border: '1px solid var(--line)',
              borderRadius: 12,
              fontSize: 12,
              fontFamily: 'inherit',
              marginBottom: 16,
              resize: 'vertical',
            }}
          />

          {/* Summary card */}
          <div style={{
            background: 'var(--emerald-soft)',
            border: '1px solid var(--emerald)',
            borderRadius: 14,
            padding: 16,
            marginBottom: 12,
          }}>
            <h4 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 10px', color: 'var(--emerald-deep)' }}>
              ملخّص الطلب
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
              <Row label="الخدمة" value={procedure?.label || '-'} />
              <Row label="الموعد" value={`${scheduledDate} - ${scheduledTime}`} />
              {recurringEnabled && (
                <Row label="التكرار" value={`كل ${recurringInterval} ساعة`} />
              )}
              <Row label="الكادر" value={
                nurseGender === 'female' ? 'ممرضة (أنثى)' :
                nurseGender === 'male' ? 'ممرض (ذكر)' : 'لا فرق'
              } />
              {Object.values(allergies).some((v) => v === true) && (
                <Row label="تحسسات" value="موجودة (سيُنبَّه الممرض)" warn />
              )}
              {Object.keys(infectious || {}).length > 0 && (
                <Row label="معدية" value="موجودة (سيتم التحضير)" warn />
              )}
              <div style={{
                marginTop: 8,
                paddingTop: 8,
                borderTop: '1px solid var(--emerald)',
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 900,
                color: 'var(--emerald-deep)',
              }}>
                <span>المجموع</span>
                <span>{procedure?.price.toLocaleString('ar-IQ')} د.ع</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════ Navigation buttons ═══════════ */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        insetInlineStart: 0,
        insetInlineEnd: 0,
        background: 'var(--paper)',
        borderTop: '1px solid var(--line)',
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 100,
      }}>
        {/* ✨ صندوق «الحقول الناقصة» */}
        <MissingFieldsSummary
          fields={fe.missingFields}
          labels={NURSING_FIELD_LABELS}
          errors={fe.fieldErrors}
          onJump={fe.jumpTo}
        />

        <div style={{ display: 'flex', gap: 8 }}>
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((s) => (s - 1) as typeof step)}
            disabled={isSubmitting}
            style={{
              flex: 1,
              padding: 14,
              background: 'var(--paper-3)',
              color: 'var(--ink-2)',
              border: '1px solid var(--line)',
              borderRadius: 12,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <ChevronRight size={16} />
            السابق
          </button>
        )}
        {step < 6 ? (
          <button
            type="button"
            onClick={handleNext}
            style={{
              flex: 2,
              padding: 14,
              background: 'var(--emerald)',
              color: 'var(--paper-3)',
              border: 'none',
              borderRadius: 12,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            التالي
            <ChevronLeft size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{
              flex: 2,
              padding: 14,
              background: 'var(--emerald)',
              color: 'var(--paper-3)',
              border: 'none',
              borderRadius: 12,
              cursor: isSubmitting ? 'wait' : 'pointer',
              fontFamily: 'inherit',
              fontSize: 14,
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              opacity: isSubmitting ? 0.6 : 1,
            }}
          >
            {isSubmitting ? (
              <><Loader2 size={16} className="animate-spin" /> جارٍ الإرسال...</>
            ) : (
              <><CheckCircle2 size={16} /> تأكيد الحجز</>
            )}
          </button>
        )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Helper component
// ═══════════════════════════════════════════════════════════════════
function Row({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: 'var(--ink-3)', fontWeight: 600 }}>{label}</span>
      <span style={{
        fontWeight: 800,
        color: warn ? 'var(--rose)' : 'var(--ink)',
      }}>
        {value}
      </span>
    </div>
  );
}
