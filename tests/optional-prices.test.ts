import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import {
  hasPrice,
  formatPrice,
  formatPriceRange,
  formatNumber,
  count,
} from '@/lib/format/price';

/**
 * 💰 السعر اختياري على مقدّم الخدمة
 *
 * السياسة: يُدخله المزوّد إن شاء، وإن لم يفعل فلا يُعرض شيء — لا صفر، ولا
 * قيمة تخترعها المنصّة نيابةً عنه.
 *
 * الخلل الذي تحرسه: أعمدة الأسعار كانت تحمل قيماً افتراضية في قاعدة
 * البيانات (`cleaning_price_min DEFAULT 15000` وأخواتها)، ونماذج الإدارة
 * تملأ القيم نفسها مسبقاً. فمزوّدٌ لا يُدخل سعراً يظهر للمريض بسعرٍ لم
 * يضعه قطّ. وفي جدول الأطباء كان الافتراضي `0` أي «مجّاني».
 */

const MIGRATIONS = join(process.cwd(), 'supabase', 'migrations');
const sql = readdirSync(MIGRATIONS)
  .filter((f) => f.endsWith('.sql'))
  .sort()
  .map((f) => readFileSync(join(MIGRATIONS, f), 'utf8'))
  .join('\n');

describe('💰 دوالّ التنسيق تُميّز «غير محدَّد» عن «صفر»', () => {
  it('الفراغ ليس سعراً', () => {
    expect(hasPrice(null)).toBe(false);
    expect(hasPrice(undefined)).toBe(false);
    expect(formatPrice(null)).toBeNull();
    expect(formatNumber(undefined)).toBeNull();
  });

  it('🚨 الصفر ليس سعراً أيضاً (لا يعني «مجّاني»)', () => {
    expect(hasPrice(0)).toBe(false);
    expect(formatPrice(0)).toBeNull();
    expect(formatPriceRange(0, 0)).toBeNull();
  });

  it('السعر الموجود يُنسَّق بالدينار', () => {
    expect(hasPrice(15000)).toBe(true);
    expect(formatPrice(15000)).toContain('د.ع');
  });

  it('المدى يتحمّل غياب أحد طرفيه', () => {
    expect(formatPriceRange(5000, 12000)).toMatch(/5|٥/);
    expect(formatPriceRange(5000, null)).toContain('من');
    expect(formatPriceRange(null, 12000)).toContain('حتى');
    expect(formatPriceRange(null, null)).toBeNull();
  });

  it('العدّادات تختلف عن الأسعار: الصفر فيها معنىً صحيح', () => {
    expect(count(null)).toBe(0);
    expect(count(0)).toBe(0);
    expect(count(7)).toBe(7);
  });
});

describe('💰 لا قيم افتراضية للأسعار في قاعدة البيانات', () => {
  /** أعمدة أسعار يضبطها مقدّم الخدمة (لا سجلّات معاملات) */
  const PROVIDER_PRICE_TABLES = [
    'dental_clinics',
    'optical_stores',
    'mental_health_specialists',
    'nutritionists',
    'physio_specialists',
    'vaccine_clinics',
  ];

  it('ترحيل إزالة الافتراضيات موجود ويشمل كل جداول المزوّدين', () => {
    const migration = readFileSync(
      join(MIGRATIONS, '0013_optional_provider_prices.sql'),
      'utf8'
    );
    for (const t of PROVIDER_PRICE_TABLES) {
      expect(migration).toContain(`public.${t}`);
    }
    expect(migration).toContain('DROP DEFAULT');
    // الأطباء أيضاً (افتراضهم كان 0 = «مجّاني»)
    expect(migration).toContain('public.doctors');
  });

  it('🚨 كل عمود سعرٍ أُنشئ بافتراضي جرى إسقاط افتراضيه', () => {
    // أعمدة عُرّفت هكذا: `xxx_price… NUMERIC DEFAULT 15000`
    const created = new Set<string>();
    const re = /^\s*([a-z_]*price[a-z_]*)\s+(?:NUMERIC|INTEGER|numeric|integer)[^,\n]*DEFAULT\s+\d+/gim;
    let m: RegExpExecArray | null;
    while ((m = re.exec(sql)) !== null) created.add(m[1]);

    const dropped = new Set<string>();
    const re2 = /ALTER COLUMN\s+([a-z_]+)\s+DROP DEFAULT/gi;
    while ((m = re2.exec(sql)) !== null) dropped.add(m[1]);

    // الاستثناءات المقصودة: سجلّات معاملات لا أسعار معلَنة
    const TRANSACTION_COLUMNS = new Set(['price', 'total_price', 'draw_fee', 'base_price']);

    const stillDefaulted = [...created]
      .filter((c) => !dropped.has(c))
      .filter((c) => !TRANSACTION_COLUMNS.has(c))
      .sort();

    expect(stillDefaulted).toEqual([]);
  });
});

describe('💰 لا أسعار مثبَّتة في مسار الحجز', () => {
  it('🚨 حجز الطبيب لا يخترع سعراً', () => {
    const code = readFileSync(
      join(process.cwd(), 'src/app/(dashboard)/services/doctors/[id]/actions.ts'),
      'utf8'
    ).replace(/\/\/[^\n]*/g, ' ');

    // كانت زيارة العيادة 25000 والمتابعة 10000 مثبَّتتين
    expect(/price\s*=\s*\d{4,}/.test(code)).toBe(false);
    expect(code).toContain('let price: number | null');
  });

  it('نماذج الإدارة لا تملأ سعراً مسبقاً', () => {
    const FORMS = [
      'src/app/admin/optical/OpticalAdminClient.tsx',
      'src/app/admin/mental-health/MentalHealthAdminClient.tsx',
      'src/app/admin/nutrition/NutritionAdminClient.tsx',
    ];
    for (const rel of FORMS) {
      const code = readFileSync(join(process.cwd(), rel), 'utf8');
      const emptyForm = /const EMPTY[A-Z_]*[^=]*=\s*\{[\s\S]*?\n\};/.exec(code)?.[0] ?? '';
      expect(emptyForm.length).toBeGreaterThan(0);
      // لا سطر `xxx_price: 12345,` داخل النموذج الفارغ
      expect(/[a-z_]*price[a-z_]*:\s*\d+,/i.test(emptyForm)).toBe(false);
    }
  });
});
