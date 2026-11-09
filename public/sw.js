/*
 * FRAME FLOW — Service Worker (fundação PWA)
 * Estratégias:
 *  - Navegação: rede primeiro, fallback ao shell em cache (modo offline).
 *  - Assets estáticos próprios (ícones/manifest): cache primeiro.
 *  - Auth/Supabase/API: sempre rede (nunca cache — segurança e dados reais).
 * Nota: dados reais exigem rede; o offline garante apenas o shell da aplicação.
 */
const CACHE_VERSION = "frame-flow-v2";
const PRECACHE = [
  "/",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Supabase / autenticação / API: sempre rede. Falha explicitamente quando offline.
  const isNetworkOnly =
    request.method !== "GET" ||
    url.pathname.startsWith("/api/") ||
    url.hostname.endsWith(".supabase.co") ||
    url.hostname.includes("supabase");

  if (isNetworkOnly) return;

  // Navegação: rede primeiro, fallback offline ao shell.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          // A demo must never replace the authenticated app's offline shell.
          if (url.pathname === "/" && response.ok) {
            caches.open(CACHE_VERSION).then((cache) => cache.put("/", copy));
          }
          return response;
        })
        .catch(() => caches.match("/"))
    );
    return;
  }

  // Assets estáticos próprios: cache primeiro.
  const isOwnStatic =
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/icons/") || url.pathname === "/manifest.webmanifest");
  if (isOwnStatic) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
            return response;
          })
      )
    );
    return;
  }

  // Demais GETs estáticos do app (chunks JS/CSS): stale-while-revalidate.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(CACHE_VERSION).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});
