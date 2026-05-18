import type { Config } from 'tailwindcss';

/**
 * ═══════════════════════════════════════════════════════════════
 * Tailwind Config — V25 Design Tokens Integration
 * ═══════════════════════════════════════════════════════════════
 *
 * مهم: كل القيم هنا تربط بـ CSS Variables من globals.css
 * تغيير قيمة في :root في globals.css → كل Tailwind classes تتحدّث
 *
 * استخدام: text-emerald, p-4 (16px), rounded-lg, shadow-md
 * ═══════════════════════════════════════════════════════════════
 */

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      /* ─── 🎨 COLORS (مربوطة بـ CSS Variables) ─── */
      colors: {
        // Spir Brand
        emerald: {
          DEFAULT: 'var(--emerald)',
          deep: 'var(--emerald-deep)',
          soft: 'var(--emerald-soft)',
        },
        amber: {
          DEFAULT: 'var(--amber)',
          soft: 'var(--amber-soft)',
        },
        rose: {
          DEFAULT: 'var(--rose)',
          soft: 'var(--rose-soft)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          2: 'var(--ink-2)',
          3: 'var(--ink-3)',
          4: 'var(--ink-4)',
        },
        paper: {
          DEFAULT: 'var(--paper)',
          2: 'var(--paper-2)',
          3: 'var(--paper-3)',
        },

        // Shadcn tokens (للـ primitives)
        border: 'hsl(var(--border, 0 0% 89%))',
        input: 'hsl(var(--input, 0 0% 89%))',
        ring: 'hsl(var(--ring, 160 73% 21%))',
        background: 'hsl(var(--background, 45 45% 92%))',
        foreground: 'hsl(var(--foreground, 195 17% 9%))',
        primary: {
          DEFAULT: 'hsl(var(--primary, 167 74% 21%))',
          foreground: 'hsl(var(--primary-foreground, 45 75% 95%))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary, 45 40% 92%))',
          foreground: 'hsl(var(--secondary-foreground, 195 17% 9%))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive, 350 56% 42%))',
          foreground: 'hsl(var(--destructive-foreground, 0 0% 98%))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted, 45 30% 88%))',
          foreground: 'hsl(var(--muted-foreground, 185 4% 45%))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent, 45 40% 92%))',
          foreground: 'hsl(var(--accent-foreground, 195 17% 9%))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover, 0 0% 100%))',
          foreground: 'hsl(var(--popover-foreground, 195 17% 9%))',
        },
        card: {
          DEFAULT: 'hsl(var(--card, 0 0% 100%))',
          foreground: 'hsl(var(--card-foreground, 195 17% 9%))',
        },
      },

      /* ─── 📏 SPACING (مربوط بـ --space-X) ─── */
      spacing: {
        0: 'var(--space-0)',
        1: 'var(--space-1)',
        2: 'var(--space-2)',
        3: 'var(--space-3)',
        4: 'var(--space-4)',
        5: 'var(--space-5)',
        6: 'var(--space-6)',
        8: 'var(--space-8)',
        10: 'var(--space-10)',
        12: 'var(--space-12)',
        16: 'var(--space-16)',
        20: 'var(--space-20)',
      },

      /* ─── 🔲 BORDER RADIUS (مربوط بـ --radius-X) ─── */
      borderRadius: {
        none: 'var(--radius-none)',
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        full: 'var(--radius-full)',
      },

      /* ─── 🌑 SHADOWS (مربوط بـ --shadow-X) ─── */
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-md)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
        inner: 'var(--shadow-inner)',
        focus: 'var(--shadow-focus)',
        none: 'none',
      },

      /* ─── ✍️ TYPOGRAPHY ─── */
      fontSize: {
        '2xs': ['var(--text-2xs)', { lineHeight: 'var(--leading-normal)' }],
        xs: ['var(--text-xs)', { lineHeight: 'var(--leading-normal)' }],
        sm: ['var(--text-sm)', { lineHeight: 'var(--leading-normal)' }],
        base: ['var(--text-base)', { lineHeight: 'var(--leading-relaxed)' }],
        md: ['var(--text-md)', { lineHeight: 'var(--leading-relaxed)' }],
        lg: ['var(--text-lg)', { lineHeight: 'var(--leading-snug)' }],
        xl: ['var(--text-xl)', { lineHeight: 'var(--leading-snug)' }],
        '2xl': ['var(--text-2xl)', { lineHeight: 'var(--leading-tight)' }],
        '3xl': ['var(--text-3xl)', { lineHeight: 'var(--leading-tight)' }],
        '4xl': ['var(--text-4xl)', { lineHeight: 'var(--leading-tight)' }],
        '5xl': ['var(--text-5xl)', { lineHeight: 'var(--leading-tight)' }],
      },

      fontWeight: {
        normal: 'var(--weight-normal)',
        medium: 'var(--weight-medium)',
        semibold: 'var(--weight-semibold)',
        bold: 'var(--weight-bold)',
        extrabold: 'var(--weight-extrabold)',
        black: 'var(--weight-black)',
      },

      lineHeight: {
        tight: 'var(--leading-tight)',
        snug: 'var(--leading-snug)',
        normal: 'var(--leading-normal)',
        relaxed: 'var(--leading-relaxed)',
        loose: 'var(--leading-loose)',
      },

      letterSpacing: {
        tight: 'var(--tracking-tight)',
        normal: 'var(--tracking-normal)',
        wide: 'var(--tracking-wide)',
      },

      fontFamily: {
        sans: ['Tajawal', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },

      /* ─── ⏱️ TRANSITIONS ─── */
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
        slow: '300ms',
        slower: '500ms',
      },

      transitionTimingFunction: {
        out: 'var(--ease-out)',
        'in-out': 'var(--ease-in-out)',
        spring: 'var(--ease-spring)',
      },

      /* ─── 📐 Z-INDEX ─── */
      zIndex: {
        base: 'var(--z-base)',
        dropdown: 'var(--z-dropdown)',
        sticky: 'var(--z-sticky)',
        overlay: 'var(--z-overlay)',
        modal: 'var(--z-modal)',
        popover: 'var(--z-popover)',
        toast: 'var(--z-toast)',
        tooltip: 'var(--z-tooltip)',
      },

      /* ─── 🎬 ANIMATIONS ─── */
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-out': {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        'slide-in-from-top': {
          from: { transform: 'translateY(-100%)' },
          to: { transform: 'translateY(0)' },
        },
        'slide-out-to-top': {
          from: { transform: 'translateY(0)' },
          to: { transform: 'translateY(-100%)' },
        },
        'zoom-in': {
          from: { transform: 'scale(0.95)' },
          to: { transform: 'scale(1)' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.15s ease-out',
        'fade-out': 'fade-out 0.15s ease-out',
        'slide-in-from-top': 'slide-in-from-top 0.2s ease-out',
        'slide-out-to-top': 'slide-out-to-top 0.2s ease-out',
        'zoom-in': 'zoom-in 0.15s ease-out',
        'spin-slow': 'spin-slow 0.7s linear infinite',
      },

      /* ─── 📏 LAYOUT ─── */
      maxWidth: {
        shell: 'var(--shell-max-width)',
        landing: 'var(--landing-max-width)',
      },
    },
  },
  plugins: [],
};

export default config;
