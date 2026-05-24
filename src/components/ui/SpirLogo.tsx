/**
 * ════════════════════════════════════════════════════════════════════
 * 🩺 SpirLogo - V26.0 (Design System V3)
 * ════════════════════════════════════════════════════════════════════
 * 
 * اللوغو الرسمي: حرف "س" بخط Tajawal 900 على gradient أخضر
 * 
 * الاستخدام:
 *   <SpirLogo size={48} />
 * 
 * الأحجام المعتمدة: 16, 24, 32, 40, 48, 64, 128
 * ════════════════════════════════════════════════════════════════════
 */

interface SpirLogoProps {
  size?: number;
  withShadow?: boolean;
}

export default function SpirLogo({ size = 48, withShadow }: SpirLogoProps) {
  const radius = size * 0.25;
  const fontSize = size * 0.55;
  const shouldShadow = withShadow ?? size >= 48;
  
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: 'linear-gradient(135deg, #01875F 0%, #056559 100%)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 900,
        fontSize,
        fontFamily: 'Tajawal, sans-serif',
        lineHeight: 1,
        boxShadow: shouldShadow ? '0 8px 24px rgba(1, 135, 95, 0.25)' : 'none',
        flexShrink: 0,
      }}
      aria-label="Spir Medical"
    >
      س
    </div>
  );
}
