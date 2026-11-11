/* Service Worker — المصحف الشريف
 * ارفع رقم CACHE عند أي تغيير في الملفات أدناه ليحل الإصدار الجديد محل القديم. */
const CACHE = "mushaf-pwa-v16";
const ASSETS = [
  "./", "./index.html", "./styles.css", "./app.js", "./features.js", "./manifest.webmanifest",
  "./assets/icon.svg", "./assets/mushaf-icon.png", "./assets/icon-192.png", "./assets/icon-512.png", "./assets/maskable-512.png", "./assets/apple-touch-icon.png",
  "./data/quran-uthmani.txt", "./data/mushaf-pages.json", "./data/adhkar-morning-evening.json",
  "./data/TANZIL-NOTICE.txt", "./data/ADHKAR-SOURCE.txt",
];
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS.map((url) => new Request(url, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});
// Cache-first مع تحديث الخلفية. تُسجّل مهمة waitUntil أثناء حدث fetch نفسه.
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  const cachePromise = caches.open(CACHE);
  const networkPromise = fetch(request).then((response) => {
    if (response && response.ok && response.type === "basic") {
      return cachePromise.then((cache) => cache.put(request, response.clone())).then(() => response);
    }
    return response;
  });

  event.waitUntil(networkPromise.then(() => undefined).catch(() => undefined));
  event.respondWith((async () => {
    const cache = await cachePromise;
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    try {
      const response = await networkPromise;
      if (response) return response;
    } catch {}
    if (request.mode === "navigate") {
      const home = await cache.match("./index.html");
      if (home) return home;
    }
    return Response.error();
  })());
});
