/**
 * 🗺️ المحافظاتُ المخدومة — المصدرُ الواحد لكلّ ادّعاءٍ عن التغطية
 *
 * كان الموقع يُعلن التغطيةَ بخمس صيغٍ متعارضة:
 *
 *   وصفُ الجذر (layout.tsx) ........ «الفرات الأوسط · النجف · كربلاء · بابل»
 *   وصفُ الرئيسية (page.tsx) ....... «في كل المحافظات العراقية»
 *   عدّادُ الإحصاءات (Stats.tsx) ... «18 محافظة عراقية · تغطية شاملة»
 *   بياناتُ JSON-LD .................. 17 مُدخلاً، و«بابل» مكرّرةٌ مرّتين
 *   خريطةُ الرئيسية .................. 8 محافظات
 *
 * ومحرّكاتُ البحث المحلّيّ تقارن الادّعاءات: الموقع، والبيانات المنظَّمة،
 * وملفّ Google Business. والتعارضُ يُضعف الثقةَ بها جميعاً.
 *
 * فهذه القائمة هي المرجع: البياناتُ المنظَّمة تُشتقّ منها، وصفحةُ
 * الخدمة تُبنى منها، والحارسُ يشترط أن تطابقها خريطةُ الرئيسية.
 * بُذرت من الخريطة لأنّها أدقُّ ادّعاءٍ مرئيّ (بإحداثيّات).
 *
 * ⚠️ على المالك تأكيدُها: أضِف محافظةً هنا حين تُخدَم فعلاً، لا قبله.
 */

export interface ServedCity {
  /** الاسم كما يكتبه الباحث */
  name: string;
  /** مُعرّفٌ لاتينيّ ثابت — للمراسي والروابط */
  slug: string;
  lat: number;
  lng: number;
}

export const SERVED_CITIES: readonly ServedCity[] = [
  { name: 'النجف', slug: 'najaf', lat: 31.9997, lng: 44.3296 },
  { name: 'كربلاء', slug: 'karbala', lat: 32.6149, lng: 44.0245 },
  { name: 'بابل', slug: 'babil', lat: 32.4637, lng: 44.4209 },
  { name: 'الديوانية', slug: 'diwaniyah', lat: 31.9923, lng: 44.9249 },
  { name: 'بغداد', slug: 'baghdad', lat: 33.3152, lng: 44.3661 },
  { name: 'البصرة', slug: 'basra', lat: 30.5085, lng: 47.7804 },
  { name: 'كركوك', slug: 'kirkuk', lat: 35.4681, lng: 44.3923 },
  { name: 'أربيل', slug: 'erbil', lat: 36.1901, lng: 44.0094 },
];

/** للبيانات المنظَّمة: `areaServed` */
export function areaServedJsonLd() {
  return [
    { '@type': 'Country', name: 'العراق' },
    ...SERVED_CITIES.map((c) => ({ '@type': 'AdministrativeArea', name: c.name })),
  ];
}

/** أصلُ الموقع — لروابط البيانات المنظَّمة، وهي لا تُحلّ نسبةً إلى metadataBase */
export const SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://spir-medical.com';

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_ORIGIN).toString();
}
