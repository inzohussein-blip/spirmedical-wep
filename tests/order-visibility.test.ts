import { readFileSync } from 'fs';
import { join } from 'path';
import { SERVICES, getServiceById, type ServiceSpecialistType } from '@/lib/services/services-data';

/**
 * 📋 حارس ظهور الطلبات عبر النظام
 *
 * الخلفية: طابور المختصّ يفلتر بصرامة على `required_specialist_type`:
 *     .eq('required_specialist_type', specialistType)
 * فأيّ طلب يُنشأ بدون هذا الحقل **لا يظهر لأيّ مختصّ إطلاقاً** — يراه المريض
 * في «طلباتي» ويراه الأدمن، لكنّه لا يصل إلى مَن ينفّذه، فيبقى «قيد الانتظار» أبداً.
 *
 * كان هذا حال كل خدمة تمرّ عبر المعالج العامّ (`createAppointmentV2`): تركيب
 * مغذي، فحص PCR، الاستشارات الثلاث، توصيل الأدوية، طبيب الأسرة. هذه الاختبارات
 * تمنع تكرار الحالة عند إضافة أي خدمة جديدة.
 */

// خدمات تُنفَّذ في منشأة (لا مختصّ مُرسَل) — ينسّقها الأدمن، وغيابُ النوع فيها مقصود
const FACILITY_ONLY_SERVICES = new Set(['hospital-booking']);

const VALID_TYPES: ServiceSpecialistType[] = [
  'lab_analyst', 'nurse', 'doctor', 'pharmacist', 'physio', 'psychologist', 'nutritionist',
];

describe('📋 كل خدمة متاحة توصِل طلبها إلى مختصّ', () => {
  it('كل خدمة متاحة إمّا لها specialistType أو مُعلنة كخدمة منشأة', () => {
    const invisible = SERVICES.filter(
      (s) => s.available && !s.specialistType && !FACILITY_ONLY_SERVICES.has(s.id)
    ).map((s) => `${s.id} (${s.nameAr})`);

    expect(invisible).toEqual([]);
  });

  it('كل specialistType قيمة صالحة في قيد قاعدة البيانات', () => {
    for (const s of SERVICES) {
      if (!s.specialistType) continue;
      expect(VALID_TYPES).toContain(s.specialistType);
    }
  });

  it('الخدمات ذات التدفّق المخصّص مربوطة بنوعها الصحيح', () => {
    expect(getServiceById('blood-draw')?.specialistType).toBe('lab_analyst');
    expect(getServiceById('home-nursing')?.specialistType).toBe('nurse');
  });

  it('خدمات المنشأة معلومة ومقصودة (لا تُضاف بالخطأ)', () => {
    for (const id of FACILITY_ONLY_SERVICES) {
      const svc = getServiceById(id);
      expect(svc).toBeDefined();
      expect(svc!.specialistType).toBeUndefined();
    }
  });
});

describe('📋 مسار الإنشاء يضبط required_specialist_type فعلاً', () => {
  const actions = readFileSync(
    join(process.cwd(), 'src/app/(dashboard)/appointments/new/actions.ts'),
    'utf8'
  );

  it('createAppointmentV2 يشتقّ النوع من كتالوج الخدمات', () => {
    // يجب أن يستورد الكتالوج ويضبط العمود — لا أن يترك الطلب بلا نوع
    expect(actions).toContain("from '@/lib/services/services-data'");
    expect(actions).toMatch(/required_specialist_type\s*=\s*serviceMeta\.specialistType/);
  });

  it('تدفّقا سحب الدم والتمريض يضبطان نوعيهما', () => {
    expect(actions).toContain("required_specialist_type: 'lab_analyst'");
    expect(actions).toContain("required_specialist_type: 'nurse'");
  });
});

describe('📋 طابور المختصّ ما زال يفلتر على العمود نفسه', () => {
  // لو تغيّر الفلتر مستقبلاً، يجب مراجعة هذه الحارسات كلّها
  const queue = readFileSync(
    join(process.cwd(), 'src/app/(specialist)/specialist/orders/page.tsx'),
    'utf8'
  );

  it('يفلتر على required_specialist_type', () => {
    expect(queue).toMatch(/\.eq\(\s*['"]required_specialist_type['"]/);
  });
});
