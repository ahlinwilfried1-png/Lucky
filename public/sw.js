const CACHE_NAME = 'iagri-cache-v1';
const OFFLINE_URL = '/index.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        '/icon.svg'
      ]).catch(err => console.warn('PWA Pre-cache warning:', err));
    })
  );
  self.skipWaiting();
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
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // We only intercept GET requests
  if (event.request.method !== 'GET') return;

  // Do not intercept API requests, Supabase calls, or local dev server tools
  const url = event.request.url;
  if (url.includes('/api/') || url.includes('supabase.co') || url.includes('socket.io') || url.includes('/@vite/') || url.includes('hot-update')) {
    return;
  }

  // Network-first strategy with cache-fallback, serving index.html on navigation failures
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If it's a valid response, clone and cache it for offline support
        if (response && response.status === 200 && response.type === 'basic') {
          const responseCopy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseCopy);
          });
        }
        return response;
      })
      .catch(() => {
        // If network request failed, try cache match
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If a page navigation failed, return index.html (SPA entry point)
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
        });
      })
  );
});
