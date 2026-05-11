const CACHE = 'teranet-v2.4';
const BASE  = 'https://tezkgiraldo-wq.github.io/teranet-app/';
const SQLJS = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/';

const ASSETS = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.json',
  BASE + 'icon-192.png',
  BASE + 'icon-512.png',
  SQLJS + 'sql-wasm.js',
  SQLJS + 'sql-wasm.wasm',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS).catch(()=>{}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Siempre red para Google APIs y auth
  if (url.includes('googleapis.com') ||
      url.includes('accounts.google.com') ||
      url.includes('gstatic.com') ||
      url.includes('oauth')) {
    return;
  }

  // Cache-first para todo lo demás (assets propios + SQL.js)
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached || new Response('Offline', {status: 503}));
    })
  );
});
