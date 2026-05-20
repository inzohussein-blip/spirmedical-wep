'use client';

import { useEffect } from 'react';

/**
 * ═══════════════════════════════════════════════════════════════
 * 🎨 Dynamic Status Bar Color (V25.17)
 * ═══════════════════════════════════════════════════════════════
 *
 * يُحدّث لون الـ status bar (theme-color meta) بحسب الصفحة
 * يعمل على:
 *   - Android Chrome (theme-color)
 *   - iOS Safari (apple-mobile-web-app-status-bar-style)
 *
 * Usage:
 *   <StatusBar color="emerald" />        // أخضر
 *   <StatusBar color="amber" />          // كهرماني
 *   <StatusBar color="#FF0000" />        // مخصّص
 *   <StatusBar dark />                   // status bar داكن
 * ═══════════════════════════════════════════════════════════════
 */

type StatusBarColor = 'emerald' | 'amber' | 'rose' | 'paper' | 'ink' | 'white' | string;

const COLOR_MAP: Record<string, string> = {
  emerald: '#0E5C4D',
  amber:   '#C97A2E',
  rose:    '#D9594C',
  paper:   '#F4EFE2',
  ink:     '#2E2C28',
  white:   '#FFFFFF',
};

interface Props {
  /** لون الـ status bar */
  color?: StatusBarColor;
  /** style iOS: default | black | black-translucent */
  iosStyle?: 'default' | 'black' | 'black-translucent';
}

export default function StatusBar({
  color = 'emerald',
  iosStyle = 'default',
}: Props) {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const finalColor = COLOR_MAP[color] || color;

    // ─── Android Chrome: theme-color ───
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.setAttribute('name', 'theme-color');
      document.head.appendChild(themeColorMeta);
    }
    const prevThemeColor = themeColorMeta.getAttribute('content');
    themeColorMeta.setAttribute('content', finalColor);

    // ─── iOS Safari: apple-mobile-web-app-status-bar-style ───
    let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!appleMeta) {
      appleMeta = document.createElement('meta');
      appleMeta.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
      document.head.appendChild(appleMeta);
    }
    const prevAppleStyle = appleMeta.getAttribute('content');
    appleMeta.setAttribute('content', iosStyle);

    // ─── Cleanup: restore previous on unmount ───
    return () => {
      if (prevThemeColor) themeColorMeta?.setAttribute('content', prevThemeColor);
      if (prevAppleStyle) appleMeta?.setAttribute('content', prevAppleStyle);
    };
  }, [color, iosStyle]);

  return null;
}
