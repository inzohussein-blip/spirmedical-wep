import { readFile } from 'fs/promises';
import { join } from 'path';
import { ImageResponse } from 'next/og';
import type { CSSProperties } from 'react';

export const dynamic = 'force-dynamic';
export const alt = 'Spir Medical · سباير ميديكال';
export const contentType = 'image/png';

/**
 * ════════════════════════════════════════════════════════════════
 * 🖼️ OG Image Endpoint (V25.4 - Hero Layout)
 * ════════════════════════════════════════════════════════════════
 * تُستخدم تلقائياً عند مشاركة الموقع على:
 *   - WhatsApp, Telegram, Facebook, Twitter, LinkedIn
 *   - AI agents (Perplexity, Bing AI)
 *   - Slack, Discord
 *
 * URL: /api/og
 * مع params: /api/og?title=...&subtitle=...&headline=...
 * ════════════════════════════════════════════════════════════════
 */

/**
 * الخطُّ من ملفّاتٍ في المستودع (`assets/og/`، IBM Plex Sans Arabic — خطُّ الموقع). بلا خطٍّ يجلب `ImageResponse` محارفَ
 * العربيّة من الشبكة أثناء البثّ، فإن تعثّر سقطت الصورةُ بـ«failed to pipe response» خارج try (رصدُ الأخطاء، 20 تشرين الأول).
 */
const FONT_FILES = [
  ['arabic', 400], ['arabic', 700], ['latin', 400], ['latin', 700],
] as const;
let fontsPromise: Promise<{ name: string; data: Buffer; weight: 400 | 700; style: 'normal' }[]> | null = null;
export function loadOgFonts() {
  fontsPromise ??= Promise.all(
    FONT_FILES.map(async ([subset, weight]) => ({
      name: 'Plex',
      data: await readFile(join(process.cwd(), 'assets/og', `ibm-plex-sans-arabic-${subset}-${weight}-normal.woff`)),
      weight,
      style: 'normal' as const,
    })),
  ).catch((err) => {
    fontsPromise = null;
    throw err;
  });
  return fontsPromise;
}

/**
 * Satori (محرّكُ ImageResponse) يصل حروفَ العربيّة لكنّه يرصّ الكلماتِ من اليسار: «فحص السكر» تُرسم «السكر فحص».
 * فكلُّ كلمةٍ عنصرٌ في صفٍّ معكوس يلتفّ — والسطرُ الثاني تحت الأوّل لا فوق ما بعده.
 */
function Rtl({ text, gap, style }: { text: string; gap: number; style: CSSProperties }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row-reverse', flexWrap: 'wrap', columnGap: gap, ...style }}>
      {text.split(/\s+/).filter(Boolean).map((w, i) => (
        <span key={i} style={{ display: 'flex' }}>{w}</span>
      ))}
    </div>
  );
}

/** نصٌّ من الرابط: مقصوصٌ كي لا يُفيض الصورة */
const param = (sp: URLSearchParams, key: string, max: number) => sp.get(key)?.trim().slice(0, max) || null;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const titleAr = param(searchParams, 'titleAr', 40) ?? 'سباير ميديكال';
    const titleEn = param(searchParams, 'titleEn', 40) ?? 'Spir Medical';
    // `title` ما ترسله المدوّنة (عنوانُ المقال) — كان يُهمَل فتتطابق صورُ المقالات كلُّها
    const headline = param(searchParams, 'title', 90) ?? param(searchParams, 'headline', 90) ?? 'الرعاية الصحية بين يديك';
    const meta = param(searchParams, 'meta', 80) ?? 'دليل الفرات الأوسط الطبي · النجف · 24/7';
    const fonts = await loadOgFonts();

    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(135deg, #0E5C4D 0%, #052A23 100%)',
            width: '100%',
            height: '100%',
            display: 'flex',
            position: 'relative',
            fontFamily: 'Plex',
            overflow: 'hidden',
          }}
        >
          {/* ─── Decorative blobs (top-right) ─── */}
          <div
            style={{
              position: 'absolute',
              top: -80,
              right: -80,
              width: '320px',
              height: '320px',
              background:
                'radial-gradient(circle, rgba(20, 110, 90, 0.6) 0%, transparent 65%)',
              borderRadius: '50%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 40,
              right: 220,
              width: '120px',
              height: '120px',
              background:
                'radial-gradient(circle, rgba(20, 110, 90, 0.4) 0%, transparent 70%)',
              borderRadius: '50%',
            }}
          />

          {/* ─── Decorative blob (bottom-left) ─── */}
          <div
            style={{
              position: 'absolute',
              bottom: -100,
              left: -50,
              width: '260px',
              height: '260px',
              background:
                'radial-gradient(circle, rgba(184, 84, 12, 0.08) 0%, transparent 70%)',
              borderRadius: '50%',
            }}
          />

          {/* ═══ TOP SECTION: Logo + Brand ═══ */}
          <div
            style={{
              position: 'absolute',
              top: 60,
              right: 60,
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
            }}
          >
            {/* النصوص */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
              }}
            >
              <div
                style={{
                  fontSize: '54px',
                  fontWeight: 800,
                  color: '#F4EFE2',
                  display: 'flex',
                  lineHeight: 1,
                  marginBottom: '8px',
                  letterSpacing: '-1px',
                }}
              >
                {titleEn}
              </div>
              <Rtl
                text={titleAr}
                gap={2}
                style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: '#E67E22',
                  lineHeight: 1.3,
                  borderBottom: '4px solid #E67E22',
                  paddingBottom: '4px',
                }}
              />
            </div>

            {/* Logo Mark - مربع أخضر مع حرف س */}
            <div
              style={{
                width: '110px',
                height: '110px',
                borderRadius: '24px',
                background: '#0F6B58',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '64px',
                fontWeight: 900,
                color: '#F4EFE2',
                position: 'relative',
                boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
                border: '2px solid rgba(244, 239, 226, 0.1)',
              }}
            >
              س
              {/* Organic shape decoration */}
              <div
                style={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#14C495',
                  opacity: 0.85,
                }}
              />
            </div>
          </div>

          {/* ═══ BOTTOM SECTION: Headline + Meta ═══ */}
          <div
            style={{
              position: 'absolute',
              bottom: 80,
              right: 60,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              width: '780px',
            }}
          >
            {/* العنوان الكبير */}
            <Rtl
              text={headline}
              gap={4}
              style={{
                fontSize: headline.length > 30 ? '56px' : '76px',
                fontWeight: 700,
                color: '#F4EFE2',
                lineHeight: 1.3,
                marginBottom: '24px',
              }}
            />

            {/* Meta details */}
            <Rtl
              text={meta}
              gap={7}
              style={{
                fontSize: '24px',
                fontWeight: 400,
                color: 'rgba(244, 239, 226, 0.75)',
                lineHeight: 1.3,
              }}
            />
          </div>

          {/* ═══ FOOTER BADGE: صناعة عراقية ═══ */}
          <div
            style={{
              position: 'absolute',
              bottom: 50,
              left: 50,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 22px',
              background: 'rgba(15, 107, 88, 0.4)',
              borderRadius: '100px',
              border: '1px solid rgba(244, 239, 226, 0.15)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {/* النقطة الخضراء النابضة */}
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#14C495',
                boxShadow: '0 0 12px rgba(20, 196, 149, 0.8)',
              }}
            />

            <Rtl text="صناعة عراقية" gap={6} style={{ fontSize: '20px', fontWeight: 700, color: '#F4EFE2' }} />

            {/* علم العراق */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '32px',
                height: '20px',
                borderRadius: '3px',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              <div style={{ flex: 1, background: '#CE1126', display: 'flex' }} />
              <div style={{ flex: 1, background: '#FFFFFF', display: 'flex' }} />
              <div style={{ flex: 1, background: '#000000', display: 'flex' }} />
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts,
      }
    );
  } catch {
    return new Response('Failed to generate image', { status: 500 });
  }
}
