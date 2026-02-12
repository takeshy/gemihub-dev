// Service Worker for GemiHub — offline asset & navigation caching.
// Intentionally does NOT register a full PWA manifest (no display:standalone)
// so browsers will not show an install prompt.

const CACHE_NAME = "gemihub-sw-v1";

// ---- Install ----
self.addEventListener("install", (event) => {
  // Precache the index page so the app shell is available offline immediately.
  // The first navigation occurs before the SW takes control, so it won't be
  // runtime-cached without this. Assets are cached separately via warmup message.
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.add("/"))
      .catch(() => {}) // don't block install if precache fails (e.g. not authenticated)
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

// ---- Message handler: cache warmup after first activation ----
// The page sends asset URLs after the SW first takes control, ensuring
// JS/CSS are in the Cache API for offline use (they load before the SW
// is active on the very first visit, so runtime caching misses them).
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "warmup") {
    var urls = event.data.urls || [];
    event.waitUntil(
      caches.open(CACHE_NAME).then(function (cache) {
        var promises = urls.map(function (url) {
          return cache.match(url).then(function (existing) {
            if (existing) return; // Already cached
            return fetch(url, { credentials: "same-origin" })
              .then(function (resp) {
                if (resp.ok) return cache.put(url, resp);
              })
              .catch(function () {});
          });
        });
        return Promise.all(promises);
      })
    );
  }
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

  // Skip React Router single-fetch data requests — handled by clientLoader
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
          // 1. Exact URL match (ignoreVary for warmup-cached responses with different Accept)
          // 2. Same path ignoring query params (/?file=xxx → cached /)
          // 3. Explicit "/" fallback
          // 4. Offline error
          caches
            .match(request, { ignoreVary: true })
            .then(
              (cached) =>
                cached ||
                caches.match(request, { ignoreSearch: true, ignoreVary: true })
            )
            .then(
              (cached) =>
                cached || caches.match("/", { ignoreVary: true })
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
