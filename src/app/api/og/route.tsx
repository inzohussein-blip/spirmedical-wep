import { ImageResponse } from 'next/og';

export const runtime = 'edge';

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
        {/* Decorative background elements */}
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

        {/* Logo */}
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

        {/* Tagline */}
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
            backdropFilter: 'blur(10px)',
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
    }
  );
}
