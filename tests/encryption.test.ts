import { encrypt, decrypt, hash } from '@/lib/encryption';

describe('Encryption (AES-256-GCM)', () => {
  it('encrypts and decrypts a simple string', () => {
    const plain = 'Hello World';
    const encrypted = encrypt(plain);
    expect(encrypted).not.toBe(plain);
    expect(decrypt(encrypted)).toBe(plain);
  });

  it('encrypts Arabic text correctly', () => {
    const plain = 'المريض يعاني من ضغط مرتفع';
    const encrypted = encrypt(plain);
    expect(decrypt(encrypted)).toBe(plain);
  });

  it('encrypts long medical notes', () => {
    const plain = 'A'.repeat(5000) + ' معلومات طبية حساسة ' + 'B'.repeat(5000);
    const encrypted = encrypt(plain);
    expect(decrypt(encrypted)).toBe(plain);
  });

  it('produces different ciphertexts for the same input (IV randomness)', () => {
    const plain = 'same input';
    const a = encrypt(plain);
    const b = encrypt(plain);
    expect(a).not.toBe(b); // IV عشوائي يضمن نتائج مختلفة
    expect(decrypt(a)).toBe(decrypt(b));
  });

  it('handles empty strings', () => {
    expect(encrypt('')).toBe('');
    expect(decrypt('')).toBe('');
  });

  it('throws on tampered ciphertext', () => {
    const encrypted = encrypt('secret');
    // عبث بالـ ciphertext
    const tampered = encrypted.slice(0, -2) + 'XX';
    expect(() => decrypt(tampered)).toThrow();
  });

  it('throws on invalid base64', () => {
    expect(() => decrypt('not-valid-base64!@#$')).toThrow();
  });
});

describe('Hashing (SHA-256)', () => {
  it('produces consistent hash', () => {
    expect(hash('test')).toBe(hash('test'));
  });

  it('different inputs produce different hashes', () => {
    expect(hash('test1')).not.toBe(hash('test2'));
  });

  it('returns hex string of correct length', () => {
    const result = hash('test');
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });
});
