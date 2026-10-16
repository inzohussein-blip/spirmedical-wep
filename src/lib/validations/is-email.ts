/**
 * بريدٌ صالحٌ شكلاً — بلا تعبيرٍ منتظم.
 *
 * `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` يتراجع تراجعاً متعدّدَ الحدود على مدخلٍ مثل «!@!.!.!.…»
 * (CodeQL: polynomial ReDoS على مدخل المستخدم). هنا مرورٌ خطّيّ وحدٌّ للطول (RFC 5321: 254).
 */
export function isEmail(value: string): boolean {
  if (value.length > 254 || /\s/.test(value)) return false;
  const at = value.indexOf('@');
  if (at < 1 || at !== value.lastIndexOf('@')) return false;
  const domain = value.slice(at + 1);
  const dot = domain.lastIndexOf('.');
  return dot > 0 && dot < domain.length - 1 && !domain.includes('..');
}
