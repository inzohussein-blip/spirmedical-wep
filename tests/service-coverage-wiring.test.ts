import { readFileSync } from 'fs';
import { join } from 'path';
import { areaCovering, type ServiceArea, type Ring } from '@/lib/service-areas';

/**
 * 🧭 حارس ربط مناطق الخدمة بالتطبيق
 *
 * بنيتُ `service_areas` ولوحةَ رسمها، ثمّ تركتُها بلا مستهلك: المشرف يرسم
 * والتطبيق لا يسأل. وهو ذاتُ العطب الذي بُني الجدول لعلاجه — مثل قائمة
 * أمنيات التجميل التي كانت تجمع بيانات بلا صفحةٍ تعرضها.
 *
 * وأخطرُ ما في الربط هو **الفشل المفتوح**: الجدول اليوم فارغ، فإن عُدّ
 * الفراغُ «لا مكان مخدوم» رأى كلّ مريضٍ في العراق تحذيراً بأنّ منطقته
 * خارج النطاق. فذلك أوّل ما يُحرَس هنا.
 */

const SQ: Ring = [[44.2, 33.2], [44.6, 33.2], [44.6, 33.5], [44.2, 33.5]];

const area = (id: string, ring: Ring, active = true): ServiceArea => ({
  id, name_ar: id, governorate: 'بغداد', polygon: ring,
  color: '#0F766E', is_active: active, notes: null,
  created_at: '2026-01-01T00:00:00Z',
});

describe('سلوك التغطية', () => {
  it('لا نطاقات ⇒ لا قيد (وهي حال الجدول اليوم)', () => {
    expect(areaCovering([], 33.3152, 44.3661)).toBeNull();
  });

  it('داخل النطاق ⇒ يُعاد اسمه', () => {
    expect(areaCovering([area('الكرادة', SQ)], 33.3152, 44.3661)?.name_ar).toBe('الكرادة');
  });

  it('خارج كلّ النطاقات ⇒ null', () => {
    expect(areaCovering([area('الكرادة', SQ)], 30.5085, 47.7804)).toBeNull();
  });

  it('النطاق المعطّل لا يُغطّي', () => {
    expect(areaCovering([area('معطّلة', SQ, false)], 33.3152, 44.3661)).toBeNull();
  });
});

describe('الخطّاف يفشل مفتوحاً', () => {
  const src = readFileSync(
    join(process.cwd(), 'src', 'lib', 'hooks', 'useServiceCoverage.ts'),
    'utf8'
  );

  it('الجدول الفارغ حالةٌ مستقلّة اسمها «غير مقيّد» لا «خارج النطاق»', () => {
    expect(src).toContain("'unrestricted'");
    expect(src).toMatch(/areas\.length\s*===\s*0[\s\S]{0,80}unrestricted/);
  });

  it('فشل القراءة يُعامَل كقائمةٍ فارغة لا كخطأ يُوقف النموذج', () => {
    expect(src).toMatch(/catch\s*\{[\s\S]{0,120}cachedAreas\s*=\s*\[\]/);
    expect(src).toMatch(/error\s*\|\|\s*!data\s*\?\s*\[\]/);
  });

  it('لا يُحكم بشيءٍ قبل وصول البيانات', () => {
    // `areas === null` يعني «لم تصل بعد» — لا «فارغة»
    expect(src).toMatch(/areas\s*===\s*null[\s\S]{0,60}loading/);
  });

  it('جلبةٌ واحدة لكلّ جلسة لا واحدةٌ لكلّ إظهار', () => {
    expect(src).toContain('cachedAreas');
    expect(src).toContain('inflight');
  });
});

describe('المنتقي يعرض النتيجة', () => {
  const picker = readFileSync(
    join(process.cwd(), 'src', 'components', 'maps', 'UserLocationPicker.tsx'),
    'utf8'
  );

  it('المنتقي يستدعي الخطّاف — فيصل الربطُ إلى مواضع الاستعمال الأربعة', () => {
    expect(picker).toContain('useServiceCoverage');
    expect(picker).toMatch(/useServiceCoverage\(\s*coords\s*\)/);
  });

  it('يُعرض تحذيرٌ خارج النطاق وتأكيدٌ داخله', () => {
    expect(picker).toMatch(/coverage\.status\s*===\s*'outside'/);
    expect(picker).toMatch(/coverage\.status\s*===\s*'inside'/);
  });

  it('لا يُعرض شيءٌ في حالتَي «غير مقيّد» و«جارٍ التحميل»', () => {
    // لا فرعَ يعرض هاتين الحالتين — الصمت هو السلوك الصحيح
    expect(picker).not.toMatch(/coverage\.status\s*===\s*'unrestricted'/);
    expect(picker).not.toMatch(/coverage\.status\s*===\s*'loading'/);
  });

  it('التحذير لا يمنع المتابعة — والنصّ يقول ذلك صراحةً', () => {
    expect(picker).toContain('يمكنك المتابعة');
    // ولا زرَّ معطَّلٌ ولا `return` يقطع بناءً على التغطية
    expect(picker).not.toMatch(/disabled=\{[^}]*coverage/);
  });
});
