const CACHE = 'aac-starter-v2';
const RUNTIME = 'aac-runtime-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(urlsToCache)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE && key !== RUNTIME) return caches.delete(key);
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isApiRequest = isSameOrigin && url.pathname.startsWith('/api/');

  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then(resp => {
          const copy = resp.clone();
          caches.open(RUNTIME).then(cache => cache.put(request, copy));
          return resp;
        })
        .catch(async () => {
          const cached = await caches.match('/index.html');
          return cached || Response.error();
        })
    );
    return;
  }

  if (isApiRequest) {
    e.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  if (request.destination === 'image' || isSameOrigin) {
    e.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(resp => {
          const copy = resp.clone();
          caches.open(RUNTIME).then(cache => cache.put(request, copy));
          return resp;
        });
      })
    );
  }
});
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
