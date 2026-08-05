import { isSafeInternalPath, safeInternalPath } from '@/lib/auth/safe-redirect';

/**
 * 🔒 منع open-redirect بعد تسجيل الدخول
 *
 * الفحص السابق (`startsWith('/') && !startsWith('//')`) كان مكرّراً في 5 مواضع
 * ويسمح بـ `/\evil.com`: المتصفّحات تُطبّع `\` إلى `/` فيصير `//evil.com`،
 * أي توجيه إلى نطاق خارجي بعد الدخول — تصيّد فعّال لأنّ الرحلة بدأت من موقعنا.
 */

describe('🔒 يقبل المسارات الداخلية الحقيقية', () => {
  it.each(['/dashboard', '/appointments/123', '/specialist/orders?filter=new', '/'])(
    'يقبل %s',
    (p) => expect(isSafeInternalPath(p)).toBe(true)
  );
});

describe('🔒 يرفض متجهات الخروج من الموقع', () => {
  it('🚨 يرفض الشرطة العكسية (التجاوز المعروف)', () => {
    expect(isSafeInternalPath('/\\evil.com')).toBe(false);
    expect(isSafeInternalPath('/\\/evil.com')).toBe(false);
    expect(isSafeInternalPath('/path\\..\\evil')).toBe(false);
  });

  it('يرفض المسار البروتوكولي-النسبي', () => {
    expect(isSafeInternalPath('//evil.com')).toBe(false);
    expect(isSafeInternalPath('///evil.com')).toBe(false);
  });

  it('يرفض العناوين المطلقة والمخطّطات', () => {
    expect(isSafeInternalPath('https://evil.com')).toBe(false);
    expect(isSafeInternalPath('http://evil.com')).toBe(false);
    expect(isSafeInternalPath('javascript:alert(1)')).toBe(false);
    expect(isSafeInternalPath('data:text/html,x')).toBe(false);
  });

  it('يرفض المسارات النسبية وغير المطلقة', () => {
    expect(isSafeInternalPath('dashboard')).toBe(false);
    expect(isSafeInternalPath('../admin')).toBe(false);
  });

  it('يرفض محارف التحكّم والفراغات (تجاوز بالتشويش)', () => {
    expect(isSafeInternalPath('/\tevil')).toBe(false);
    expect(isSafeInternalPath('/\nevil')).toBe(false);
    expect(isSafeInternalPath(' /dashboard')).toBe(false);
  });

  it('يرفض الفارغ', () => {
    expect(isSafeInternalPath(null)).toBe(false);
    expect(isSafeInternalPath(undefined)).toBe(false);
    expect(isSafeInternalPath('')).toBe(false);
  });
});

describe('🔒 safeInternalPath يسقط إلى البديل', () => {
  it('يُعيد المسار الآمن كما هو', () => {
    expect(safeInternalPath('/appointments', '/dashboard')).toBe('/appointments');
  });

  it('🚨 يُعيد البديل عند محاولة الخروج', () => {
    expect(safeInternalPath('/\\evil.com', '/dashboard')).toBe('/dashboard');
    expect(safeInternalPath('https://evil.com', '/dashboard')).toBe('/dashboard');
    expect(safeInternalPath(null, '/dashboard')).toBe('/dashboard');
  });
});
