const CACHE_NAME = 'hi-calc-pro-v23-offline-v16';
const CORE_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './hi-logo.png',
    './hi-logo.svg',
    './kakao-channel-qr.svg',
    './wps_sample.txt',
    './welder_sample.txt',
    './css/style.css',
    './js/data_store.js',
    './js/help_manual.js',
    './js/calculator.js',
    './pages/dashboard.js',
    './js/main.js'
];

const SW_MANIFEST_JSON = JSON.stringify({
    name: "HeatInPut Calculator",
    short_name: "HeatInPut Calculator",
    description: "Welding Heat Input Calculator v2.3 (Offline-Ready)",
    start_url: "./index.html",
    scope: "./",
    display: "standalone",
    background_color: "#f8f9fa",
    theme_color: "#ff7f00",
    icons: [
        { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        { src: "hi-logo.svg", sizes: "192x192 512x512 any", type: "image/svg+xml", purpose: "any" }
    ]
});

async function generateSquareIconResponse(size) {
    try {
        const res = await fetch('./hi-logo.png');
        const blob = await res.blob();
        if (typeof OffscreenCanvas !== 'undefined' && typeof createImageBitmap === 'function') {
            const bmp = await createImageBitmap(blob);
            const canvas = new OffscreenCanvas(size, size);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(bmp, 0, 0, size, size);
            const outBlob = await canvas.convertToBlob({ type: 'image/png' });
            return new Response(outBlob, {
                status: 200,
                headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000' }
            });
        }
        return new Response(blob, { status: 200, headers: { 'Content-Type': 'image/png' } });
    } catch (e) {
        return fetch('./hi-logo.png');
    }
}

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async cache => {
            await cache.addAll(CORE_ASSETS).catch(() => {});
            try {
                const r192 = await generateSquareIconResponse(192);
                const r512 = await generateSquareIconResponse(512);
                await cache.put('./icon-192.png', r192);
                await cache.put('./icon-512.png', r512);
            } catch (e) {}
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) return caches.delete(key);
                })
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);
    if (url.pathname.endsWith('/manifest.json')) {
        event.respondWith(
            new Response(SW_MANIFEST_JSON, {
                status: 200,
                headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' }
            })
        );
        return;
    }
    if (url.pathname.endsWith('/icon-192.png') || url.pathname.endsWith('/icon-512.png')) {
        const size = url.pathname.endsWith('/icon-192.png') ? 192 : 512;
        event.respondWith(
            caches.match(url.pathname.endsWith('/icon-192.png') ? './icon-192.png' : './icon-512.png')
                .then(cached => cached || generateSquareIconResponse(size))
        );
        return;
    }
    event.respondWith(
        fetch(event.request)
            .then(networkRes => {
                if (networkRes && networkRes.status === 200) {
                    const resClone = networkRes.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, resClone).catch(() => {});
                    });
                }
                return networkRes;
            })
            .catch(() =>
                caches.match(event.request).then(cachedRes => {
                    if (cachedRes) return cachedRes;
                    if (event.request.mode === 'navigate') {
                        return caches.match('./index.html');
                    }
                })
            )
    );
});
