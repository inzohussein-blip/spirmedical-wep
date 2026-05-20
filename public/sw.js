// ════════════════════════════════════════════════════════════════════
// 🛠️ SERVICE WORKER - Spir Medical PWA (V25.15)
// ════════════════════════════════════════════════════════════════════
// Strategies:
// - Network First (with fallback): API routes, dashboard pages
// - Cache First: Static assets (images, fonts, CSS)
// - Stale While Revalidate: pages العادية
// - Background Sync: لحفظ العمليات offline ومزامنتها
// ════════════════════════════════════════════════════════════════════

const CACHE_VERSION = 'spir-v4';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const API_CACHE = `${CACHE_VERSION}-api`;

// الأصول الأساسية للـ pre-cache
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/offline',
  '/auth/login',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json',
];

// قائمة الـ API endpoints التي نقبل cache مؤقت لها
const CACHEABLE_APIS = [
  '/api/monitoring/health',
];

// المدّة القصوى لـ cache الـ API (15 دقيقة)
const API_CACHE_DURATION = 15 * 60 * 1000;

// ────────────── Install ──────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...', CACHE_VERSION);
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Pre-cache failed:', err);
      });
    })
  );
});

// استمع لرسالة skip waiting
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    console.log('[SW] SKIP_WAITING received');
    self.skipWaiting();
  }
  if (event.data?.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((keys) =>
        Promise.all(keys.map((key) => caches.delete(key)))
      )
    );
  }
});

// ────────────── Activate ──────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => !cacheName.startsWith(CACHE_VERSION))
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ────────────── Fetch Strategies ──────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // تجاهل الـ requests غير GET
  if (request.method !== 'GET') {
    return;
  }

  // تجاهل الـ external URLs
  if (url.origin !== self.location.origin) {
    return;
  }

  // تجاهل Chrome extensions و الـ HMR
  if (url.protocol === 'chrome-extension:' || url.pathname.startsWith('/_next/webpack-hmr')) {
    return;
  }

  // === API requests - Network First مع cache احتياطي قصير ===
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // === Images - Cache First (طويل المدى) ===
  if (request.destination === 'image' || /\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(url.pathname)) {
    event.respondWith(handleImageRequest(request));
    return;
  }

  // === Static assets (CSS, JS, fonts) - Cache First ===
  if (/\.(css|js|woff2?|ttf|otf|eot)$/i.test(url.pathname) || url.pathname.startsWith('/_next/static/')) {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // === Pages - Network First مع offline fallback ===
  event.respondWith(handlePageRequest(request));
});

// ─── API Strategy: Network First (with offline fallback) ───
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const isCacheable = CACHEABLE_APIS.some((path) => url.pathname.startsWith(path));

  try {
    const networkResponse = await fetch(request);

    // فقط الـ APIs المعرّفة كـ cacheable
    if (networkResponse.ok && isCacheable) {
      const cache = await caches.open(API_CACHE);
      const responseToCache = networkResponse.clone();

      // أضف timestamp للـ cache validation
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-at', Date.now().toString());

      const cachedResponse = new Response(await responseToCache.blob(), {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers,
      });

      cache.put(request, cachedResponse);
    }

    return networkResponse;
  } catch (error) {
    // عند فشل الـ network، نُحاول الـ cache
    if (isCacheable) {
      const cached = await caches.match(request);
      if (cached) {
        const cachedAt = parseInt(cached.headers.get('sw-cached-at') || '0', 10);
        if (Date.now() - cachedAt < API_CACHE_DURATION) {
          console.log('[SW] Serving cached API response:', url.pathname);
          return cached;
        }
      }
    }

    // إذا API request للـ data ومش متوفّر offline، نرجع JSON معلوماتي
    return new Response(
      JSON.stringify({
        offline: true,
        message: 'تعذّر الاتصال بالإنترنت',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// ─── Image Strategy: Cache First ───
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    // Update in background (stale-while-revalidate)
    fetch(request).then((response) => {
      if (response.ok) cache.put(request, response.clone());
    }).catch(() => {});
    return cached;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    // Fallback صورة بسيطة
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#F4EFE2"/></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
}

// ─── Static Strategy: Cache First (immutable) ───
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);

  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('', { status: 503 });
  }
}

// ─── Page Strategy: Network First with offline fallback ───
async function handlePageRequest(request) {
  try {
    const networkResponse = await fetch(request);

    // Cache pages للـ stale-while-revalidate
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Network فشل، نُحاول الـ cache
    const cached = await caches.match(request);
    if (cached) {
      console.log('[SW] Serving cached page:', request.url);
      return cached;
    }

    // No cache، نُظهر offline page
    const offline = await caches.match('/offline');
    if (offline) return offline;

    // Fallback نهائي
    return new Response(
      `<!DOCTYPE html>
       <html dir="rtl" lang="ar"><head><title>غير متصل</title><meta charset="utf-8"/>
       <meta name="viewport" content="width=device-width,initial-scale=1"/>
       <style>body{font-family:system-ui;text-align:center;padding:60px 20px;background:#F4EFE2}
       h1{color:#0E5C4D}p{color:#5B5848;margin:20px 0}button{padding:10px 24px;background:#0E5C4D;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer}</style>
       </head><body>
       <h1>📡 غير متصل</h1>
       <p>تحقّق من اتصال الإنترنت وحاول مجدّداً</p>
       <button onclick="location.reload()">إعادة المحاولة</button>
       </body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

// ────────────── Background Sync ──────────────

self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-bookings') {
    event.waitUntil(syncOfflineBookings());
  }
  if (event.tag === 'sync-feedback') {
    event.waitUntil(syncOfflineFeedback());
  }
});

async function syncOfflineBookings() {
  // قراءة الحجوزات المحفوظة في IndexedDB ومزامنتها
  console.log('[SW] Syncing offline bookings...');
  // implementation depends on IndexedDB structure
}

async function syncOfflineFeedback() {
  console.log('[SW] Syncing offline feedback...');
}

// ────────────── Push Notifications ──────────────

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Spir Medical', body: event.data.text() };
  }

  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    image: data.image,
    data: data.data || {},
    tag: data.tag || 'spir-notification',
    requireInteraction: data.requireInteraction || false,
    vibrate: data.vibrate || [200, 100, 200],
    actions: data.actions || [],
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

  // Handle action buttons
  if (action === 'view' || action === 'open') {
    // Default - open the URL
  } else if (action === 'dismiss') {
    return;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // إذا التطبيق مفتوح، نركّز عليه
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // نفتح نافذة جديدة
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// ────────────── Periodic Background Sync (للأخبار/التحديثات) ──────────────

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-data') {
    event.waitUntil(updateBackgroundData());
  }
});

async function updateBackgroundData() {
  // تحديث البيانات في الخلفية (مثل عدد الإشعارات)
  console.log('[SW] Periodic sync running...');
}

console.log('[SW] Service Worker loaded:', CACHE_VERSION);
