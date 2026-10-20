/* Generated deployment revision and exact shell URLs are injected by build_pages.py. */
const CACHE = 'notice-shell-9e8a62b38575c907';
const ASSETS = ["/index.html", "/notice-map/vendor/leaflet.css?v=a783710282418482", "/notice-map/style.css?v=bbea8b591b01fc62", "/notice-map/public-parity.css?v=cb221a429660e5bd", "/notice-map/private-parity.css?v=e00a121f96c5a92b", "/notice-map/shell-parity.css?v=5ae09e45c56909ef", "/notice-map/appearance.css?v=f51038bb17edf31c", "/notice-map/appearance.js?v=f460d966f72699e4", "/notice-map/vendor/leaflet.js?v=db49d009c841f5ca", "/notice-map/catalog-data.js?v=57175cec0bda626e", "/notice-map/data.js?v=54440aed75db26cd", "/notice-map/supplemental-data.js?v=4b59e921b9e29985", "/notice-map/private-data.js?v=006ad0c818807b62", "/notice-map/view.js?v=3704dd64929de07b", "/notice-map/gallery.js?v=065d3259cb112a8c", "/notice-map/private.js?v=11df82842cfb6f3a", "/notice-map/lifecycle.js?v=4fc5c24bcb15f38c", "/notice-map/public-filters.js?v=82fc4249bed747a0", "/notice-map/catalog-view.js?v=7b78203c80761531", "/notice-map/app.js?v=810e98b7a5655f43", "/notice-map/public.js?v=66b55ccb1ba68b20", "/notice-map/calculations.js?v=4ae674a087ff7211", "/notice-map/calculator-view.js?v=69769f45d257d4cf", "/notice-map/shell.js?v=f93c28162949a9a9", "/notice-map/recruitment.css?v=95613ba84e1456d9", "/notice-map/recruitment.js?v=877af9bfe3ed8225", "/notice-map/collection-store.js?v=54872a12193995b3", "/notice-map/collection-view.js?v=73d632926488effa", "/notice-map/collection.js?v=68cd040f1c8d46c3", "/notice-map/pwa.css?v=9a3af0d85b2ac429", "/notice-map/pwa.js?v=6071c5a23f226de5", "/notice-map/mobile.css?v=6a68d708897e6788", "/notice-map/actions.css?v=99b692424489ee64", "/notice-map/collection.css?v=bb724f544d77abdd", "/notice-map/bootstrap.js?v=a95612e312f5ec8e"];
const SHELL = '/index.html';
self.addEventListener('install', event => {
  // Keep the existing worker until every open tab has released its old version.
  // addAll is atomic: an incomplete download must never replace a working shell.
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('notice-shell-') && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(async () => {
      const cache = await caches.open(CACHE);
      return await cache.match(SHELL) || new Response('인터넷 연결 후 다시 열어주세요.', {
        status: 503, headers: {'Content-Type': 'text/plain;charset=utf-8'}
      });
    }));
  } else if (ASSETS.includes(url.pathname + url.search) && url.pathname !== SHELL) {
    // Content-hashed URLs cannot return assets from another deployment.
    event.respondWith(caches.open(CACHE).then(async cache => await cache.match(request) || fetch(request)));
  }
  // Photos, PDFs and map tiles are deliberately left to the browser HTTP cache.
});
