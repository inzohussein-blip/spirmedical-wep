// ════════════════════════════════════════════════════════════════════
// 🛠️ SERVICE WORKER - Spir Medical PWA
// ════════════════════════════════════════════════════════════════════
// Strategies:
// - Network First: API routes, dashboard pages
// - Cache First: Static assets (images, fonts, CSS)
// - Stale While Revalidate: pages العادية
// ════════════════════════════════════════════════════════════════════

const CACHE_VERSION = 'spir-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// الأصول الأساسية للـ pre-cache
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json',
];

// ────────────── Install ──────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Pre-cache failed:', err);
      });
    })
  );
  self.skipWaiting();
});

// ────────────── Activate ──────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((name) => !name.startsWith(CACHE_VERSION))
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// ────────────── Fetch ──────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // تجاهل غير GET
  if (request.method !== 'GET') return;

  // تجاهل الـ extensions و chrome internals
  if (!url.protocol.startsWith('http')) return;

  // تجاهل الـ Supabase queries (تحتاج إنترنت دائماً)
  if (url.hostname.includes('supabase')) return;

  // ─── Strategy 1: API routes - Network Only ───
  if (url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/og')) {
    return; // اترك المتصفح يتعامل
  }

  // ─── Strategy 2: Auth pages - Network Only ───
  if (
    url.pathname.startsWith('/login') ||
    url.pathname.startsWith('/register') ||
    url.pathname.startsWith('/otp')
  ) {
    return;
  }

  // ─── Strategy 3: Static assets - Cache First ───
  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'style' ||
    url.pathname.startsWith('/_next/static/')
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // ─── Strategy 4: HTML pages - Network First with cache fallback ───
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirst(request));
    return;
  }

  // ─── Strategy 5: Everything else - Stale While Revalidate ───
  event.respondWith(staleWhileRevalidate(request));
});

// ────────────── Cache Strategies ──────────────

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    console.warn('[SW] cacheFirst failed:', request.url);
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cached = await caches.match(request);
    if (cached) return cached;

    // عرض صفحة Offline
    const offlinePage = await caches.match('/offline');
    if (offlinePage) return offlinePage;

    return new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        const cache = caches.open(RUNTIME_CACHE);
        cache.then((c) => c.put(request, response.clone()));
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
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
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'spir-notification',
    data: data.url || '/',
    dir: 'rtl',
    lang: 'ar',
    vibrate: [200, 100, 200],
    requireInteraction: data.urgent === true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'سباير ميديكال', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // إذا التطبيق مفتوح بالفعل، انتقل للصفحة
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // إذا لا، افتح نافذة جديدة
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

console.log('[SW] Loaded version:', CACHE_VERSION);
