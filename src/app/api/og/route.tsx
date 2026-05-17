import { ImageResponse } from 'next/og';

export const dynamic = 'force-dynamic';
export const alt = 'Spir Medical · سباير ميديكال';
export const contentType = 'image/png';

// ============================================================
// 🖼️ OG Image Endpoint - صورة معاينة ديناميكية
// ============================================================
// تُستخدم تلقائياً عند مشاركة الموقع على:
//   - WhatsApp, Telegram
//   - Facebook, Twitter, LinkedIn
//   - AI agents (Perplexity, Bing AI)
//   - Slack, Discord
//
// URL: /api/og
// URL مع params: /api/og?title=...&subtitle=...
// ============================================================

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const title = searchParams.get('title') ?? 'سباير ميديكال';
    const subtitle = searchParams.get('subtitle') ?? 'Spir Medical';
    const desc =
      searchParams.get('desc') ??
      'منصة طبية رقمية متكاملة في العراق';

    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(135deg, #0E5C4D 0%, #073B30 100%)',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Decorative dots pattern */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '300px',
              height: '300px',
              background:
                'radial-gradient(circle, rgba(184, 84, 12, 0.15) 0%, transparent 70%)',
              borderRadius: '50%',
            }}
          />

          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '400px',
              height: '400px',
              background:
                'radial-gradient(circle, rgba(244, 239, 226, 0.1) 0%, transparent 70%)',
              borderRadius: '50%',
            }}
          />

          {/* Logo Circle */}
          <div
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: '#F4EFE2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '60px',
              fontWeight: 'bold',
              color: '#0E5C4D',
              marginBottom: '32px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            }}
          >
            س
          </div>

          {/* Arabic Title */}
          <div
            style={{
              fontSize: '64px',
              fontWeight: 800,
              color: '#F4EFE2',
              marginBottom: '16px',
              textAlign: 'center',
              display: 'flex',
            }}
          >
            {title}
          </div>

          {/* English Subtitle */}
          <div
            style={{
              fontSize: '36px',
              color: '#B8540C',
              fontStyle: 'italic',
              marginBottom: '32px',
              fontWeight: 600,
              display: 'flex',
            }}
          >
            {subtitle}
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: '24px',
              color: 'rgba(244, 239, 226, 0.85)',
              textAlign: 'center',
              maxWidth: '900px',
              lineHeight: 1.5,
              display: 'flex',
            }}
          >
            {desc}
          </div>

          {/* Footer */}
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '18px',
              color: 'rgba(244, 239, 226, 0.6)',
            }}
          >
            <span>🇮🇶</span>
            <span>spirmedical-wep.vercel.app</span>
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
