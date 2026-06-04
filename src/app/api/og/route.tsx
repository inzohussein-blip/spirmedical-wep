import { ImageResponse } from 'next/og';

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const titleAr = searchParams.get('titleAr') ?? 'سباير ميديكال';
    const titleEn = searchParams.get('titleEn') ?? 'Spir Medical';
    const headline = searchParams.get('headline') ?? 'الرعاية الصحية بين يديك';
    const meta = searchParams.get('meta') ?? 'دليل الفرات الأوسط الطبي · النجف · 24/7';

    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(135deg, #0E5C4D 0%, #052A23 100%)',
            width: '100%',
            height: '100%',
            display: 'flex',
            position: 'relative',
            fontFamily: 'system-ui, -apple-system, sans-serif',
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
              <div
                style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: '#E67E22',
                  display: 'flex',
                  lineHeight: 1,
                  borderBottom: '4px solid #E67E22',
                  paddingBottom: '4px',
                }}
              >
                {titleAr}
              </div>
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
              maxWidth: '780px',
            }}
          >
            {/* العنوان الكبير */}
            <div
              style={{
                fontSize: '76px',
                fontWeight: 900,
                color: '#F4EFE2',
                display: 'flex',
                lineHeight: 1.15,
                marginBottom: '24px',
                textAlign: 'right',
                letterSpacing: '-1px',
              }}
            >
              {headline}
            </div>

            {/* Meta details */}
            <div
              style={{
                fontSize: '24px',
                fontWeight: 500,
                color: 'rgba(244, 239, 226, 0.75)',
                display: 'flex',
                lineHeight: 1,
              }}
            >
              {meta}
            </div>
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

            <span
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#F4EFE2',
                display: 'flex',
              }}
            >
              صناعة عراقية
            </span>

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
      }
    );
  } catch {
    return new Response('Failed to generate image', { status: 500 });
  }
}
