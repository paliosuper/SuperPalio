const CACHE_NAME = 'shadow-shooter-v1';
const ASSETS = [
    'index.html',
    'style.css',
    'game.js',
    'manifest.json',
    'anao.png.png',
    'arun1.png.png',
    'arun2.png.png',
    'arun3.png.png',
    'celeiro.png.png',
    'cenario.png.png',
    'daynielsupimpa.png.png',
    'idle.png.png',
    'inicial.png.png',
    'jogando.png.png',
    'jogou.png.png',
    'maca.png.png',
    'namao.png.png',
    'ramo1.png.png',
    'ramo2.png.png',
    'ramo3.png.png',
    'refri.png.png',
    'run1.png.png',
    'run2.png.png',
    'run3.png.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
