import { describe, expect, test } from '@jest/globals';
import { normalizePhoneIQ, renderTemplate } from '@/lib/whatsapp';

describe('normalizePhoneIQ', () => {
  test('07XXXXXXXXX → +9647XXXXXXXXX', () => {
    expect(normalizePhoneIQ('07712345678')).toBe('+9647712345678');
  });

  test('already E.164', () => {
    expect(normalizePhoneIQ('+9647712345678')).toBe('+9647712345678');
  });

  test('964 without +', () => {
    expect(normalizePhoneIQ('9647712345678')).toBe('+9647712345678');
  });

  test('7XXXXXXXXX (10 digits)', () => {
    expect(normalizePhoneIQ('7712345678')).toBe('+9647712345678');
  });

  test('strips spaces and dashes', () => {
    expect(normalizePhoneIQ('077-123 4567 8')).toBe('+9647712345678');
  });

  test('strips parentheses', () => {
    expect(normalizePhoneIQ('(077)1234 5678')).toBe('+9647712345678');
  });
});

describe('renderTemplate', () => {
  test('single variable', () => {
    expect(renderTemplate('Hello {{name}}', { name: 'Ahmad' }))
      .toBe('Hello Ahmad');
  });

  test('multiple variables', () => {
    expect(renderTemplate('{{a}} + {{b}} = {{c}}', { a: 1, b: 2, c: 3 }))
      .toBe('1 + 2 = 3');
  });

  test('missing variable becomes empty', () => {
    expect(renderTemplate('Hi {{missing}}', {}))
      .toBe('Hi ');
  });

  test('undefined value becomes empty', () => {
    expect(renderTemplate('{{x}}', { x: undefined }))
      .toBe('');
  });

  test('Arabic content', () => {
    const tpl = 'مرحباً {{name}} 🌿';
    expect(renderTemplate(tpl, { name: 'أحمد' }))
      .toBe('مرحباً أحمد 🌿');
  });

  test('repeated variable', () => {
    expect(renderTemplate('{{a}}-{{a}}-{{a}}', { a: 'x' }))
      .toBe('x-x-x');
  });

  test('preserves text without placeholders', () => {
    expect(renderTemplate('plain text', { a: 1 }))
      .toBe('plain text');
  });
});
