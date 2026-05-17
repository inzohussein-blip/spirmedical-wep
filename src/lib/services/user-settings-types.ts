export interface UserSettings {
  language?: 'ar' | 'en' | 'ku';
  biometric?: boolean;
  auto_lock?: boolean;
  analytics?: boolean;
  pin_hash?: string | null;        // SHA-256 hash of 4-digit PIN
  pin_enabled?: boolean;           // is app lock enabled
  notifications?: {
    appointments?: boolean;
    meds?: boolean;
    results?: boolean;
    messages?: boolean;
    news?: boolean;
  };
}

export const DEFAULT_SETTINGS: UserSettings = {
  language: 'ar',
  biometric: false,
  auto_lock: true,
  analytics: true,
  pin_hash: null,
  pin_enabled: false,
  notifications: {
    appointments: true,
    meds: true,
    results: true,
    messages: true,
    news: false,
  },
};
