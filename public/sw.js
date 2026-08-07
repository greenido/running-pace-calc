//
// Service worker. The whole point of this app is being usable at a start line
// with no signal, so everything it needs is cached up front.
//

const CACHE = 'pace-calc-v3';

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

//
// Deliberately not cache.addAll(). Two reasons: it stores responses with the
// redirect flag still set, which cannot later be served to a navigation, and
// it is all-or-nothing, so one 404 would abort the entire install.
//
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await Promise.all(
        SHELL.map(async (path) => {
          try {
            const response = await fetch(path, { cache: 'reload' });
            if (response.ok) await cache.put(path, await withoutRedirectFlag(response));
          } catch {
            // A missing file should not stop the rest of the shell caching.
          }
        }),
      );
      await self.skipWaiting();
    })(),
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
        .then(async (response) => {
          const clean = await withoutRedirectFlag(response);
          if (clean.ok) cache.put(request, clean.clone());
          return clean;
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

//
// Chrome refuses a Response with `redirected === true` as the answer to a
// navigation and fails the load outright — a blank chrome-error page. Any
// redirect trips this: a host that rewrites /page.html to /page, or a
// directory URL that gains a trailing slash. Rebuilding the response clears
// the flag while keeping the body and headers.
//
async function withoutRedirectFlag(response) {
  if (!response.redirected) return response;
  return new Response(await response.blob(), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
