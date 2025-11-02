const CACHE_NAME = 'embutidos-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Network-first para llamadas a Apps Script (POST/GET)
  if (req.url.includes('script.google.com/macros')) {
    event.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }

  // Cache-first para assets estáticos
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      // Opcional: cachear nuevas respuestas GET
      if (req.method === 'GET' && res && res.status === 200) {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
      }
      return res;
    }).catch(() => cached))
  );
});
