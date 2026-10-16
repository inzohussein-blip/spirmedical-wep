/**
 * @jest-environment node
 */

/**
 * 🧪 سلوكُ الوحدات الصرفة التي يمرّ بها كلُّ طلب — بعد ترقية zod 4.
 *
 * التحقّقُ (zod) يحرس رفعَ الطلبات والتسجيل؛ ترقيتُه غيّرت واجهةَ الأخطاء (`errors` ← `issues`)
 * و`errorMap`. هنا يُقاس الناتجُ نفسُه: أيُّ حقلٍ يُرفض وبأيّ رسالةٍ عربيّة.
 * ومعه خللان وجدهما الاختبار:
 *   • الفتراتُ الزمنيّة: ٢٠٪ «محجوزة» عشوائيّاً وتتبدّل مع كلّ رسم.
 *   • تصديرُ CSV: نصٌّ يبدأ بـ = يُنفَّذ صيغةً في Excel (حقنُ صيغ).
 */

import { validateNursing, validateNursingFields, validateNursingServer, NURSING_STEP_FIELDS } from '@/lib/validations/nursing';
import { validateBloodDraw, validateBloodDrawServer } from '@/lib/validations/blood-draw';
import { validateAppointmentV2Server, appointmentUpdateSchema } from '@/lib/validations/appointment';
import {
  phoneFieldSchema,
  patientRegisterSchema,
  specialistRegisterSchema,
  mapSpecializationToDbType,
} from '@/lib/validations/auth-forms';
import { toCSV } from '@/lib/csv-export';
import {
  toArabicDigits,
  formatTimeArabic,
  formatDateRelative,
  generateAvailableDates,
  generateTimeSlotsForDate,
  groupTimeSlots,
} from '@/lib/services/time-slots';
import { isMarketingPath, isAppPath, isSharedPath, getDefaultPath } from '@/lib/site-config';

describe('التمريض المنزلي', () => {
  const ok = {
    procedureId: 'iv', allergyConfirmed: true, prescriptionImage: null, prescriptionSkipped: true,
    scheduledDate: '2030-01-02', scheduledTime: '10:00', address: 'النجف · حي السعد · شارع ٢٠', phone: '07701234567',
  };

  it('طلبٌ كامل يمرّ', () => expect(validateNursing(ok)).toEqual({ ok: true, fieldErrors: {} }));

  it('🚨 كلُّ حقلٍ ناقص يُرفض برسالته', () => {
    const r = validateNursing({ ...ok, procedureId: null, allergyConfirmed: false, prescriptionSkipped: false, address: 'قصير', phone: '0123' });
    expect(Object.keys(r.fieldErrors).sort()).toEqual(['address', 'allergy', 'phone', 'prescription', 'procedure']);
    expect(r.fieldErrors.phone).toMatch(/07/);
  });

  it('التحقّقُ بالخطوة لا يتجاوز حقولها', () => {
    expect(validateNursingFields(NURSING_STEP_FIELDS[5], { ...ok, address: '' }).ok).toBe(true);
    expect(validateNursingFields(NURSING_STEP_FIELDS[6], { ...ok, address: '' }).fieldErrors).toHaveProperty('address');
  });

  it('🚨 الخادمُ يعيد الحدودَ نفسها (العميلُ لا يُصدَّق)', () => {
    expect(validateNursingServer({ procedure_type: 'iv', address: 'عنوانٌ كافٍ للطول' }).ok).toBe(true);
    expect(validateNursingServer({ procedure_type: null, address: '  قصير  ' }).fieldErrors).toEqual({
      procedure: expect.any(String),
      address: expect.any(String),
    });
  });
});

describe('سحب الدم', () => {
  const ok = { tests: ['cbc'], address: 'بغداد · الكرادة · شارع ٦٢', phone: '7701234567', date: '2030-01-02', time: '09:00' };

  it('طلبٌ كامل يمرّ', () => expect(validateBloodDraw(ok).ok).toBe(true));

  it('🚨 أوّلُ خطأٍ لكلّ حقل، بالعربيّة', () => {
    const r = validateBloodDraw({ ...ok, tests: [], phone: '0790', date: 'غير تاريخ', age: '200' });
    expect(r.ok).toBe(false);
    expect(r.fieldErrors).toEqual({
      tests: 'اختر تحليلاً واحداً على الأقل',
      phone: 'أدخل رقم موبايل عراقي صحيح (يبدأ بـ 07)',
      date: 'تاريخ غير صحيح',
      age: 'أدخل عمراً صحيحاً (1–120)',
    });
  });

  it('الخادمُ يتحقّق من التحاليل والعنوان وحدهما', () => {
    expect(validateBloodDrawServer({ tests: ['cbc'], address: ok.address }).ok).toBe(true);
    expect(validateBloodDrawServer({ tests: [], address: 'x' }).fieldErrors).toHaveProperty('tests');
  });
});

describe('الموعد العامّ', () => {
  const future = new Date(Date.now() + 86_400_000).toISOString();

  it('موعدٌ في المستقبل يمرّ', () => {
    expect(validateAppointmentV2Server({ service_type: 'nursing', scheduled_at: future, address: 'عنوانٌ مفصّلٌ كافٍ' }).ok).toBe(true);
  });

  it('🚨 الماضي يُرفض', () => {
    const r = validateAppointmentV2Server({ service_type: 'nursing', scheduled_at: '2000-01-01T00:00:00Z', address: 'عنوانٌ مفصّلٌ كافٍ' });
    expect(r.fieldErrors.scheduled_at).toBe('يجب أن يكون التاريخ في المستقبل');
  });

  it('التحديثُ يقبل الحالاتِ المعروفة وحدها', () => {
    expect(appointmentUpdateSchema.safeParse({ status: 'completed' }).success).toBe(true);
    expect(appointmentUpdateSchema.safeParse({ status: 'paid' }).success).toBe(false);
  });
});

describe('التسجيل', () => {
  it.each([
    ['07701234567', '+9647701234567'],
    ['7701234567', '+9647701234567'],
    ['+9647701234567', '+9647701234567'],
  ])('🚨 الهاتفُ %s يُطبَّع إلى %s', (input, out) => {
    const r = phoneFieldSchema.safeParse(input);
    expect(r.success && r.data).toBe(out);
  });

  it('هاتفٌ غيرُ عراقيّ يُرفض بالعربيّة', () => {
    const r = phoneFieldSchema.safeParse('0123456');
    expect(!r.success && r.error.issues[0].message).toMatch(/رقم الهاتف غير صحيح/);
  });

  it('🚨 الجنسُ غيرُ المختار يعطي الرسالةَ العربيّة (errorMap ← message في zod 4)', () => {
    const r = patientRegisterSchema.safeParse({ fullName: 'أحمد علي', gender: '', phone: '07701234567', password: '582913', acceptTerms: true });
    expect(!r.success && r.error.issues.find((i) => i.path[0] === 'gender')?.message).toBe('يرجى اختيار قيمة');
  });

  it('🚨 اختصاص «أخرى» يطلب التوضيح', () => {
    const base = { fullName: 'سارة حسن', gender: 'female', phone: '07701234567', password: '582913', acceptTerms: true };
    const r = specialistRegisterSchema.safeParse({ ...base, specialization: 'other' });
    expect(!r.success && r.error.issues[0].path).toEqual(['specializationDetails']);
    expect(specialistRegisterSchema.safeParse({ ...base, specialization: 'other', specializationDetails: 'تغذية' }).success).toBe(true);
  });

  it.each([
    ['analyst', 'lab_analyst'], ['lab_tech', 'lab_analyst'], ['nurse', 'nurse'],
    ['pharmacist', 'pharmacist'], ['physiotherapist', 'physio'], ['dentist', 'doctor'], ['شيء', 'doctor'],
  ])('الاختصاص %s ← نوع المختصّ %s', (ui, db) => expect(mapSpecializationToDbType(ui)).toBe(db));
});

describe('تصدير CSV', () => {
  const headers = [{ key: 'name' as const, label: 'الاسم' }, { key: 'phone' as const, label: 'الهاتف' }];

  it('BOM عربيّ، وفواصلُ واقتباساتٌ مُهرَّبة، والفارغُ فارغ', () => {
    const csv = toCSV([{ name: 'علي، "الأب"', phone: null }], headers);
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv.split('\n')[1]).toBe('"علي، ""الأب""",');
  });

  it.each(['=HYPERLINK("http://x","اضغط")', '@SUM(A1)', '+cmd|x', '-2+3', '\t=1'])(
    '🚨 حقنُ الصيغ: %s يُعطَّل',
    (evil) => {
      const cell = toCSV([{ name: evil, phone: '' }], headers).split('\n')[1].split(',')[0].replace(/^"/, '');
      expect(cell.startsWith("'")).toBe(true);
    },
  );

  it('الهاتفُ والمبلغُ السالب لا يُشوَّهان', () => {
    expect(toCSV([{ name: '-5', phone: '+9647701234567' }], headers).split('\n')[1]).toBe('-5,+9647701234567');
  });

  it('لا صفوفَ ← لا ملفّ', () => expect(toCSV([], headers)).toBe(''));
});

describe('الفترات الزمنيّة', () => {
  it('الأرقامُ والوقتُ بالعربيّة', () => {
    expect(toArabicDigits(2026)).toBe('٢٠٢٦');
    expect(formatTimeArabic(0)).toBe('١٢:٠٠ ص');
    expect(formatTimeArabic(16, 30)).toBe('٤:٣٠ م');
  });

  it('التاريخُ النسبيّ', () => {
    const d = (n: number) => { const x = new Date(); x.setDate(x.getDate() + n); return x; };
    expect(formatDateRelative(d(0))).toBe('اليوم');
    expect(formatDateRelative(d(1))).toBe('غداً');
    expect(formatDateRelative(d(2))).toBe('بعد غد');
    expect(formatDateRelative(d(10))).toMatch(/[٠-٩]/);
  });

  it('الأيامُ تبدأ من الغد', () => {
    const dates = generateAvailableDates(7);
    expect(dates).toHaveLength(7);
    expect(formatDateRelative(dates[0])).toBe('غداً');
  });

  it('🚨 لا فترةَ «محجوزة» بلا مصدرٍ حقيقيّ، والفتراتُ ثابتةٌ بين رسمٍ وآخر', () => {
    const day = generateAvailableDates(1)[0];
    const a = generateTimeSlotsForDate(day);
    const b = generateTimeSlotsForDate(day);
    expect(a).toHaveLength(24); // 8:00 → 19:30 كلَّ نصف ساعة
    expect(a.every((s) => s.available)).toBe(true);
    expect(a.map((s) => s.available)).toEqual(b.map((s) => s.available));
  });

  it('التجميعُ صباحاً/ظهراً/مساءً يغطّي كلَّ الفترات', () => {
    const groups = groupTimeSlots(generateTimeSlotsForDate(generateAvailableDates(1)[0]));
    expect(groups.map((g) => g.slots.length)).toEqual([8, 8, 8]);
  });
});

describe('تقسيمُ المسارات بين الموقع والتطبيق', () => {
  it('الرئيسيّةُ والمدوّنة تسويق، واللوحةُ تطبيق، والدخولُ مشترك', () => {
    expect(isMarketingPath('/')).toBe(true);
    expect(isMarketingPath('/blog/x')).toBe(true);
    expect(isAppPath('/dashboard')).toBe(true);
    expect(isAppPath('/blog')).toBe(false);
    expect(isSharedPath('/login/phone')).toBe(true);
    expect(getDefaultPath('app')).toBe('/dashboard');
    expect(getDefaultPath('marketing')).toBe('/');
  });
});
