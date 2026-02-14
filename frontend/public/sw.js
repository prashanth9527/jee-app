const CACHE_PREFIX = 'jee-app';
const CACHE_NAME = 'jee-app-v2';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

// Remove older caches created by previous service-worker versions.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Intentionally do not intercept requests.
// Next.js static assets use hashed paths and should be served directly by the network/CDN.




