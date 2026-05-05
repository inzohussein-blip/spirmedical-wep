// ═══════════════════════════════════════════════════════════
// Router — URL-based navigation with History API
// ═══════════════════════════════════════════════════════════

class Router {
  constructor() {
    this.routes = new Map();
    this.currentScreen = 'home';
    this.history = [];
    this.beforeNavigate = null;

    // Listen to browser back/forward
    window.addEventListener('popstate', (e) => {
      const screen = e.state?.screen || 'home';
      this._render(screen, false);
    });

    // Handle URL parameters on load
    this._handleInitialRoute();
  }

  _handleInitialRoute() {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const screen = params.get('screen') || action || 'home';
    this._render(screen, false);
  }

  // Register a route
  register(name, options = {}) {
    this.routes.set(name, {
      onEnter: options.onEnter || (() => {}),
      onLeave: options.onLeave || (() => {}),
      requiresAuth: options.requiresAuth || false,
      tab: options.tab || false  // is part of bottom tabs
    });
  }

  // Navigate to screen
  go(screen, params = {}) {
    if (screen === this.currentScreen) return;

    // Check auth
    const route = this.routes.get(screen);
    if (route?.requiresAuth && !window.store.get('user')) {
      window.toast.show('سجل الدخول أولاً', 'error');
      this.go('login');
      return;
    }

    // Track history
    this.history.push(this.currentScreen);
    if (this.history.length > 50) this.history.shift();

    // Update URL
    const url = `?screen=${screen}${this._serializeParams(params)}`;
    window.history.pushState({ screen, params }, '', url);

    this._render(screen, true);
  }

  // Go back
  back() {
    if (this.history.length > 0) {
      const prev = this.history.pop();
      window.history.pushState({ screen: prev }, '', `?screen=${prev}`);
      this._render(prev, false, true);
    } else {
      window.history.back();
    }
  }

  // Switch tab (resets history)
  switchTab(screen) {
    this.history = [];
    window.history.pushState({ screen }, '', `?screen=${screen}`);
    this._render(screen, true);
  }

  _render(screen, scroll = true, isBack = false) {
    // Run onLeave for current
    const currentRoute = this.routes.get(this.currentScreen);
    if (currentRoute?.onLeave) currentRoute.onLeave();

    // Hide all screens
    document.querySelectorAll('.screen').forEach(s => {
      s.classList.remove('active');
      s.style.display = '';
    });

    // Show new screen
    const el = document.getElementById('scr-' + screen);
    if (!el) {
      console.error(`Screen not found: ${screen}`);
      return;
    }

    el.classList.add('active');
    if (el.classList.contains('flex')) {
      el.style.display = 'flex';
    }

    if (scroll) el.scrollTop = 0;

    // Update bottom nav
    this._updateBottomNav(screen);

    // Update store
    this.currentScreen = screen;
    window.store.set('currentScreen', screen);

    // Run onEnter
    const route = this.routes.get(screen);
    if (route?.onEnter) route.onEnter();

    // Animation hint
    el.style.animation = 'none';
    requestAnimationFrame(() => {
      el.style.animation = isBack ? 'screenBackIn 250ms ease' : 'screenIn 250ms ease';
    });
  }

  _updateBottomNav(screen) {
    const route = this.routes.get(screen);
    const nav = document.getElementById('bnav');
    if (!nav) return;

    if (route?.tab || ['home', 'orders', 'favorites', 'profile'].includes(screen)) {
      nav.style.display = 'flex';
      // Highlight active tab
      document.querySelectorAll('.bnav .ni').forEach(n => {
        n.classList.toggle('ac', n.dataset.tab === screen);
      });
    } else {
      nav.style.display = 'none';
    }
  }

  _serializeParams(params) {
    if (!params || Object.keys(params).length === 0) return '';
    const search = new URLSearchParams(params).toString();
    return search ? '&' + search : '';
  }

  // Get current params
  getParams() {
    return Object.fromEntries(new URLSearchParams(window.location.search));
  }
}

// Create global router
window.router = new Router();
