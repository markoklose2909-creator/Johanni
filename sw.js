// Offline-Speicher für "Johanni und Glacier".
// Mit Internet wird das Spiel immer frisch vom Server geladen (Updates sind
// sofort da). Ohne Internet startet es aus dem Speicher.
const CACHE = 'glacier-v2';
const DATEIEN = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.addAll(DATEIEN.map(url => new Request(url, { cache: 'reload' })))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(namen =>
      Promise.all(namen.filter(n => n !== CACHE).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const anfrage = event.request;
  if (anfrage.method !== 'GET') return;

  const istSeite = anfrage.mode === 'navigate' || anfrage.url.endsWith('.html');

  if (istSeite) {
    // Spiel selbst: erst Server (am Browser-Zwischenspeicher vorbei), sonst Speicher
    event.respondWith(
      fetch(anfrage, { cache: 'no-cache' })
        .then(antwort => {
          if (antwort && antwort.ok) {
            const kopie = antwort.clone();
            caches.open(CACHE).then(cache => cache.put(anfrage, kopie));
          }
          return antwort;
        })
        .catch(() =>
          caches.match(anfrage, { ignoreSearch: true })
            .then(treffer => treffer || caches.match('./index.html'))
        )
    );
    return;
  }

  // Bilder & Co.: aus dem Speicher, sonst vom Server
  event.respondWith(
    caches.match(anfrage, { ignoreSearch: true }).then(treffer =>
      treffer || fetch(anfrage).then(antwort => {
        if (antwort && antwort.ok) {
          const kopie = antwort.clone();
          caches.open(CACHE).then(cache => cache.put(anfrage, kopie));
        }
        return antwort;
      })
    )
  );
});
