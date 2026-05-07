import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * طابق كل المسارات ما عدا:
     * - _next/static (الملفات الثابتة)
     * - _next/image (تحسين الصور)
     * - favicon.ico, robots.txt, sitemap.xml
     * - api/og (OG image generator - يجب أن يكون عاماً)
     * - api/health (health check)
     * - الصور (svg, png, jpg, jpeg, gif, webp, ico)
     * - manifest.json, apple-touch-icon, robots.txt
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|apple-touch-icon|api/og|api/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|txt|xml)$).*)',
  ],
};
