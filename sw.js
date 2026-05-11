const CACHE = 'teranet-v2.4';
const BASE  = 'https://tezkgiraldo-wq.github.io/teranet-app/';
const ASSETS = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.json',
  BASE + 'icon-192.png',
  BASE + 'icon-512.png',
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

  // Siempre red para Google APIs y CDNs
  if (url.includes('googleapis') ||
      url.includes('accounts.google') ||
      url.includes('cdnjs') ||
      url.includes('esm.sh') ||
      url.includes('gstatic')) {
    return;
  }

  // Cache-first para assets propios
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // Cachear respuestas exitosas de nuestros assets
        if (res && res.status === 200 && ASSETS.some(a => url.startsWith(a) || url === a)) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached); // offline fallback
    })
  );
});
