/**
 * أرقام هواتف المنشآت (مستشفيات، صيدليات، مختبرات، عيادات).
 *
 * الأرقام المبذورة كانت مُختلَقة (07712345001، 07700000001 …) ومقرونةً بأسماء
 * منشآتٍ حقيقية؛ فكان زرّ «اتصل» يطلب رقمَ شخصٍ لا علاقة له. قرار المالك:
 * يُحذف جزءٌ من الرقم ويُعرض «0770 xxx xxxx» حتى يُستبدل برقمٍ موثَّق (0045).
 * والرقمُ المُقنَّع لا يصير رابطَ اتصالٍ أبداً.
 */

/** «0770 xxx xxxx» / «+964 770 xxx xxxx» — يُبقي بادئة الشبكة ويُخفي الباقي. */
export function maskPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length <= 4) return raw; // أرقام طوارئ قصيرة (122) حقيقية
  if (raw.trim().startsWith('+964') || digits.startsWith('964')) {
    return `${raw.trim().startsWith('+') ? '+' : ''}964 ${digits.slice(3, 6)} xxx xxxx`;
  }
  return `${digits.slice(0, 4)} xxx xxxx`;
}

/** رقمٌ يمكن طلبُه: أرقامٌ وفواصل فقط، لا «x» ولا نصّ. */
export function isDialable(raw: string | null | undefined): raw is string {
  if (!raw) return false;
  if (/[^\d+\s\-()]/.test(raw)) return false;
  return raw.replace(/\D/g, '').length >= 3;
}
