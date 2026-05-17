/**
 * تشفير البيانات الطبية الحساسة على مستوى التطبيق.
 *
 * يستخدم AES-256-GCM (authenticated encryption).
 *
 * الـ key يجب أن يأتي من env: ENCRYPTION_KEY (32 bytes hex)
 *
 * توليد مفتاح جديد:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM standard
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    // في التطوير: استخدم مفتاح مشتق ثابت (NOT FOR PRODUCTION)
    if (process.env.NODE_ENV !== 'production') {
      return createHash('sha256').update('dev-key-only-not-secure').digest();
    }
    throw new Error('ENCRYPTION_KEY غير مُعرَّف في المتغيرات البيئية');
  }
  if (keyHex.length !== 64) {
    throw new Error('ENCRYPTION_KEY يجب أن يكون 32 bytes (64 hex chars)');
  }
  return Buffer.from(keyHex, 'hex');
}

/**
 * تشفير نص → Base64 string جاهز للحفظ في DB
 *
 * الصيغة: base64(iv | authTag | ciphertext)
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return '';

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, authTag, encrypted]);

  return combined.toString('base64');
}

/**
 * فك تشفير من Base64 → النص الأصلي
 */
export function decrypt(encrypted: string): string {
  if (!encrypted) return '';

  const combined = Buffer.from(encrypted, 'base64');

  if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error('بيانات مشفّرة غير صالحة');
  }

  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

/**
 * Hash للـ data (one-way) — لمقارنة الـ identifiers بدون الكشف عنها
 */
export function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
