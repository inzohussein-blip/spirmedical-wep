import { isNetworkError, submitErrorMessage } from '@/lib/forms/submit-error';

/**
 * 🌐 فشل إرسال الطلب أثناء انقطاع الشبكة
 *
 * أفعال الخادم في Next **ترمي** عند الانقطاع ولا تُعيد `{success:false}`.
 * وكان ذلك يُنتج: صمتاً تامّاً في تدفّقَي سحب الدم والمعالج العامّ (`try/finally`
 * بلا catch)، ورسالة تقنية إنجليزية في التمريض — بعد أن يملأ المريض النموذج كاملاً.
 */

const onLine = (value: boolean) =>
  Object.defineProperty(globalThis.navigator, 'onLine', {
    value,
    configurable: true,
  });

describe('🌐 كشف أخطاء الشبكة', () => {
  afterEach(() => onLine(true));

  it('يكشف رسائل الجلب الشائعة عبر المتصفّحات', () => {
    for (const m of [
      'Failed to fetch',
      'NetworkError when attempting to fetch resource.',
      'Network request failed',
      'Load failed',
      'fetch failed',
    ]) {
      expect(isNetworkError(new Error(m))).toBe(true);
    }
  });

  it('يعتمد حالة المتصفّح offline مهما كانت الرسالة', () => {
    onLine(false);
    expect(isNetworkError(new Error('أي شيء'))).toBe(true);
  });

  it('لا يعدّ أخطاء التحقّق أخطاءَ شبكة', () => {
    expect(isNetworkError(new Error('العنوان قصير جداً'))).toBe(false);
    expect(isNetworkError(new Error('permission_denied'))).toBe(false);
  });
});

describe('🌐 الرسالة الموجّهة للمريض', () => {
  afterEach(() => onLine(true));

  it('🚨 عند الانقطاع: تشرح الإجراء وتطمئن أنّ البيانات محفوظة', () => {
    const msg = submitErrorMessage(new Error('Failed to fetch'));
    expect(msg).toContain('لا يوجد اتصال');
    expect(msg).toContain('بياناتك محفوظة');
  });

  it('تُبقي رسائل الخادم العربية كما هي (مفهومة أصلاً)', () => {
    expect(submitErrorMessage(new Error('العنوان قصير جداً'))).toBe('العنوان قصير جداً');
  });

  it('تستبدل الأعطال التقنية الإنجليزية برسالة مفهومة', () => {
    const msg = submitErrorMessage(new Error('TypeError: undefined is not a function'));
    expect(msg).not.toContain('TypeError');
    expect(msg).toContain('حاول مرة أخرى');
  });

  it('تتحمّل قيم الخطأ غير المتوقّعة', () => {
    expect(submitErrorMessage(null)).toContain('تعذّر إرسال الطلب');
    expect(submitErrorMessage(undefined)).toContain('تعذّر إرسال الطلب');
    expect(submitErrorMessage({})).toContain('تعذّر إرسال الطلب');
  });
});
