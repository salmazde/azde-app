const CACHE_NAME = "azde-prep-v9.0";

const FILES_TO_CACHE = [
    "./manifest.json",
    "./icon-192.png"
];

// Install
self.addEventListener("install", event => {

    self.skipWaiting();

    event.waitUntil(

        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(FILES_TO_CACHE))

    );

});

// Activate
self.addEventListener("activate", event => {

    event.waitUntil(

        caches.keys().then(keys => {

            return Promise.all(

                keys.map(key => {

                    if (key !== CACHE_NAME) {

                        return caches.delete(key);

                    }

                })

            );

        })

    );

    self.clients.claim();

});

// Network First for HTML
self.addEventListener("fetch", event => {

    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);

    if (url.origin !== location.origin) return;

    // HTML always tries network first
if (event.request.mode === "navigate") {

    event.respondWith(fetch(event.request));

    return;

}

    // Other files: Cache First
    event.respondWith(

        caches.match(event.request)

            .then(cached => {

                return cached || fetch(event.request)

                    .then(response => {

                        const copy = response.clone();

                        caches.open(CACHE_NAME)

                            .then(cache => cache.put(event.request, copy));

                        return response;

                    });

            })

    );

});
