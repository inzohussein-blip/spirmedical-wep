import {
  AlertTriangle, ShieldAlert, Droplet, User, Repeat, Package,
  Navigation, Receipt, Clock, FileImage,
} from 'lucide-react';

/**
 * 🩺 تفاصيل الطلب السريرية
 *
 * تدفّقا التمريض وسحب الدم يلتقطان بيانات منظّمة حرجة (استمارة الحساسية، تنبيه
 * الأمراض المعدية، تفضيل جنس الكادر، صورة الوصفة، الصيام، الإحداثيات…) لكنّها
 * **لم تكن تُعرض للمختصّ إطلاقاً**: كان يرى التاريخ والعنوان والملاحظات فقط.
 * فيصل الممرّض إلى المنزل دون معرفة حساسية المريض ولا احتياطات العدوى.
 *
 * هذا المكوّن يعرضها مرتّبةً بالأولوية السريرية: التنبيهات الحمراء أولاً.
 */

const ALLERGY_LABELS: Record<string, string> = {
  penicillin: 'البنسلين',
  sulfa: 'السلفا',
  aspirin: 'الأسبرين',
  iodine: 'اليود',
  latex: 'اللاتكس',
};

const INFECTIOUS_LABELS: Record<string, string> = {
  hepatitis_b: 'التهاب الكبد B',
  hepatitis_c: 'التهاب الكبد C',
  hiv: 'نقص المناعة (HIV)',
  covid: 'كوفيد-19',
  tb: 'السلّ (TB)',
};

const GENDER_PREF: Record<string, string> = {
  male: 'كادر ذكر',
  female: 'كادر أنثى',
  any: 'لا تفضيل',
};

const PATIENT_GENDER: Record<string, string> = { male: 'ذكر', female: 'أنثى' };

/** يستخرج البنود المفعّلة من كائن JSONB منطقي + حقل `other` النصّي */
function activeFlags(
  data: Record<string, unknown> | null | undefined,
  labels: Record<string, string>
): string[] {
  if (!data || typeof data !== 'object') return [];
  const out: string[] = [];
  for (const [key, label] of Object.entries(labels)) {
    if (data[key] === true) out.push(label);
  }
  const other = data.other;
  if (typeof other === 'string' && other.trim()) out.push(other.trim());
  return out;
}

export interface ClinicalOrder {
  service_id?: string | null;
  allergy_form?: unknown;
  allergy_form_filled?: boolean | null;
  infectious_disease_alert?: unknown;
  nurse_gender_preference?: string | null;
  prescription_image_url?: string | null;
  prescription_required?: boolean | null;
  recurring_schedule?: unknown;
  supplies_request?: unknown;
  supplies_total?: number | null;
  needs_fasting?: boolean | null;
  fasting_hours?: number | null;
  patient_age?: number | null;
  patient_gender?: string | null;
  patient_condition?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  estimated_price?: number | null;
  duration_minutes?: number | null;
}

export default function OrderClinicalDetails({ order }: { order: ClinicalOrder }) {
  const allergies = activeFlags(order.allergy_form as Record<string, unknown>, ALLERGY_LABELS);
  const infectious = activeFlags(
    order.infectious_disease_alert as Record<string, unknown>,
    INFECTIOUS_LABELS
  );

  const recurring = order.recurring_schedule as
    | { enabled?: boolean; interval_hours?: number; end_date?: string }
    | null
    | undefined;

  const supplies = order.supplies_request as
    | { items?: Array<{ name: string; quantity: number }>; total?: number }
    | null
    | undefined;

  const hasGps =
    typeof order.location_lat === 'number' && typeof order.location_lng === 'number';

  const patientBits = [
    typeof order.patient_age === 'number' ? `${order.patient_age} سنة` : null,
    order.patient_gender ? PATIENT_GENDER[order.patient_gender] ?? order.patient_gender : null,
    order.patient_condition || null,
  ].filter(Boolean) as string[];

  const rows: Array<{ key: string; icon: React.ReactNode; title: string; body: React.ReactNode }> = [];

  if (order.nurse_gender_preference && order.nurse_gender_preference !== 'any') {
    rows.push({
      key: 'gender',
      icon: <User size={22} strokeWidth={2} />,
      title: 'تفضيل الكادر',
      body: GENDER_PREF[order.nurse_gender_preference] ?? order.nurse_gender_preference,
    });
  }

  if (order.needs_fasting) {
    rows.push({
      key: 'fasting',
      icon: <Droplet size={22} strokeWidth={2} />,
      title: 'صيام مطلوب',
      body: order.fasting_hours ? `${order.fasting_hours} ساعة قبل السحب` : 'صيام قبل السحب',
    });
  }

  if (patientBits.length > 0) {
    rows.push({
      key: 'patient',
      icon: <User size={22} strokeWidth={2} />,
      title: 'بيانات الفحص',
      body: patientBits.join(' · '),
    });
  }

  if (order.prescription_image_url) {
    rows.push({
      key: 'rx',
      icon: <FileImage size={22} strokeWidth={2} />,
      title: 'صورة الوصفة',
      body: (
        <a
          href={order.prescription_image_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--spir-primary)', fontWeight: 700, textDecoration: 'underline' }}
        >
          فتح صورة الوصفة ←
        </a>
      ),
    });
  }

  if (supplies?.items && supplies.items.length > 0) {
    rows.push({
      key: 'supplies',
      icon: <Package size={22} strokeWidth={2} />,
      title: 'مستلزمات مطلوبة',
      body: supplies.items.map((it) => `${it.name} ×${it.quantity}`).join(' · '),
    });
  }

  if (recurring?.enabled) {
    rows.push({
      key: 'recurring',
      icon: <Repeat size={22} strokeWidth={2} />,
      title: 'زيارة متكرّرة',
      body: [
        recurring.interval_hours ? `كل ${recurring.interval_hours} ساعة` : null,
        recurring.end_date
          ? `حتى ${new Date(recurring.end_date).toLocaleDateString('ar-IQ')}`
          : null,
      ]
        .filter(Boolean)
        .join(' · '),
    });
  }

  if (hasGps) {
    rows.push({
      key: 'gps',
      icon: <Navigation size={22} strokeWidth={2} />,
      title: 'موقع GPS دقيق',
      body: (
        <a
          href={`https://www.google.com/maps?q=${order.location_lat},${order.location_lng}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--spir-primary)', fontWeight: 700, textDecoration: 'underline' }}
        >
          فتح في الخرائط ←
        </a>
      ),
    });
  }

  if (order.duration_minutes) {
    rows.push({
      key: 'duration',
      icon: <Clock size={22} strokeWidth={2} />,
      title: 'المدة المتوقّعة',
      body: `${order.duration_minutes} دقيقة`,
    });
  }

  if (order.estimated_price) {
    rows.push({
      key: 'price',
      icon: <Receipt size={22} strokeWidth={2} />,
      title: 'المبلغ المقدّر',
      body: `${order.estimated_price.toLocaleString('ar-IQ')} د.ع${
        supplies?.total ? ` (منها ${supplies.total.toLocaleString('ar-IQ')} مستلزمات)` : ''
      }`,
    });
  }

  // سطر «الاستمارة مملوءة بلا حساسية» محتوىً بحدّ ذاته (طمأنة صريحة)،
  // فيجب احتسابه وإلّا اختفى القسم كلّه.
  const showsAllergyReassurance = allergies.length === 0 && Boolean(order.allergy_form_filled);
  const hasAlerts = infectious.length > 0 || allergies.length > 0;
  if (!hasAlerts && !showsAllergyReassurance && rows.length === 0) return null;

  return (
    <>
      {/* ─── تنبيهات السلامة أولاً ─── */}
      {infectious.length > 0 && (
        <div
          role="alert"
          style={{
            marginTop: 16, padding: 12, borderRadius: 12,
            background: 'var(--rose-soft)', border: '1px solid var(--rose)',
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}
        >
          <ShieldAlert size={20} strokeWidth={2.2} style={{ color: 'var(--rose)', flexShrink: 0 }} aria-hidden />
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--rose)' }}>
              تنبيه عدوى — احتياطات إلزامية
            </div>
            <div style={{ fontSize: 13, marginTop: 2, lineHeight: 1.7 }}>{infectious.join(' · ')}</div>
          </div>
        </div>
      )}

      {allergies.length > 0 && (
        <div
          role="alert"
          style={{
            marginTop: 10, padding: 12, borderRadius: 12,
            background: 'var(--amber-soft)', border: '1px solid var(--amber)',
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}
        >
          <AlertTriangle size={20} strokeWidth={2.2} style={{ color: 'var(--amber)', flexShrink: 0 }} aria-hidden />
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--amber)' }}>
              حساسية مُعلَنة
            </div>
            <div style={{ fontSize: 13, marginTop: 2, lineHeight: 1.7 }}>{allergies.join(' · ')}</div>
          </div>
        </div>
      )}

      {/* استمارة مملوءة بلا أي حساسية — طمأنة صريحة بدل الفراغ */}
      {showsAllergyReassurance && (
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--ink-3)' }}>
          ✓ استمارة الحساسية مملوءة — لا حساسية مُعلَنة
        </div>
      )}

      {rows.length > 0 && (
        <>
          <div className="scr-section-head" style={{ marginTop: 16 }}>
            <div className="scr-section-title">تفاصيل التنفيذ</div>
          </div>
          <div className="scr-list-stack">
            {rows.map((r) => (
              <div className="scr-list-item" key={r.key}>
                <div className="scr-list-item-icon">{r.icon}</div>
                <div className="scr-list-item-content">
                  <div className="scr-list-item-title">{r.title}</div>
                  <div className="scr-list-item-subtitle">{r.body}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
