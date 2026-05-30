import {
  mapSpecializationToDbType,
  specializationLabels,
  type DbSpecialistType,
} from '@/lib/validations/auth-forms';

/**
 * 🛡️ V31: اختبارات حماية ضدّ bug specialist_type
 *
 * الخلفية:
 *   الـ UI يستخدم قيم اختصاص (analyst, lab_tech, physiotherapist...)
 *   لكن الـ DB constraint يقبل فقط (lab_analyst, nurse, doctor,
 *   pharmacist, physio, psychologist, nutritionist).
 *
 *   قبل V30، عدم التطابق كان يمنع المختصّين من رؤية الطلبات.
 *   هذه الاختبارات تضمن أنّ كل قيمة UI تُحوَّل لقيمة DB صالحة.
 */

// القيم الوحيدة المقبولة في users.specialist_type CHECK constraint
const VALID_DB_TYPES: DbSpecialistType[] = [
  'lab_analyst',
  'nurse',
  'doctor',
  'pharmacist',
  'physio',
  'psychologist',
  'nutritionist',
];

describe('mapSpecializationToDbType', () => {
  it('كل قيم الـ UI تُحوَّل لقيمة DB صالحة', () => {
    // كل مفتاح في specializationLabels يمثّل خياراً في الـ UI
    const uiValues = Object.keys(specializationLabels);
    expect(uiValues.length).toBeGreaterThan(0);

    for (const ui of uiValues) {
      const dbType = mapSpecializationToDbType(ui);
      expect(VALID_DB_TYPES).toContain(dbType);
    }
  });

  it('يربط التحاليل/فنّي المختبر بـ lab_analyst', () => {
    expect(mapSpecializationToDbType('analyst')).toBe('lab_analyst');
    expect(mapSpecializationToDbType('lab_tech')).toBe('lab_analyst');
  });

  it('يربط الممرّض بـ nurse (سحب الدم/التمريض)', () => {
    expect(mapSpecializationToDbType('nurse')).toBe('nurse');
  });

  it('يربط المعالج الطبيعي بـ physio', () => {
    expect(mapSpecializationToDbType('physiotherapist')).toBe('physio');
  });

  it('يربط طبيب الأسنان/الأشعة/العامّ بـ doctor', () => {
    expect(mapSpecializationToDbType('dentist')).toBe('doctor');
    expect(mapSpecializationToDbType('radiologist')).toBe('doctor');
    expect(mapSpecializationToDbType('doctor')).toBe('doctor');
  });

  it('يربط الصيدلي بـ pharmacist', () => {
    expect(mapSpecializationToDbType('pharmacist')).toBe('pharmacist');
  });

  it('قيمة "other" أو غير معروفة → doctor (افتراضي آمن)', () => {
    expect(mapSpecializationToDbType('other')).toBe('doctor');
    expect(mapSpecializationToDbType('unknown_xyz')).toBe('doctor');
    expect(mapSpecializationToDbType('')).toBe('doctor');
  });

  it('لا يُرجع أبداً قيمة خارج الـ constraint', () => {
    const samples = [
      'doctor', 'nurse', 'analyst', 'pharmacist', 'physiotherapist',
      'dentist', 'lab_tech', 'radiologist', 'other', 'garbage', '123',
    ];
    for (const s of samples) {
      expect(VALID_DB_TYPES).toContain(mapSpecializationToDbType(s));
    }
  });
});
