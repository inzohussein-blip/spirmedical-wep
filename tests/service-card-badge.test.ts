/**
 * @jest-environment node
 */
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * 🏷️ شارةُ «جديد»/«قريباً» لا تغطّي أيقونةَ البطاقة.
 *
 * الأيقونةُ في أعلى يمين البطاقة (RTL)، والشارةُ كانت `top: 10, right: 10` فوقها: لم يظهر من
 * أيقونات طبيب العائلة والأسنان والنظارات والتغذية… إلّا طرفُها (لقطةُ المالك، 17 تشرين الأول).
 * الشارةُ الآن في الزاوية المقابلة، فوق الدائرة الزخرفيّة.
 */
const FILES = [
  'src/components/dashboard-v3/BentoServicesGridV3.tsx',
  'src/components/dashboard-v3/SmartToolsGridV3.tsx',
  'src/app/(dashboard)/services/page.tsx',
];

it.each(FILES)('🚨 %s: الشارةُ في الزاوية اليسرى لا فوق الأيقونة', (f) => {
  const src = readFileSync(join(process.cwd(), f), 'utf8');
  expect(src).not.toMatch(/position: 'absolute', top: 10, right: 10/);
  expect(src).toMatch(/position: 'absolute', top: 10, left: 10/);
});
