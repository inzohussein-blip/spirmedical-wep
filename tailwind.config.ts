import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
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
      },
      fontFamily: {
        sans: ['var(--font-tajawal)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-fraunces)', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
