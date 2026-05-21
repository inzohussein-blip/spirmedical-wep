// ════════════════════════════════════════════════════════════════════
// 🛠️ SERVICE WORKER - Spir Medical PWA Maximum (V25.26)
// ════════════════════════════════════════════════════════════════════
// تحسينات V25.26:
//   • عدم cache لـ HTML الصفحات الشخصية (privacy)
//   • Pre-cache فقط للأصول العامة
//   • Listener لرسالة CLEAR_USER_CACHE عند logout
// ════════════════════════════════════════════════════════════════════

const CACHE_VERSION = 'spir-v6';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const API_CACHE = `${CACHE_VERSION}-api`;

// 🎯 V25.26: pre-cache فقط للأصول العامة (لا صفحات محمية!)
const STATIC_ASSETS = [
  '/offline',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json',
];

// مسارات لا تُحفظ أبداً (auth + admin + dynamic)
const NEVER_CACHE = [
  '/api/auth',
  '/api/admin',
  '/auth/callback',
];

// 🎯 V25.26: صفحات شخصية - لا تُحفظ HTML الخاص بها (privacy!)
const PERSONAL_HTML_PATHS = [
  '/dashboard',
  '/account',
  '/appointments',
  '/favorites',
  '/messages',
  '/consultations',
  '/specialist',
  '/admin',
  '/admin44',
  '/sos',
  '/tools',
  '/family',
  '/locations',
  '/notifications',
  '/prescriptions',
  '/reminders',
];

const CACHEABLE_APIS = ['/api/monitoring/health'];
const API_CACHE_DURATION = 15 * 60 * 1000;

// ────────────── Install ──────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing v6...');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(STATIC_ASSETS).catch((err) => {
          console.warn('[SW] Pre-cache partial:', err);
        });
      }),
      self.skipWaiting(),
    ])
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  // 🎯 V25.26: مسح cache المستخدم عند logout
  if (event.data?.type === 'CLEAR_USER_CACHE') {
    event.waitUntil(clearUserCaches());
  }
});

async function clearUserCaches() {
  console.log('[SW] Clearing user caches...');
  try {
    // نحذف cache الـ runtime (يحوي HTML pages)
    await caches.delete(RUNTIME_CACHE);
    // نحذف cache الـ API
    await caches.delete(API_CACHE);
    console.log('[SW] User caches cleared');
  } catch (err) {
    console.error('[SW] Failed to clear caches:', err);
  }
}

// ────────────── Activate ──────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating v6...');
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) => {
        return Promise.all(
          keys
            .filter((key) => !key.startsWith(CACHE_VERSION))
            .map((key) => caches.delete(key))
        );
      }),
      self.clients.claim(),
    ])
  );
});

// ────────────── Helpers ──────────────
function isNeverCache(url) {
  return NEVER_CACHE.some((path) => url.pathname.startsWith(path));
}

function isPersonalHTMLPath(url) {
  return PERSONAL_HTML_PATHS.some((path) =>
    url.pathname === path || url.pathname.startsWith(path + '/')
  );
}

function isStaticAsset(url) {
  const ext = url.pathname.split('.').pop();
  return ['css', 'js', 'woff', 'woff2', 'ttf', 'otf'].includes(ext);
}

function isImage(url) {
  const ext = url.pathname.split('.').pop().toLowerCase();
  return ['png', 'jpg', 'jpeg', 'webp', 'svg', 'ico', 'gif', 'avif'].includes(ext);
}

function isHTMLPage(request) {
  return request.mode === 'navigate' ||
    (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'));
}

// ────────────── Fetch ──────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.hostname.includes('supabase')) return;
  if (isNeverCache(url)) return;
  if (url.pathname.startsWith('/admin')) return;

  // Images - Cache First
  if (isImage(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(IMAGE_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => caches.match('/icon-192.png'));
      })
    );
    return;
  }

  // Static Assets - Cache First
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // HTML Pages
  if (isHTMLPage(request)) {
    // 🎯 V25.26: صفحات شخصية - Network Only (لا cache - privacy!)
    if (isPersonalHTMLPath(url)) {
      event.respondWith(
        fetch(request).catch(() => {
          // فقط لو offline، نعرض offline page
          return caches.match('/offline');
        })
      );
      return;
    }

    // الصفحات العامة - Network First + Cache Fallback
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            return caches.match('/offline');
          });
        })
    );
    return;
  }

  // API - Network First
  if (url.pathname.startsWith('/api/')) {
    const isCacheable = CACHEABLE_APIS.some((api) => url.pathname.startsWith(api));

    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && isCacheable) {
            const clone = response.clone();
            caches.open(API_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          if (isCacheable) {
            return caches.match(request).then((cached) => {
              if (cached) return cached;
              return new Response(JSON.stringify({ error: 'offline' }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
              });
            });
          }
          return new Response(JSON.stringify({ error: 'offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        })
    );
    return;
  }
});

// ────────────── Background Sync ──────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-bookings') event.waitUntil(syncPendingBookings());
  if (event.tag === 'sync-feedback') event.waitUntil(syncPendingFeedback());
});

async function syncPendingBookings() {
  console.log('[SW] Syncing pending bookings...');
}

async function syncPendingFeedback() {
  console.log('[SW] Syncing pending feedback...');
}

// ────────────── Push Notifications ──────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Spir Medical', body: event.data.text() };
  }

  const options = {
    body: data.body || 'لديك إشعار جديد',
    icon: data.icon || '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: data.data || { url: '/dashboard' },
    actions: data.actions || [
      { action: 'view', title: 'فتح' },
      { action: 'dismiss', title: 'إغلاق' },
    ],
    tag: data.tag || 'default',
    renotify: true,
    requireInteraction: data.requireInteraction || false,
    dir: 'rtl',
    lang: 'ar',
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Spir Medical', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/dashboard';
  const action = event.action;

  if (action === 'dismiss') return;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-data') event.waitUntil(updateBackgroundData());
});

async function updateBackgroundData() {
  console.log('[SW] Periodic sync running...');
}

console.log('[SW] Service Worker v6 loaded');
