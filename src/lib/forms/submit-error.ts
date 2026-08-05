/**
 * 🌐 رسالة خطأ مفهومة عند فشل إرسال الطلب
 *
 * أفعال الخادم في Next **ترمي** استثناءً عند انقطاع الشبكة، ولا تُعيد
 * `{ success:false }`. وكان ذلك يُنتج سلوكين سيّئين في تدفّقات الحجز:
 *  • سحب الدم والمعالج العامّ: `try/finally` **بلا catch** — فيُبتلع الخطأ ولا
 *    يرى المريض شيئاً بعد ملء النموذج كاملاً؛ الزرّ يعود لحالته فحسب.
 *  • التمريض: يلتقط لكنّه يعرض `err.message` الخام («Failed to fetch») لمريض
 *    عربيّ — رسالة تقنية لا تقول له ماذا يفعل.
 *
 * هذه الدالة تُترجم الفشل إلى رسالة عربية **قابلة للتنفيذ**، وتُطمئن المريض أنّ
 * بياناته لم تُفقد (النموذج يبقى معبّأً — لا نُعيد تعيينه عند الفشل).
 */

/** هل الخطأ ناتج عن الشبكة/عدم الاتصال؟ */
export function isNetworkError(err: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;

  const message =
    err instanceof Error ? err.message : typeof err === 'string' ? err : '';

  return /failed to fetch|networkerror|network request failed|load failed|fetch failed|err_internet|err_network|timeout/i.test(
    message
  );
}

/**
 * رسالة موجّهة للمريض. تُبقي رسائل الخادم المفهومة (العربية) كما هي،
 * وتستبدل الأعطال التقنية بنصّ يشرح الإجراء التالي.
 */
export function submitErrorMessage(err: unknown): string {
  if (isNetworkError(err)) {
    return 'لا يوجد اتصال بالإنترنت. بياناتك محفوظة في الصفحة — تحقّق من الاتصال ثم أعد المحاولة.';
  }

  const message = err instanceof Error ? err.message : '';

  // رسائل الخادم العربية مفهومة أصلاً → تُعرض كما هي
  if (message && /[؀-ۿ]/.test(message)) return message;

  return 'تعذّر إرسال الطلب. بياناتك محفوظة — حاول مرة أخرى.';
}
