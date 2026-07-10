/* Service worker de The Magic App.
   Estrategia: cache-first con relleno en segundo plano. Una vez instalada,
   la app funciona completamente sin conexión. Sube CACHE al cambiar assets. */
var CACHE = "magic-v8";
var ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./cloud.js",
  "./supabase.js",
  "./manifest.json",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  // Solo cacheamos recursos propios; nunca las llamadas a Supabase (API, auth,
  // Storage, streaming de vídeo) para no romper sesión ni servir datos viejos.
  if (new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      if (cached) return cached;
      return fetch(e.request).then(function (resp) {
        var copy = resp.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); }).catch(function () {});
        return resp;
      }).catch(function () {
        return caches.match("./index.html");
      });
    })
  );
});
