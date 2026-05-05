// ═══════════════════════════════════════════════════════════
// State Management — Reactive store with persistence
// ═══════════════════════════════════════════════════════════

class Store {
  constructor(initialState = {}) {
    this._state = { ...initialState };
    this._subscribers = new Map();
    this._loadPersisted();
  }

  // Get state value
  get(key) {
    return key ? this._state[key] : this._state;
  }

  // Set state and notify subscribers
  set(key, value) {
    const old = this._state[key];
    this._state[key] = value;
    this._notify(key, value, old);
    if (this._persistKeys?.includes(key)) {
      this._persist();
    }
  }

  // Update multiple keys at once
  update(updates) {
    Object.keys(updates).forEach(key => this.set(key, updates[key]));
  }

  // Subscribe to changes
  subscribe(key, callback) {
    if (!this._subscribers.has(key)) {
      this._subscribers.set(key, new Set());
    }
    this._subscribers.get(key).add(callback);
    return () => this._subscribers.get(key)?.delete(callback);
  }

  _notify(key, newVal, oldVal) {
    const subs = this._subscribers.get(key);
    if (subs) subs.forEach(cb => cb(newVal, oldVal));
    // Also notify '*' listeners
    const all = this._subscribers.get('*');
    if (all) all.forEach(cb => cb({ key, newVal, oldVal }));
  }

  // Mark keys for persistence
  persist(keys) {
    this._persistKeys = keys;
    this._persist();
  }

  _persist() {
    try {
      const toSave = {};
      this._persistKeys?.forEach(k => { toSave[k] = this._state[k]; });
      localStorage.setItem('spir-state', JSON.stringify(toSave));
    } catch (e) { console.warn('Persist failed:', e); }
  }

  _loadPersisted() {
    try {
      const saved = localStorage.getItem('spir-state');
      if (saved) {
        Object.assign(this._state, JSON.parse(saved));
      }
    } catch (e) { console.warn('Load failed:', e); }
  }

  // Clear all state
  clear() {
    this._state = {};
    localStorage.removeItem('spir-state');
    this._notify('*');
  }
}

// Create global store
window.store = new Store({
  // Auth
  user: null,
  session: null,
  // App
  currentScreen: 'home',
  navigationHistory: [],
  isOnline: navigator.onLine,
  // Cart
  cart: [],
  cartTotal: 0,
  // Data caches
  hospitals: [],
  notifications: [],
  orders: [],
  prescriptions: [],
  labResults: [],
  family: [],
  badges: [],
  // UI state
  theme: 'light',
  language: 'ar',
  hasUnreadNotifications: true,
  // Settings
  notificationsEnabled: true,
  emailNotifications: true,
  smsNotifications: true,
  promosEnabled: false,
});

// Persist these keys
window.store.persist([
  'user', 'session', 'cart', 'theme', 'language',
  'notificationsEnabled', 'emailNotifications', 'smsNotifications', 'promosEnabled'
]);

// Online/offline tracking
window.addEventListener('online', () => window.store.set('isOnline', true));
window.addEventListener('offline', () => window.store.set('isOnline', false));
