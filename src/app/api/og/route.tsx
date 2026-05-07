import { ImageResponse } from 'next/og';

// Node.js runtime - يدعم static generation
// لا حاجة لـ 'edge' runtime
export const dynamic = 'force-static';
export const revalidate = 86400; // إعادة توليد كل 24 ساعة

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0F1A1C',
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(14, 92, 77, 0.4) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(184, 84, 12, 0.3) 0%, transparent 50%)',
          padding: '80px',
          position: 'relative',
        }}
      >
        {/* Decorative orbs */}
        <div
          style={{
            position: 'absolute',
            top: '40px',
            right: '40px',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: 'rgba(14, 92, 77, 0.15)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            left: '40px',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'rgba(184, 84, 12, 0.15)',
            display: 'flex',
          }}
        />

        {/* Top: Logo + Brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            marginBottom: '60px',
          }}
        >
          <div
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '32px',
              background: '#0E5C4D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '80px',
              fontFamily: 'serif',
              fontStyle: 'italic',
              color: '#F4EFE2',
              boxShadow: '0 20px 40px rgba(14, 92, 77, 0.5)',
            }}
          >
            س
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div
              style={{
                fontSize: '56px',
                fontWeight: 800,
                color: '#F4EFE2',
                letterSpacing: '-0.02em',
              }}
            >
              Spir Medical
            </div>
            <div
              style={{
                fontSize: '32px',
                color: '#B8540C',
                fontWeight: 600,
              }}
            >
              سباير ميديكال
            </div>
          </div>
        </div>

        {/* Tagline (centered vertically) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            marginTop: 'auto',
          }}
        >
          <div
            style={{
              fontSize: '72px',
              fontWeight: 800,
              color: '#F4EFE2',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              maxWidth: '900px',
              display: 'flex',
            }}
          >
            الرعاية الصحية، بين يديك
          </div>
          <div
            style={{
              fontSize: '28px',
              color: 'rgba(244, 239, 226, 0.8)',
              fontWeight: 500,
              maxWidth: '900px',
              display: 'flex',
            }}
          >
            ١٤ خدمة طبية في تطبيق واحد · ١٨ محافظة · ٢٤/٧
          </div>
        </div>

        {/* Bottom badge */}
        <div
          style={{
            position: 'absolute',
            bottom: '60px',
            right: '60px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'rgba(244, 239, 226, 0.1)',
            padding: '16px 24px',
            borderRadius: '100px',
          }}
        >
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#22C55E',
              display: 'flex',
            }}
          />
          <div
            style={{
              fontSize: '20px',
              color: '#F4EFE2',
              fontWeight: 700,
            }}
          >
            🇮🇶 صناعة عراقية
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, immutable, no-transform, max-age=31536000',
        'Content-Type': 'image/png',
      },
    }
  );
}
