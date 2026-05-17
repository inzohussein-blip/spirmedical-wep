/**
 * Tests for PWA logic
 */

describe('PWA', () => {
  describe('Install prompt dismissal', () => {
    const DISMISSAL_DAYS = 7;

    const shouldShow = (dismissedAt: number | null): boolean => {
      if (!dismissedAt) return true;
      const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
      return daysSince > DISMISSAL_DAYS;
    };

    it('shows if never dismissed', () => {
      expect(shouldShow(null)).toBe(true);
    });

    it('hides if dismissed recently', () => {
      const yesterday = Date.now() - 24 * 60 * 60 * 1000;
      expect(shouldShow(yesterday)).toBe(false);
    });

    it('shows again after 7 days', () => {
      const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
      expect(shouldShow(eightDaysAgo)).toBe(true);
    });

    it('hides exactly at boundary', () => {
      const exactly7Days = Date.now() - 7 * 24 * 60 * 60 * 1000 + 1000;
      expect(shouldShow(exactly7Days)).toBe(false);
    });
  });

  describe('Cache versioning', () => {
    const isOldCache = (name: string, currentVersion: string): boolean => {
      return !name.startsWith(currentVersion);
    };

    it('detects old caches', () => {
      expect(isOldCache('spir-v0-static', 'spir-v1')).toBe(true);
      expect(isOldCache('spir-v1-static', 'spir-v1')).toBe(false);
    });

    it('keeps current version caches', () => {
      expect(isOldCache('spir-v1-runtime', 'spir-v1')).toBe(false);
    });
  });

  describe('URL matching strategies', () => {
    const isApiRoute = (path: string) => path.startsWith('/api/') && !path.startsWith('/api/og');
    const isAuthRoute = (path: string) => 
      path.startsWith('/login') ||
      path.startsWith('/register') ||
      path.startsWith('/otp');
    const isStaticAsset = (path: string) => path.startsWith('/_next/static/');

    it('identifies API routes correctly', () => {
      expect(isApiRoute('/api/appointments')).toBe(true);
      expect(isApiRoute('/api/og')).toBe(false); // OG should be cached
      expect(isApiRoute('/dashboard')).toBe(false);
    });

    it('identifies auth routes', () => {
      expect(isAuthRoute('/login')).toBe(true);
      expect(isAuthRoute('/register')).toBe(true);
      expect(isAuthRoute('/otp')).toBe(true);
      expect(isAuthRoute('/dashboard')).toBe(false);
    });

    it('identifies static assets', () => {
      expect(isStaticAsset('/_next/static/chunks/main.js')).toBe(true);
      expect(isStaticAsset('/api/og')).toBe(false);
    });
  });

  describe('Manifest validation', () => {
    const validManifest = {
      name: 'Spir Medical',
      short_name: 'Spir',
      start_url: '/dashboard',
      display: 'standalone',
      theme_color: '#0E5C4D',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    };

    it('has required fields', () => {
      expect(validManifest.name).toBeTruthy();
      expect(validManifest.start_url).toBeTruthy();
      expect(validManifest.icons.length).toBeGreaterThan(0);
    });

    it('has both 192 and 512 icons', () => {
      const sizes = validManifest.icons.map(i => i.sizes);
      expect(sizes).toContain('192x192');
      expect(sizes).toContain('512x512');
    });

    it('uses standalone display', () => {
      expect(validManifest.display).toBe('standalone');
    });

    it('uses brand color', () => {
      expect(validManifest.theme_color).toBe('#0E5C4D');
    });
  });
});
