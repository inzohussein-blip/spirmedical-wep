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
      // قواعدُ React Compiler (eslint-config-next 16). رُوجعت المواضعُ كلُّها (16 تشرين الأول):
      // أُصلحت مواضعُ refs وimmutability وstatic-components وuse-memo، فصارت أخطاءً تمنع عودتها.
      'react-hooks/refs': 'error',
      'react-hooks/immutability': 'error',
      'react-hooks/static-components': 'error',
      'react-hooks/use-memo': 'error',
      // Date.now() في مكوّن عميلٍ أثناء الرسم خطأ (العمرُ والتواريخ عبر `lib/time/baghdad-day`).
      // ويُستثنى منه مكوّنُ الخادم أدناه: يُرسم مرّةً لكلّ طلب، فـ«الآن» فيه هو المقصود.
      'react-hooks/purity': 'error',
      // تحذير: 17 موضعاً تقرأ واجهاتِ المتصفّح بعد التركيب (localStorage، matchMedia،
      // navigator) أو تُغلق قائمةً عند تغيّر المسار. نقلُها إلى الرسم يكسر الترطيب.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    // صفحاتُ App Router مكوّناتُ خادم (عدا الصفحتين العميلتين المستثناتين).
    files: ['src/app/**/page.tsx'],
    ignores: ['src/app/auth/verify-email/page.tsx', 'src/app/(auth)/login/page.tsx'],
    rules: { 'react-hooks/purity': 'off' },
  },
  {
    // أدواتُ سطر الأوامر تكتب للطرفيّة عمداً.
    files: ['tools/**'],
    rules: { 'no-console': 'off' },
  },
]);
