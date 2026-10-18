/**
 * 🌐 خطأٌ في متصفّح مستخدم ← `/api/ops/client-error` ← رصدُ الأخطاء (0057).
 *
 * خمسُ رسائل لكلّ تحميل صفحة على الأكثر، ولا تتكرّر الرسالةُ نفسُها، ولا ضجيجَ معروف (إضافاتُ المتصفّح،
 * «Script error.» من نطاقٍ آخر بلا تفاصيل، حلقةُ ResizeObserver). لا يرمي أبداً.
 */
export type ClientErrorKind = 'error' | 'unhandledrejection' | 'boundary';

const NOISE = [
  /^script error\.?$/i,
  /resizeobserver loop/i,
  /(chrome|moz|safari(-web)?)-extension:\/\//i,
  /^cancelled$|^abort(ed)?error/i,
];

export function isNoise(message: string, stack?: string): boolean {
  if (!message.trim()) return true;
  return NOISE.some((re) => re.test(message) || (stack ? re.test(stack) : false));
}

const sent = new Set<string>();
const MAX_PER_PAGE = 5;

export function reportClientError(error: unknown, kind: ClientErrorKind, extra: { digest?: string } = {}): void {
  try {
    if (typeof window === 'undefined') return;
    const e = error instanceof Error ? error : new Error(typeof error === 'string' ? error : (() => {
      try { return JSON.stringify(error); } catch { return String(error); }
    })());
    const message = (e.message || e.name || '').slice(0, 500);
    const stack = (e.stack || '').split('\n').slice(0, 8).join('\n').slice(0, 2000);
    if (isNoise(message, stack)) return;
    const sig = `${kind}|${message}`;
    if (sent.has(sig) || sent.size >= MAX_PER_PAGE) return;
    sent.add(sig);

    const body = JSON.stringify({
      kind,
      message,
      stack: stack || undefined,
      digest: extra.digest,
      url: window.location.pathname,
    });
    const url = '/api/ops/client-error';
    if (navigator.sendBeacon?.(url, new Blob([body], { type: 'application/json' }))) return;
    void fetch(url, { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'application/json' } }).catch(() => {});
  } catch {
    /* التبليغُ لا يُسقط الصفحة */
  }
}

/** للاختبارات */
export function __resetClientErrorReporter() {
  sent.clear();
}
