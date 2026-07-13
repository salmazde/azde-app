const CACHE_NAME = "azde-prep-v2";

// Install
self.addEventListener("install", (event) => {
    self.skipWaiting();
});

// Activate
self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
});

// Fetch
self.addEventListener("fetch", (event) => {

    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);

    // Ignore Chrome extensions, wallets, etc.
    if (url.origin !== self.location.origin) return;

    event.respondWith(

        caches.match(event.request).then(async (cached) => {

            // Serve from cache
            if (cached) {
                return cached;
            }

            try {

                const response = await fetch(event.request);

                // Cache only successful responses
                if (response.ok) {

                    const cache = await caches.open(CACHE_NAME);

                    cache.put(event.request, response.clone());

                }

                return response;

            } catch (err) {

                // Offline fallback
                if (event.request.mode === "navigate") {

                    return caches.match("/azdeinterview/index.html");

                }

                throw err;

            }

        })

    );

});
