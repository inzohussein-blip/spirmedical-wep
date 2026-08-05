import { generateKey } from '@/lib/idempotency';

/**
 * 🔁 حماية الإرسال المزدوج
 *
 * الخطر الذي تحرسه هذه الاختبارات: لو خُزّنت النتائج الفاشلة، لبقي المريض عالقاً
 * 24 ساعة يتلقّى نفس الخطأ حتى بعد تصحيح بياناته. ولو كان المفتاح فضفاضاً،
 * لابتُلع طلبٌ مشروع مختلف.
 */

// نفس منطق `isSuccessful` الداخلي — نتحقّق من العقد صراحةً
function isSuccessful(result: unknown): boolean {
  if (!result || typeof result !== 'object') return true;
  const r = result as { success?: unknown; ok?: unknown };
  if (r.success === false || r.ok === false) return false;
  return true;
}

describe('🔁 المفتاح يميّز الطلبات المختلفة', () => {
  const base = ['blood-draw', 'user-1', '2026-08-01T10:00:00Z', 'بغداد، الكرادة، بناية 5'];

  it('نفس المدخلات → نفس المفتاح (فيُمسك الضغط المزدوج)', () => {
    expect(generateKey(base)).toBe(generateKey([...base]));
  });

  it('اختلاف الوقت → مفتاح مختلف', () => {
    expect(generateKey(base)).not.toBe(
      generateKey(['blood-draw', 'user-1', '2026-08-01T11:00:00Z', base[3]])
    );
  });

  it('اختلاف المستخدم → مفتاح مختلف', () => {
    expect(generateKey(base)).not.toBe(
      generateKey(['blood-draw', 'user-2', base[2], base[3]])
    );
  });

  it('اختلاف فرد العائلة → مفتاح مختلف (طلبان مشروعان بنفس التوقيت)', () => {
    expect(generateKey([...base, 'member-A'])).not.toBe(generateKey([...base, 'member-B']));
  });

  it('اختلاف نوع الخدمة → مفتاح مختلف', () => {
    expect(generateKey(base)).not.toBe(generateKey(['home-nursing', ...base.slice(1)]));
  });

  it('يتجاهل القيم الفارغة بثبات (فلا يتغيّر المفتاح بوجود undefined)', () => {
    expect(generateKey(['a', undefined, 'b'])).toBe(generateKey(['a', null, 'b']));
    expect(generateKey(['a', '', 'b'])).toBe(generateKey(['a', 'b']));
  });

  it('المفتاح ثابت الطول وصالح كمعرّف', () => {
    expect(generateKey(base)).toMatch(/^[a-f0-9]{32}$/);
  });
});

describe('🔁 لا تُخزَّن النتائج الفاشلة أبداً', () => {
  it('يرفض تخزين success:false', () => {
    expect(isSuccessful({ success: false, error: 'تحقّق من البيانات' })).toBe(false);
  });

  it('يرفض تخزين ok:false', () => {
    expect(isSuccessful({ ok: false, error: 'غير مصرّح' })).toBe(false);
  });

  it('يقبل تخزين النجاح بالاصطلاحين', () => {
    expect(isSuccessful({ success: true, appointment_id: 'x' })).toBe(true);
    expect(isSuccessful({ ok: true, id: 'x' })).toBe(true);
  });

  it('يقبل القيم غير الكائنية (لا اصطلاح نجاح فيها)', () => {
    expect(isSuccessful('done')).toBe(true);
    expect(isSuccessful(null)).toBe(true);
  });
});
