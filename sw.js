/* Generated deployment revision and exact shell URLs are injected by build_pages.py. */
const CACHE = 'notice-shell-94c9a236bc53f0d0';
const ASSETS = ["/index.html", "/notice-map/vendor/leaflet.css?v=a783710282418482", "/notice-map/style.css?v=bbea8b591b01fc62", "/notice-map/public-parity.css?v=cb221a429660e5bd", "/notice-map/private-parity.css?v=e00a121f96c5a92b", "/notice-map/shell-parity.css?v=9bcb9b7444db1e3f", "/notice-map/appearance.css?v=f51038bb17edf31c", "/notice-map/appearance.js?v=f460d966f72699e4", "/notice-map/vendor/leaflet.js?v=db49d009c841f5ca", "/notice-map/catalog-data.js?v=57175cec0bda626e", "/notice-map/data.js?v=54440aed75db26cd", "/notice-map/supplemental-data.js?v=4b59e921b9e29985", "/notice-map/private-data.js?v=006ad0c818807b62", "/notice-map/view.js?v=3704dd64929de07b", "/notice-map/gallery.js?v=065d3259cb112a8c", "/notice-map/private.js?v=11df82842cfb6f3a", "/notice-map/lifecycle.js?v=4fc5c24bcb15f38c", "/notice-map/public-filters.js?v=82fc4249bed747a0", "/notice-map/catalog-view.js?v=7b78203c80761531", "/notice-map/location.js?v=a23dd3607e7fa9e8", "/notice-map/app.js?v=7e52467cce216685", "/notice-map/public.js?v=fe995e185e88e530", "/notice-map/calculations.js?v=4ae674a087ff7211", "/notice-map/calculator-view.js?v=69769f45d257d4cf", "/notice-map/shell.js?v=f93c28162949a9a9", "/notice-map/recruitment.css?v=95613ba84e1456d9", "/notice-map/recruitment.js?v=fab858c43c7b99a2", "/notice-map/collection-store.js?v=44f3ee0fce1d53e5", "/notice-map/collection-view.js?v=73d632926488effa", "/notice-map/collection.js?v=d53aae6e872c9bbc", "/notice-map/pwa.css?v=7395b727f0daf3fd", "/notice-map/pwa.js?v=0e178bea887acef6", "/notice-map/mobile.css?v=6a68d708897e6788", "/notice-map/actions.css?v=99b692424489ee64", "/notice-map/collection.css?v=bb724f544d77abdd", "/notice-map/bootstrap.js?v=a95612e312f5ec8e"];
const SHELL = '/index.html';
function isAppNavigation(url) {
  return /^\/(?:index\.html)?$/.test(url.pathname) ||
    /^\/notice-map(?:\/index\.html|\/)?$/.test(url.pathname) ||
    /^\/content\/map\/?$/.test(url.pathname) ||
    /^\/plan(?:\/[0-9]+)?\/?$/.test(url.pathname) ||
    /^\/[0-9]{8}(?:\/[0-9]+)?\/?$/.test(url.pathname) ||
    (url.pathname === '/bbs/group.php' && url.searchParams.get('gr_id') === 'aymap') ||
    (url.pathname === '/bbs/board.php' && url.searchParams.get('bo_table') === 'plan');
}
async function navigate(request) {
  let response;
  try {
    response = await fetch(request);
    // Preserve Pages' normal 404 redirect document and successful responses.
    if (response.status < 500) return response;
  } catch { /* The cached app remains available when the network fails. */ }
  const cache = await caches.open(CACHE);
  const cached = await cache.match(SHELL);
  if (cached) {
    // Connectivity alone cannot identify a snapshot served during a server error.
    const html = (await cached.text()).replace(/<html\b/i, '<html data-cached-shell');
    const headers = new Headers(cached.headers);
    headers.set('Content-Type', 'text/html;charset=utf-8');
    headers.delete('Content-Length');
    headers.delete('Content-Encoding');
    return new Response(html, {headers});
  }
  return response || new Response('인터넷 연결 후 다시 열어주세요.', {
    status: 503, headers: {'Content-Type': 'text/plain;charset=utf-8'}
  });
}
self.addEventListener('install', event => {
  // Keep the existing worker until every open tab has released its old version.
  // addAll is atomic: an incomplete download must never replace a working shell.
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS.map(url => new Request(new URL(url, self.location.origin), {cache: 'reload'})))));
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
    // Never replace a PDF, photo or unrelated page with the application HTML.
    if (isAppNavigation(url)) event.respondWith(navigate(request));
  } else if (ASSETS.includes(url.pathname + url.search) && url.pathname !== SHELL) {
    // Content-hashed URLs cannot return assets from another deployment.
    event.respondWith(caches.open(CACHE).then(async cache => await cache.match(request) || fetch(request)));
  }
  // Photos, PDFs and map tiles are deliberately left to the browser HTTP cache.
});
