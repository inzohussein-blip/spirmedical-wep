// ESLint 9 (flat config) — Next 16 أزال `next lint`، فالفحصُ عبر `eslint .` مباشرة.
import { defineConfig, globalIgnores } from 'eslint/config';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

export default defineConfig([
  globalIgnores([
    '**/node_modules/',
    '**/.next/',
    '**/out/',
    '**/coverage/',
    '**/*.config.js',
    '.audit/',
    'public/vendor/', // ملفّاتٌ مُصغَّرة من مكتباتٍ خارجيّة (عامل الخريطة، إضافة RTL)
    'public/sw.js',
  ]),
  {
    extends: [...nextCoreWebVitals],
    rules: {
      '@next/next/no-img-element': 'off',
      'no-console': ['warn', { allow: ['warn', 'error', 'debug'] }],
      // قواعدُ React Compiler الجديدة في eslint-config-next 16 (49 موضعاً عند الترقية). تحذيرٌ لا خطأ:
      // تَصِف أنماطاً كانت تعمل (Date.now() في مكوّن خادم، setState في effect)، ويُراجَع كلٌّ منها
      // قبل تفعيل المُصرِّف. «static-components» في الموضعين مكوّنا خادم بلا حالة — لا إعادةَ تركيب.
      'react-hooks/purity': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/use-memo': 'warn',
    },
  },
]);
