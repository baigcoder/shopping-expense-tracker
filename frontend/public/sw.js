// Cache reset service worker.
// Previous versions cached index.html, which can keep loading stale JS bundles.
self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
        await self.clients.claim();

        const clients = await self.clients.matchAll({
            type: 'window',
            includeUncontrolled: true,
        });

        for (const client of clients) {
            const url = new URL(client.url);
            if (url.origin === self.location.origin) {
                client.navigate(client.url);
            }
        }

        await self.registration.unregister();
    })());
});

self.addEventListener('fetch', () => {
    // Let the browser/network handle every request.
});
