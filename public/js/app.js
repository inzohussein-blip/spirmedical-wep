// ═══════════════════════════════════════════════════════════
// App — Main entry point + UI helpers + business logic
// ═══════════════════════════════════════════════════════════

// ─── Toast system ───
class Toast {
  constructor() {
    this.el = document.getElementById('toast');
    this.timer = null;
  }
  show(message, type = 'default', duration = 2500) {
    if (!this.el) return;
    this.el.textContent = message;
    this.el.className = 'toast show ' + (type === 'success' ? 'success' : type === 'error' ? 'error' : '');
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.el.classList.remove('show'), duration);
  }
}
window.toast = new Toast();

// ─── Format helpers ───
const fmt = {
  iqd: (n) => `${n.toLocaleString('ar-EG')} د.ع`,
  date: (d) => new Date(d).toLocaleDateString('ar-EG-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' }),
  time: (d) => new Date(d).toLocaleTimeString('ar-EG-u-nu-latn', { hour: '2-digit', minute: '2-digit' }),
  ago: (d) => {
    const diff = Date.now() - new Date(d).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'الآن';
    if (min < 60) return `قبل ${min} دقيقة`;
    const h = Math.floor(min / 60);
    if (h < 24) return `قبل ${h} ساعة`;
    const days = Math.floor(h / 24);
    if (days < 7) return `قبل ${days} يوم`;
    return fmt.date(d);
  }
};
window.fmt = fmt;

// ─── DOM helpers ───
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const $id = (id) => document.getElementById(id);

window.$ = $; window.$$ = $$; window.$id = $id;

// ─── Cart logic ───
const Cart = {
  add(item) {
    const cart = window.store.get('cart');
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
      existing.qty = (existing.qty || 1) + 1;
    } else {
      cart.push({ ...item, qty: 1 });
    }
    window.store.set('cart', [...cart]);
    this.updateUI();
    window.toast.show(`✓ ${item.name} أُضيف للسلة`, 'success');
  },
  remove(id) {
    const cart = window.store.get('cart').filter(i => i.id !== id);
    window.store.set('cart', cart);
    this.updateUI();
  },
  total() {
    return window.store.get('cart').reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
  },
  count() {
    return window.store.get('cart').reduce((sum, item) => sum + (item.qty || 1), 0);
  },
  updateUI() {
    const total = this.total();
    const count = this.count();
    const fcart = $('.fcart');
    if (fcart) {
      const totalEl = fcart.querySelector('.fcart-total');
      const countEl = fcart.querySelector('.fcart-count');
      if (totalEl) totalEl.textContent = fmt.iqd(total);
      if (countEl) countEl.textContent = count;
      fcart.style.display = count > 0 ? 'flex' : 'none';
    }
    // Update orders tab badge
    const badge = $('.bnav [data-tab="orders"] .badge');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  },
  clear() {
    window.store.set('cart', []);
    this.updateUI();
  }
};
window.Cart = Cart;

// ─── Form validation ───
const Validate = {
  iraqiPhone: (phone) => /^(\+964|00964|0)?7[3-9]\d{8}$/.test(phone.replace(/\s/g, '')),
  email: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  required: (val) => val && val.toString().trim().length > 0,
  minLength: (val, n) => val && val.length >= n
};
window.Validate = Validate;

// ─── Network status indicator ───
function setupNetworkIndicator() {
  window.store.subscribe('isOnline', (online) => {
    if (!online) {
      window.toast.show('⚠️ لا يوجد اتصال بالإنترنت', 'error', 5000);
    } else {
      window.toast.show('✓ عاد الاتصال', 'success');
    }
  });
}

// ─── Greeting ───
function updateGreeting() {
  const h = new Date().getHours();
  const g = h < 12 ? 'صباح الخير 👋' : h < 18 ? 'مساء الخير 👋' : 'مساء النور 🌙';
  const el = $id('greet');
  if (el) el.textContent = g;
}

// ─── Service Worker registration ───
async function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('SW registered:', reg.scope);

    // Listen for updates
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          window.toast.show('🔄 تحديث جديد متوفر! اضغط لإعادة التحميل', 'success', 5000);
          $('.toast').addEventListener('click', () => location.reload());
        }
      });
    });
  } catch (err) {
    console.warn('SW registration failed:', err);
  }
}

// ─── PWA install prompt ───
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // Show install button after 30 seconds of usage
  setTimeout(() => {
    if (deferredPrompt) {
      window.toast.show('📲 ثبّت التطبيق على هاتفك للوصول السريع', 'default', 5000);
    }
  }, 30000);
});

window.installPWA = async () => {
  if (!deferredPrompt) {
    window.toast.show('استخدم خيار "Add to Home Screen" من المتصفح', 'default');
    return;
  }
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
};

// ─── Common UI handlers ───
window.go = (screen, params) => window.router.go(screen, params);
window.back = () => window.router.back();
window.switchTab = (screen) => window.router.switchTab(screen);
window.toast = window.toast;

// Theme toggle
window.setTheme = (theme) => {
  window.store.set('theme', theme);
  document.documentElement.classList.toggle('auto-dark', theme === 'auto');
  document.documentElement.classList.toggle('dark', theme === 'dark');
};

// Toggle handler
window.toggleSetting = (el, key) => {
  el.classList.toggle('on');
  el.classList.toggle('off');
  window.store.set(key, el.classList.contains('on'));
};

// ─── Logout ───
window.logout = async () => {
  if (!confirm('هل تريد تسجيل الخروج؟')) return;
  await window.api.signOut();
  window.store.clear();
  window.toast.show('تم تسجيل الخروج', 'success');
  window.router.go('login');
};

// ─── App initialization ───
async function initApp() {
  console.log('🏥 Spir Medical v4.0 — Professional Edition');

  // Setup network indicator
  setupNetworkIndicator();

  // Update greeting
  updateGreeting();
  setInterval(updateGreeting, 60 * 60 * 1000); // refresh every hour

  // Register service worker
  registerSW();

  // Update cart UI
  Cart.updateUI();

  // Apply saved theme
  const theme = window.store.get('theme') || 'light';
  setTheme(theme);

  // Check if user is logged in (demo: skip)
  const user = window.store.get('user');
  if (!user) {
    // Could redirect to login, but for demo we allow guest mode
    console.log('Guest mode (no auth)');
  }

  // Register routes
  window.router.register('home', { tab: true });
  window.router.register('orders', { tab: true });
  window.router.register('favorites', { tab: true });
  window.router.register('profile', { tab: true });
  window.router.register('login');
  window.router.register('hospitals');
  window.router.register('booking');
  window.router.register('consultation');
  window.router.register('pharmacy');
  window.router.register('payment');
  window.router.register('ai');
  window.router.register('insurance');
  window.router.register('badges');
  window.router.register('loyalty');
  window.router.register('notifications', {
    onEnter: async () => {
      // Mark notifications as read after viewing
      setTimeout(async () => {
        try {
          await window.api.markNotificationsRead();
          window.store.set('hasUnreadNotifications', false);
        } catch (e) {}
      }, 2000);
    }
  });
  window.router.register('settings');
  window.router.register('search');
  window.router.register('tracking');
  window.router.register('review');
  window.router.register('lab-results');
  window.router.register('prescriptions');
  window.router.register('chat');
  window.router.register('spir-plus');
  window.router.register('family');
  window.router.register('referral');
  window.router.register('clinics');
  window.router.register('recurring');

  console.log('✅ App initialized');
}

// Start app when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
