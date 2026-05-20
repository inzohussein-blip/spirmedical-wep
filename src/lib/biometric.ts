/**
 * ═══════════════════════════════════════════════════════════════
 * 🔐 Biometric / WebAuthn (V25.17)
 * ═══════════════════════════════════════════════════════════════
 *
 * تسجيل دخول بـ بصمة / Face ID عبر WebAuthn API
 *
 * Browser support:
 *   ✓ Safari iOS 14+ (Touch ID / Face ID)
 *   ✓ Chrome Android 70+ (Fingerprint)
 *   ✓ Edge / Chrome Desktop (Windows Hello)
 *   ✗ Older browsers (fallback مطلوب)
 *
 * Usage:
 *   // فحص الدعم
 *   const available = await isBiometricAvailable();
 *
 *   // تسجيل بصمة جديدة (بعد تسجيل دخول عادي)
 *   const credentialId = await registerBiometric(userId, email);
 *   // احفظ credentialId في DB أو localStorage
 *
 *   // تسجيل دخول بالبصمة
 *   const { success, credentialId } = await loginWithBiometric();
 *   if (success) { ... }
 * ═══════════════════════════════════════════════════════════════
 */

const STORAGE_KEY_CREDENTIAL = 'spir_biometric_credential';
const STORAGE_KEY_USER_HANDLE = 'spir_biometric_user_handle';

/**
 * فحص هل الجهاز يدعم biometric authentication
 */
export async function isBiometricAvailable(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!window.PublicKeyCredential) return false;

  try {
    const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch {
    return false;
  }
}

/**
 * هل بصمة المستخدم مُسجّلة مسبقاً
 */
export function hasRegisteredBiometric(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(STORAGE_KEY_CREDENTIAL);
}

/**
 * تسجيل بصمة جديدة للمستخدم
 * يُستدعى بعد تسجيل الدخول العادي بنجاح
 */
export async function registerBiometric(
  userId: string,
  email: string,
  displayName: string
): Promise<{ success: boolean; credentialId?: string; error?: string }> {
  try {
    if (!await isBiometricAvailable()) {
      return { success: false, error: 'الجهاز لا يدعم البصمة' };
    }

    // ─── إنشاء challenge عشوائي (في الإنتاج: من server) ───
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const userIdBytes = new TextEncoder().encode(userId);

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'Spir Medical',
          id: window.location.hostname,
        },
        user: {
          id: userIdBytes,
          name: email,
          displayName,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },    // ES256
          { alg: -257, type: 'public-key' },  // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',  // الجهاز نفسه (لا USB key)
          userVerification: 'required',         // مطلوب verify المستخدم
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      },
    });

    if (!credential) {
      return { success: false, error: 'فشل التسجيل' };
    }

    // ─── احفظ الـ credentialId محلياً (في الإنتاج: في DB أيضاً) ───
    const credentialId = bufferToBase64((credential as PublicKeyCredential).rawId);

    localStorage.setItem(STORAGE_KEY_CREDENTIAL, credentialId);
    localStorage.setItem(STORAGE_KEY_USER_HANDLE, userId);

    return { success: true, credentialId };
  } catch (e) {
    const error = e as Error;
    if (error.name === 'NotAllowedError') {
      return { success: false, error: 'تم رفض الإذن' };
    }
    return { success: false, error: error.message || 'فشل تسجيل البصمة' };
  }
}

/**
 * تسجيل دخول باستخدام البصمة
 */
export async function loginWithBiometric(): Promise<{
  success: boolean;
  userId?: string;
  credentialId?: string;
  error?: string;
}> {
  try {
    if (!await isBiometricAvailable()) {
      return { success: false, error: 'الجهاز لا يدعم البصمة' };
    }

    const savedCredentialId = localStorage.getItem(STORAGE_KEY_CREDENTIAL);
    const savedUserId = localStorage.getItem(STORAGE_KEY_USER_HANDLE);

    if (!savedCredentialId || !savedUserId) {
      return { success: false, error: 'لم يُسجَّل بصمة بعد' };
    }

    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const credentialIdBytes = base64ToBuffer(savedCredentialId);

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [
          {
            id: credentialIdBytes.buffer as ArrayBuffer,
            type: 'public-key',
            transports: ['internal'],
          },
        ],
        userVerification: 'required',
        timeout: 60000,
      },
    });

    if (!assertion) {
      return { success: false, error: 'فشل التحقّق' };
    }

    return {
      success: true,
      userId: savedUserId,
      credentialId: savedCredentialId,
    };
  } catch (e) {
    const error = e as Error;
    if (error.name === 'NotAllowedError') {
      return { success: false, error: 'تم إلغاء البصمة' };
    }
    return { success: false, error: error.message || 'فشل تسجيل الدخول' };
  }
}

/**
 * حذف البصمة المُسجّلة (logout)
 */
export function clearBiometric(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY_CREDENTIAL);
  localStorage.removeItem(STORAGE_KEY_USER_HANDLE);
}

// ─── Helpers ───
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
