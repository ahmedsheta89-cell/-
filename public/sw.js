// Quran Teacher AI - Offline Service Worker
const CACHE_NAME = 'quran-teacher-v2';

self.addEventListener('install', (event) => {
  const basePath = self.location.pathname.replace(/\/sw\.js$/, '') || '';
  const STATIC_ASSETS = [
    basePath + '/',
    basePath + '/index.html',
    basePath + '/manifest.json',
    basePath + '/favicon.svg',
    basePath + '/assets/icon-192.png',
    basePath + '/assets/icon-512.png'
  ];

  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Safely cache each asset without rejecting the whole install if one fails
      for (const asset of STATIC_ASSETS) {
        try {
          await cache.add(asset);
        } catch (e) {
          // Ignore individual missing assets
        }
      }
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          event.request.method === 'GET' &&
          !event.request.url.includes('/api/') &&
          !event.request.url.includes('firestore.googleapis.com')
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          const basePath = self.location.pathname.replace(/\/sw\.js$/, '') || '';
          return caches.match(basePath + '/index.html') || caches.match('./');
        }
      });
    })
  );
});
