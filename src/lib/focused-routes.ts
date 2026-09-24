/**
 * مهامٌّ مُركَّزة: صفحاتٌ يُكمل فيها المريضُ شيئاً واحداً (رفع طلب) ولا
 * يُقاطَع فيها — لا شريط تنقّلٍ سفليّ (AppShell) ولا نوافذ ترويجيّة تنبثق
 * فوق زرّ الإرسال (طلبُ إذن الإشعارات كان يغطّي «تأكيد الحجز»).
 */
export const FOCUSED_TASK_ROUTES = ['/appointments/new'] as const;

export function isFocusedTaskRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return FOCUSED_TASK_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

/** شاشة الطوارئ: لا شيءَ ينبثق فوق زرّ الاتصال بالإسعاف. */
export function isEmergencyRoute(pathname: string | null | undefined): boolean {
  return !!pathname && /(^|\/)sos(\/|$)/.test(pathname);
}
