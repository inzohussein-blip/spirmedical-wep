import { headers } from 'next/headers';
import { clientIpFrom } from '@/lib/edge-proxy';

/**
 * مساعدات مشتركة لإجراءات المصادقة (Server Actions/Routes).
 * تُوحّد نسخاً مكررة كانت في login/register/admin.
 */

/** أول IP من ترويسات الوكيل، أو 'unknown'. */
export async function getClientIp(): Promise<string> {
  return clientIpFrom(await headers()) ?? 'unknown';
}

/**
 * هل الخطأ هو إشارة NEXT_REDIRECT الداخلية؟ يجب إعادة رميها لا ابتلاعها.
 */
export function isNextRedirect(err: unknown): boolean {
  return (
    err instanceof Error &&
    'digest' in err &&
    typeof (err as { digest?: string }).digest === 'string' &&
    (err as { digest: string }).digest.includes('NEXT_REDIRECT')
  );
}
