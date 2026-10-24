/**
 * 🌐 الأصلُ القانونيّ للموقع — مصدرٌ واحد لكلّ canonical وsitemap وrobots وJSON-LD.
 *
 * قِيس (16 تشرين الأول): نطاقُ Vercel الأساسيّ **www.spir-medical.com**، والنطاقُ العاري
 * `spir-medical.com` يحوّل إليه بـ308. وكان كلُّ ما يُعلنه الموقع (canonical كلّ صفحة، روابطُ
 * sitemap، `Host` في robots، البياناتُ المنظَّمة) يشير إلى العاري — فيرى Search Console كلَّ
 * صفحةٍ «صفحةً بتحويل» لا نهائيّة. فالعاري يُحوَّل هنا إلى www حتى لو جاء من المتغيّر.
 */
export const CANONICAL_HOST = 'www.spir-medical.com';

export function canonicalOrigin(raw: string | undefined = process.env.NEXT_PUBLIC_SITE_URL): string {
  const fallback = `https://${CANONICAL_HOST}`;
  if (!raw) return fallback;
  try {
    const u = new URL(raw);
    if (u.hostname === 'spir-medical.com') u.hostname = CANONICAL_HOST;
    return u.origin;
  } catch {
    return fallback;
  }
}

export const SITE_ORIGIN = canonicalOrigin();

/** نطاقُ الإنتاج على Vercel — نسخةٌ مطابقة بلا تحويل (محتوى مكرَّر) فيُحوَّل إلى الأصل */
export const VERCEL_PRODUCTION_HOST = 'spirmedical-wep.vercel.app';

/** نطاقُ النسخة الاحتياطيّة على Netlify — مثلُه: يُحوَّل إلى الأصل لمن يزوره مباشرة */
export const NETLIFY_PRODUCTION_HOST = 'spir-medical.netlify.app';

/** نطاقاتُ المنصّتين: البوّابةُ (`edge/failover`) تطلبها، والزائرُ المباشر يُحوَّل منها إلى الأصل */
export const PLATFORM_HOSTS: readonly string[] = [VERCEL_PRODUCTION_HOST, NETLIFY_PRODUCTION_HOST];
