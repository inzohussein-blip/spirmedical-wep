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

describe('📋 كل إدراج في appointments يشتقّ النوع (فحص لكل استدعاء لا لكل ملف)', () => {
  /**
   * الفحص السابق كان على مستوى **الملف** (`toContain`)، فمرّ ملفٌ فيه
   * `createAppointmentV2` صحيح بينما دالةٌ أخرى في الملف نفسه
   * (`createAppointment` القديمة) لا تضبط العمود إطلاقاً. كما لم يكن
   * `/api/appointments` مشمولاً أصلاً. الآن نفحص **كل استدعاء `.insert`**.
   *
   * ملاحظة: المشغّل `trg_auto_required_specialist` لا يُنقذ هذه الحالات لأنّ
   * شرطه `NEW.service_id IS NOT NULL`، ودالته تعرف معرّفات خدمات قديمة
   * (`lab-test`, `injection`, `consultation-general` …) لا وجود لها في
   * الكتالوج الحالي — فتُرجع `'doctor'` لكل خدمة تقريباً.
   */
  const INSERT_FILES = [
    'src/app/(dashboard)/appointments/new/actions.ts',
    'src/app/(dashboard)/services/booking/actions.ts',
    'src/app/(dashboard)/services/doctors/[id]/actions.ts',
    'src/app/api/appointments/route.ts',
    'src/app/api/cron/nursing-recurring/route.ts',
  ];

  /**
   * يُزيل التعليقات ونصوص السلاسل النثرية قبل الفحص.
   *
   * بدون هذا يمرّ الحارس **فارغاً**: مجرّد ذكر الاسم في تعليقٍ توضيحي أو داخل
   * `logger.info('… without required_specialist_type')` كان يكفي لإرضائه.
   *
   * ⚠️ يجب أن يعمل على **الملف كاملاً** لا على نافذةٍ مقتطعة: اقتطاعُ نافذةٍ
   * بعدد أحرفٍ ثابت قد يقع في منتصف سلسلة نصّية فيترك اقتباساً غير مُغلق،
   * فيلتهم التعبيرُ النمطيّ مساحاتٍ واسعة من الكود الصحيح (وهو ما أنتج
   * إنذاراً كاذباً على مسار الأطباء).
   *
   * السلاسل القصيرة الشبيهة بالمعرّفات (`'appointments'`، `'nurse'`) تُترك كما
   * هي لأنّها جزءٌ من المعنى المفحوص؛ والنثر (فيه فراغات) يُفرَّغ.
   */
  function stripNoise(code: string): string {
    const keepIdentLike = (s: string) =>
      /^(['"`])[a-z_][a-z0-9_-]*\1$/i.test(s) ? s : s[0] + s[0];

    return code
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/\/\/[^\n]*/g, ' ')
      .replace(/'(?:\\.|[^'\\])*'/g, keepIdentLike)
      .replace(/"(?:\\.|[^"\\])*"/g, keepIdentLike)
      .replace(/`(?:\\.|[^`\\])*`/g, keepIdentLike);
  }

  /** يلتقط كل `.from('appointments') … .insert(` مع نافذة الكود حولها */
  function appointmentInserts(code: string): string[] {
    const clean = stripNoise(code);
    const out: string[] = [];
    const re = /\.from\(\s*['"]appointments['"]\s*\)\s*\.insert\(/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(clean)) !== null) {
      out.push(clean.slice(Math.max(0, m.index - 2500), m.index + 1200));
    }
    return out;
  }

  /** إسنادٌ حقيقي للعمود: `required_specialist_type:` أو `… = …` */
  const ASSIGNS = /required_specialist_type\s*[:=][^=]/;

  it.each(INSERT_FILES)('%s: كل إدراج يضبط required_specialist_type', (rel) => {
    const code = readFileSync(join(process.cwd(), rel), 'utf8');
    const inserts = appointmentInserts(code);
    expect(inserts.length).toBeGreaterThan(0);

    const missing = inserts.filter((ctx) => !ASSIGNS.test(ctx));
    expect(missing.length).toBe(0);
  });

  it('🧪 الحارس يكشف فعلاً: ذكرُ الاسم في تعليق أو سلسلة لا يُرضيه', () => {
    const decoy =
      `// required_specialist_type: 'nurse'\n` +
      `logger.info('created without required_specialist_type');\n` +
      `supabase.from('appointments').insert({ user_id: id });`;
    expect(ASSIGNS.test(stripNoise(decoy))).toBe(false);

    const real = `supabase.from('appointments').insert({ required_specialist_type: 'nurse' });`;
    expect(ASSIGNS.test(stripNoise(real))).toBe(true);
  });

  it('🚨 الدالة الميتة createAppointment أُزيلت (كانت تُدرج بلا نوع)', () => {
    const code = readFileSync(
      join(process.cwd(), 'src/app/(dashboard)/appointments/new/actions.ts'),
      'utf8'
    );
    expect(/export async function createAppointment\s*\(/.test(code)).toBe(false);
  });

  it('🚨 مسار /api/appointments يقبل service_id ويشتقّ منه النوع', () => {
    const code = readFileSync(
      join(process.cwd(), 'src/app/api/appointments/route.ts'),
      'utf8'
    );
    expect(code).toContain('getServiceById');
    expect(code).toContain('required_specialist_type');

    const schema = readFileSync(
      join(process.cwd(), 'src/lib/validations/appointment.ts'),
      'utf8'
    );
    expect(schema).toContain('service_id');
  });
});

describe('📋 كل مسار إنشاء يُشعر المختصّين المؤهّلين', () => {
  /**
   * الطلب يصل الطابور صحيحاً، لكن إن لم يُشعَر أحد فهو ينتظر حتى يفتح مختصٌّ
   * التطبيق صدفةً. القالب كان موجوداً لكنّه يُستدعى فقط عند إسناد الأدمن يدوياً.
   */
  const CREATE_PATHS = [
    'src/app/(dashboard)/appointments/new/actions.ts',
    'src/app/(dashboard)/services/doctors/[id]/actions.ts',
  ];

  it.each(CREATE_PATHS)('%s يستدعي notifyEligibleSpecialistsOfNewOrder', (rel) => {
    const code = readFileSync(join(process.cwd(), rel), 'utf8');
    expect(code).toContain('notifyEligibleSpecialistsOfNewOrder');
  });

  it('الدالة تفلتر على المختصّين المعتمَدين فقط', () => {
    const tpl = readFileSync(
      join(process.cwd(), 'src/lib/services/push-templates.ts'),
      'utf8'
    );
    expect(tpl).toContain('notifyEligibleSpecialistsOfNewOrder');
    expect(tpl).toMatch(/\.eq\(\s*['"]approval_status['"]\s*,\s*['"]approved['"]/);
    expect(tpl).toMatch(/\.eq\(\s*['"]role['"]\s*,\s*['"]specialist['"]/);
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
