// Offline-Speicher für "Johanni und Glacier".
// Das Spiel startet sofort aus dem Speicher; im Hintergrund wird geprüft,
// ob es eine neue Version gibt. Die ist dann beim nächsten Start da.
// Bei größeren Updates die Versionsnummer erhöhen.
const CACHE = 'glacier-v1';
const DATEIEN = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(DATEIEN)));
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
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.open(CACHE).then(async cache => {
      const gespeichert = await cache.match(event.request, { ignoreSearch: true });
      const ausNetz = fetch(event.request)
        .then(antwort => {
          if (antwort && antwort.ok) cache.put(event.request, antwort.clone());
          return antwort;
        })
        .catch(() => gespeichert);
      return gespeichert || ausNetz;
    })
  );
});
