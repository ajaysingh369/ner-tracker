const CACHE_NAME = "runner-tracker-cache-v5"; // Update version to clear old cache
const CACHE_LIFETIME = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

const urlsToCache = [
    "/",
    "/index.html",
    "/styles.css",
    "/script.js",
    "/manifest.json"
];

// Install Service Worker & Cache Static Assets
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("✅ Caching App Shell...");
            return cache.addAll(urlsToCache);
        })
    );
    self.skipWaiting(); // Activate new SW immediately
});

// Fetch & Serve Cached Files (Offline Support)
self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.open(CACHE_NAME).then(async (cache) => {
            const cachedResponse = await cache.match(event.request);
            const now = Date.now();

            if (cachedResponse) {
                const cachedTime = await cache.match(event.request.url + "-timestamp");
                const cacheAge = cachedTime ? parseInt(await cachedTime.text()) : 0;

                if (now - cacheAge < CACHE_LIFETIME) {
                    // ✅ If cache is fresh (less than 4 hours), serve from cache
                    console.log("✅ Serving from cache:", event.request.url);
                    return cachedResponse;
                } else {
                    console.log("⚠️ Cache expired, fetching fresh:", event.request.url);
                }
            }

            // 🌍 Fetch fresh from the network & update cache
            return fetch(event.request)
                .then((networkResponse) => {
                    cache.put(event.request, networkResponse.clone());
                    cache.put(event.request.url + "-timestamp", new Response(now.toString())); // Save cache time
                    return networkResponse;
                })
                .catch(() => cachedResponse || caches.match("/index.html")); // If offline, fallback to cached version
        })
    );
});


// Activate Service Worker & Clean Old Caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log("🗑 Deleting old cache:", cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim(); // Take control of open pages
});
