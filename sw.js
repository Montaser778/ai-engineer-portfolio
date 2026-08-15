/* sw.js — cache-first for static assets, network-first for HTML (§26).
   Versioned cache name so a new deploy invalidates cleanly. */
var CACHE_VERSION = 'mh-v1.1.0';
var STATIC_CACHE = CACHE_VERSION + '-static';

var PRECACHE = [
  './',
  'index.html',
  'offline.html',
  'assets/css/site.css',
  'assets/js/scene.js',
  'assets/js/site.js',
  'assets/js/hero3d.js',
  'favicon.svg',
  'site.webmanifest'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function (cache) {
      return cache.addAll(PRECACHE).catch(function () { /* best-effort precache */ });
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k.indexOf('mh-') === 0 && k !== STATIC_CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin && url.hostname.indexOf('cdnjs.cloudflare.com') === -1 && url.hostname.indexOf('fonts.g') === -1) return;

  var isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').indexOf('text/html') !== -1;

  if (isHTML) {
    // network-first for HTML, fall back to cache, then offline.html
    event.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(STATIC_CACHE).then(function (cache) { cache.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (cached) { return cached || caches.match('offline.html'); });
      })
    );
    return;
  }

  // cache-first for static assets
  event.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(STATIC_CACHE).then(function (cache) { cache.put(req, copy); });
        return res;
      }).catch(function () { return cached; });
    })
  );
});
