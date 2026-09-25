// Quran Teacher AI - Resilient Offline Service Worker
const APP_VERSION = 'v3.2.0';
const CACHE_NAME = `quran-teacher-${APP_VERSION}`;

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Purging outdated cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) return;

  // For HTML documents, navigation, and JS bundles: ALWAYS Network-First
  // This guarantees users immediately get the fresh deployment!
  const isDocOrScript =
    event.request.mode === 'navigate' ||
    event.request.destination === 'document' ||
    event.request.destination === 'script' ||
    event.request.url.endsWith('.html') ||
    event.request.url.endsWith('.js');

  if (isDocOrScript) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          // If network is completely offline, fall back to cached version
          return caches.match(event.request).then((cached) => {
            if (cached) return cached;
            const basePath = self.location.pathname.replace(/\/sw\.js$/, '') || '';
            return caches.match(basePath + '/index.html') || caches.match('./index.html') || caches.match('./');
          });
        })
    );
    return;
  }

  // For static assets (images, fonts, audio): Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            !event.request.url.includes('firestore.googleapis.com')
          ) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
