const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['<rootDir>/tests/**/*.test.{ts,tsx}'],
  collectCoverageFrom: [
    'src/lib/**/*.{ts,tsx}',
    'src/components/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  // سُلّمٌ لا طموح: كانت ٥٠٪ والتغطيةُ الفعليّة ~١٦٪، فسقط CI في كلّ دفعةٍ منذ
  // زمن وتعلّم الجميعُ تجاهلَ الأحمر — بوّابةٌ حمراءُ دائماً لا تحرس شيئاً.
  // الأرضيّةُ تحت المقيس بقليل (25 أيلول: 16.3/14.2/14.5/16.1)؛ ارفعها كلّما
  // ارتفعت التغطية، ولا تُنزلها (tests/ci-gate.test.ts).
  coverageThreshold: {
    global: {
      statements: 15,
      branches: 13,
      functions: 13,
      lines: 15,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
