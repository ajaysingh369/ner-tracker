const CACHE_NAME = "runner-tracker-cache-v24"; // Increment to bust previous cache
const CACHE_LIFETIME = 30 * 60 * 1000; // 30 mins

const urlsToCache = [
    "/",
    "/index.html",
    "/styles.css",
    "/script.js",
    "/manifest.json"
];

// 🧠 Helper: Should we cache this API URL?
const isCachableAPI = (url) => {
    return url.includes("/activitiesByEvent") ||
        url.includes("/athletesByEvent") ||
        url.includes("/eventSummary");
};

// ⛔ Helper: Should we skip caching for this domain?
const isExternalRequest = (url) => {
    return !url.startsWith(self.location.origin);
};

// ✅ Install: Cache static assets
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("✅ Caching App Shell...");
            return cache.addAll(urlsToCache);
        })
    );
    self.skipWaiting();
});

// 🔁 Fetch: Serve from cache if valid, otherwise fetch and update
self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (request.method !== "GET") return;

    // Locale JSON: stale-while-revalidate (keep query string such as ?v=3)
    if (url.pathname.startsWith("/locales/") && url.pathname.endsWith(".json")) {
        event.respondWith((async () => {
            const cache = await caches.open(CACHE_NAME);
            const cached = await cache.match(request); // respects query params
            const network = fetch(request).then((resp) => {
                if (resp.ok) cache.put(request, resp.clone());
                return resp;
            }).catch(() => null);
            return cached || network || new Response("{}", { headers: { "Content-Type": "application/json" } });
        })());
        return;
    }

    event.respondWith(
        caches.open(CACHE_NAME).then(async (cache) => {
            const now = Date.now();
            const cachedResponse = await cache.match(request);
            const cachedTimeResp = await cache.match(request.url + "-timestamp");
            const cacheAge = cachedTimeResp ? parseInt(await cachedTimeResp.text()) : 0;

            // 👀 Check TTL and serve fresh if needed
            const isFresh = now - cacheAge < CACHE_LIFETIME;

            // 1. Serve fresh cache if valid
            if (cachedResponse && isFresh) {
                console.log("✅ Serving from cache:", request.url);
                return cachedResponse;
            }

            // 2. Skip third-party URLs
            if (isExternalRequest(request.url)) {
                return fetch(request).catch(() => {
                    if (cachedResponse) return cachedResponse;
                    if (request.mode === 'navigate') return caches.match("/index.html");
                    return null;
                });
            }

            // 3. Try fetching from network
            return fetch(request)
                .then((networkResponse) => {
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
                        return networkResponse;
                    }

                    // 4. Handle caching logic for APIs
                    if (isCachableAPI(request.url)) {
                        const cloned = networkResponse.clone();
                        return cloned.json().then((jsonData) => {
                            const isEmpty = Array.isArray(jsonData) ? jsonData.length === 0 : !jsonData;

                            if (isEmpty) {
                                console.log("🚫 Skipping empty API response:", request.url);
                                return networkResponse;
                            }

                            // ✅ Cache valid API response
                            cache.put(request, networkResponse.clone());
                            cache.put(request.url + "-timestamp", new Response(now.toString()));
                            return networkResponse;
                        }).catch(err => {
                            console.error("❌ JSON parsing failed:", err);
                            return networkResponse;
                        });
                    }

                    // 5. Cache static assets or other non-API requests
                    cache.put(request, networkResponse.clone());
                    cache.put(request.url + "-timestamp", new Response(now.toString()));
                    return networkResponse;
                })
                .catch(() => {
                    if (cachedResponse) return cachedResponse;
                    // Only return index.html for navigation requests (HTML pages)
                    if (request.mode === 'navigate') return caches.match("/index.html");
                    return null;
                });
        })
    );
});

// 🧹 Activate: Remove old caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log("🗑 Removing old cache:", cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});
