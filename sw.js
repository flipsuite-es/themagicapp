/* Service worker de App del Mago.
   Estrategia: cache-first con relleno en segundo plano. Una vez instalada,
   la app funciona completamente sin conexión. Sube CACHE al cambiar assets. */
var CACHE = "magic-v56";
var ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./fonts.css",
  "./app.js",
  "./cloud.js",
  "./supabase.js",
  "./tus.js",
  "./manifest.json",
  "./icon.svg",
  "./favicon.svg",
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

// Recibe un aviso push y muestra la notificación.
self.addEventListener("push", function (e) {
  var data = {};
  try { data = e.data ? e.data.json() : {}; } catch (err) { data = { body: e.data && e.data.text ? e.data.text() : "" }; }
  var title = data.title || "App del Mago";
  var opts = {
    body: data.body || "Tienes trucos para repasar.",
    icon: "./icon-192.png",
    badge: "./icon-192.png",
    data: { url: data.url || "./#/practica" },
    tag: "practice-reminder",
    renotify: true
  };
  e.waitUntil(self.registration.showNotification(title, opts));
});

// Al pulsar la notificación, abre (o enfoca) la app en la pantalla indicada.
self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  var target = (e.notification.data && e.notification.data.url) || "./#/practica";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        var c = list[i];
        if ("focus" in c) { try { c.navigate && c.navigate(target); } catch (err) {} return c.focus(); }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  // Solo gestionamos recursos propios; nunca las llamadas a Supabase (API, auth,
  // Storage, streaming de vídeo) para no romper sesión ni servir datos viejos.
  var url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  // Navegaciones: RED PRIMERO para no servir nunca un shell obsoleto; la copia
  // en caché queda solo como respaldo sin conexión.
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).then(function (resp) {
        if (resp && resp.ok) { var copy = resp.clone(); caches.open(CACHE).then(function (c) { c.put("./index.html", copy); }).catch(function () {}); }
        return resp;
      }).catch(function () {
        return caches.match("./index.html").then(function (c) { return c || caches.match("./"); });
      })
    );
    return;
  }

  // Recursos estáticos: caché primero; si falta, red, guardando solo respuestas
  // propias correctas (nunca errores/opacas/redirecciones).
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      if (cached) return cached;
      return fetch(e.request).then(function (resp) {
        if (resp && resp.ok && resp.type === "basic") { var copy = resp.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); }).catch(function () {}); }
        return resp;
      });
    })
  );
});
