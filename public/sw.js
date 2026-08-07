//
// Service worker. The whole point of this app is being usable at a start line
// with no signal, so everything it needs is cached up front.
//

const CACHE = 'pace-calc-v1';

const SHELL = [
  './',
  'index.html',
  'marathon-food.html',
  'manifest.webmanifest',
  'css/normalize.css',
  'css/main.css',
  'js/main.js',
  'js/pace.js',
  'js/predict.js',
  'assets/favicon.png',
  'assets/apple-touch-icon.png',
  'assets/icon-192.png',
  'assets/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

//
// Stale-while-revalidate: answer from cache instantly, then refresh in the
// background. A deploy lands on the next visit without needing the cache name
// to be bumped by hand.
//
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);

      // The calculator keeps its state in the query string, so a navigation to
      // "?u=km&d=42.2" would never match a cached entry on its own.
      const cached = await cache.match(request, {
        ignoreSearch: request.mode === 'navigate',
      });

      const fromNetwork = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => null);

      if (cached) {
        event.waitUntil(fromNetwork);
        return cached;
      }

      return (
        (await fromNetwork) ||
        new Response('Offline and not cached yet.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' },
        })
      );
    })(),
  );
});
