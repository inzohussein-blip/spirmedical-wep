/**
 * ════════════════════════════════════════════════════════════════════
 * 🔵 Web Bluetooth Helper (V25.23)
 * ════════════════════════════════════════════════════════════════════
 */

export interface BluetoothSupport {
  supported: boolean;
  reason?: string;
  alternative?: string;
}

export function checkBluetoothSupport(): BluetoothSupport {
  if (typeof window === 'undefined') {
    return { supported: false, reason: 'SSR' };
  }

  // Web Bluetooth API check
  if (!('bluetooth' in navigator)) {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      return {
        supported: false,
        reason: 'iOS Safari لا يدعم Bluetooth',
        alternative: 'استخدم تطبيق Bluefy من App Store كحل بديل',
      };
    }
    return {
      supported: false,
      reason: 'المتصفّح لا يدعم Web Bluetooth',
      alternative: 'استخدم Chrome أو Edge',
    };
  }

  return { supported: true };
}

/**
 * Standard medical device services (Bluetooth GATT)
 */
export const MEDICAL_SERVICES = {
  glucose: 0x1808,
  bloodPressure: 0x1810,
  heartRate: 0x180D,
  pulseOximeter: 0x1822,
  bodyTemperature: 0x1809,
  weight: 0x181D,
} as const;

export type MedicalServiceType = keyof typeof MEDICAL_SERVICES;

interface ConnectResult {
  ok: boolean;
  deviceName?: string;
  deviceId?: string;
  error?: string;
}

/**
 * يطلب الاتصال بجهاز طبي محدّد
 */
export async function connectMedicalDevice(
  type: MedicalServiceType
): Promise<ConnectResult> {
  const support = checkBluetoothSupport();
  if (!support.supported) {
    return { ok: false, error: support.reason };
  }

  try {
    const serviceId = MEDICAL_SERVICES[type];
    const bt = (navigator as unknown as { bluetooth: { requestDevice: (opts: unknown) => Promise<{ name?: string; id?: string }> } }).bluetooth;

    const device = await bt.requestDevice({
      filters: [{ services: [serviceId] }],
      optionalServices: ['device_information', 'battery_service'],
    });

    return {
      ok: true,
      deviceName: device.name,
      deviceId: device.id,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'فشل الاتصال',
    };
  }
}
