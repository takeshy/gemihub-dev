// Service Worker for GemiHub — offline asset & navigation caching.
// Intentionally does NOT register a full PWA manifest (no display:standalone)
// so browsers will not show an install prompt.

const CACHE_NAME = "gemihub-sw-v2";

// ---- Install ----
self.addEventListener("install", (event) => {
  // Precache the index page so the app is available offline immediately
  // (the first navigation occurs before the SW takes control, so it won't
  // be runtime-cached without this).
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.add("/"))
      .catch(() => {}) // don't block install if precache fails
  );
  self.skipWaiting();
});

// ---- Activate ----
self.addEventListener("activate", (event) => {
  // Clean up old caches from previous SW versions
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("gemihub-sw-") && k !== CACHE_NAME)
            .map((k) => caches.delete(k))
        )
      )
  );
  self.clients.claim();
});

// ---- Fetch ----
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Skip API and auth routes — API data is managed by IndexedDB on the client
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) {
    return;
  }

  // Skip React Router single-fetch data requests (e.g. "/.data") —
  // the clientLoader handles offline fallback via IndexedDB.
  if (url.pathname.endsWith(".data")) {
    return;
  }

  // --- Hashed static assets (JS/CSS in /assets/, icons, favicon) → cache-first ---
  if (
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".ico")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // --- Navigation requests (HTML pages) → network-first, cache fallback ---
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache successful (non-redirect) HTML responses
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          // Network unreachable — serve cached page.
          // 1. Exact URL match  2. Same path ignoring query params  3. Offline fallback
          caches
            .match(request)
            .then(
              (cached) =>
                cached || caches.match(request, { ignoreSearch: true })
            )
            .then(
              (cached) =>
                cached ||
                new Response("Offline — please reconnect and reload.", {
                  status: 503,
                  headers: { "Content-Type": "text/plain" },
                })
            )
        )
    );
    return;
  }

  // --- Other sub-resources (fonts, images, etc.) → stale-while-revalidate ---
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return response;
        })
        .catch(
          () =>
            cached ||
            new Response("", { status: 503, statusText: "Service Unavailable" })
        );

      return cached || networkFetch;
    })
  );
});
