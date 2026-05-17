import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // ─── Spir Brand Colors (محفوظة) ───
        emerald: {
          DEFAULT: '#0E5C4D',
          deep: '#073B30',
          soft: '#D9E5DF',
        },
        amber: {
          DEFAULT: '#B8540C',
          soft: '#F0DBC2',
        },
        rose: {
          DEFAULT: '#A82E3D',
          soft: '#F0D7D8',
        },
        ink: {
          DEFAULT: '#0F1A1C',
          2: '#3A4848',
          3: '#6E7878',
          4: '#A4ACAA',
        },
        paper: {
          DEFAULT: '#F4EFE2',
          2: '#EDE6D3',
          3: '#FAF6EB',
        },

        // ─── Shadcn-style tokens (تعمل مع primitives) ───
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
      borderRadius: {
        lg: 'var(--radius, 0.625rem)',
        md: 'calc(var(--radius, 0.625rem) - 2px)',
        sm: 'calc(var(--radius, 0.625rem) - 4px)',
      },
      fontFamily: {
        sans: ['Tajawal', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        // Shadcn-required animations
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
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.15s ease-out',
        'fade-out': 'fade-out 0.15s ease-out',
        'slide-in-from-top': 'slide-in-from-top 0.2s ease-out',
        'slide-out-to-top': 'slide-out-to-top 0.2s ease-out',
        'zoom-in': 'zoom-in 0.15s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
