/**
 * ═══════════════════════════════════════════════════════════════
 * 🎨 iOS Splash Screen Links (V25.17)
 * ═══════════════════════════════════════════════════════════════
 *
 * يُضيف <link rel="apple-touch-startup-image"> لكل أحجام iPhone/iPad
 *
 * Note: الصور الفعلية يجب أن تُضاف في /public/splash/
 * بأحجام محدّدة. حالياً نستخدم نفس الـ icon (gracefully degrades).
 *
 * Usage:
 *   في layout.tsx <head>:
 *     <IOSSplashScreens />
 * ═══════════════════════════════════════════════════════════════
 */

// مواصفات شاشات iPhone (بناء على Apple HIG)
// راجع: https://developer.apple.com/design/human-interface-guidelines/foundations/layout/
interface SplashConfig {
  width: number;
  height: number;
  pixelRatio: number;
  orientation: 'portrait' | 'landscape';
  device: string;
}

const SPLASH_CONFIGS: SplashConfig[] = [
  // iPhone 16 Pro Max / 15 Pro Max
  { width: 440, height: 956, pixelRatio: 3, orientation: 'portrait', device: 'iPhone 15/16 Pro Max' },
  // iPhone 15 Pro / 14 Pro
  { width: 393, height: 852, pixelRatio: 3, orientation: 'portrait', device: 'iPhone 14/15 Pro' },
  // iPhone 14 Plus / 13 Pro Max / 12 Pro Max
  { width: 428, height: 926, pixelRatio: 3, orientation: 'portrait', device: 'iPhone 12-14 Plus' },
  // iPhone 14 / 13 / 13 Pro / 12 / 12 Pro
  { width: 390, height: 844, pixelRatio: 3, orientation: 'portrait', device: 'iPhone 12-14' },
  // iPhone 13 mini / 12 mini / 11 Pro / Xs / X
  { width: 375, height: 812, pixelRatio: 3, orientation: 'portrait', device: 'iPhone X/Xs/11 Pro' },
  // iPhone 11 / Xr / 11 Pro Max / Xs Max
  { width: 414, height: 896, pixelRatio: 2, orientation: 'portrait', device: 'iPhone Xr/11' },
  // iPhone 8 Plus / 7 Plus / 6s Plus / 6 Plus
  { width: 414, height: 736, pixelRatio: 3, orientation: 'portrait', device: 'iPhone Plus' },
  // iPhone 8 / 7 / 6s / 6 / SE 2nd/3rd
  { width: 375, height: 667, pixelRatio: 2, orientation: 'portrait', device: 'iPhone 6-8/SE' },
  // iPhone SE 1st / 5s / 5
  { width: 320, height: 568, pixelRatio: 2, orientation: 'portrait', device: 'iPhone SE 1st' },

  // iPad Pro 12.9"
  { width: 1024, height: 1366, pixelRatio: 2, orientation: 'portrait', device: 'iPad Pro 12.9"' },
  // iPad Pro 11"
  { width: 834, height: 1194, pixelRatio: 2, orientation: 'portrait', device: 'iPad Pro 11"' },
  // iPad Air
  { width: 820, height: 1180, pixelRatio: 2, orientation: 'portrait', device: 'iPad Air' },
  // iPad
  { width: 810, height: 1080, pixelRatio: 2, orientation: 'portrait', device: 'iPad' },
  // iPad mini
  { width: 768, height: 1024, pixelRatio: 2, orientation: 'portrait', device: 'iPad mini' },
];

export default function IOSSplashScreens() {
  return (
    <>
      {SPLASH_CONFIGS.map((config) => {
        const w = config.width * config.pixelRatio;
        const h = config.height * config.pixelRatio;
        const orientation = config.orientation === 'portrait' ? 'portrait' : 'landscape';

        // media query للجهاز
        const media = `(device-width: ${config.width}px) and (device-height: ${config.height}px) and (-webkit-device-pixel-ratio: ${config.pixelRatio}) and (orientation: ${orientation})`;

        // نستخدم الـ icon-512 كـ fallback splash
        // (في الإنتاج: يُفضّل توليد splash images مخصّصة)
        const splashUrl = '/icon-512.png';

        return (
          <link
            key={`${w}x${h}`}
            rel="apple-touch-startup-image"
            href={splashUrl}
            media={media}
          />
        );
      })}
    </>
  );
}
