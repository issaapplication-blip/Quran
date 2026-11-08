/* Service Worker — المصحف الشريف
 * ارفع رقم CACHE عند أي تغيير في الملفات أدناه ليحل الإصدار الجديد محل القديم. */
const CACHE = "mushaf-pwa-v8";
const ASSETS = [
  "./", "./index.html", "./styles.css", "./app.js", "./features.js", "./manifest.webmanifest",
  "./assets/icon.svg", "./assets/icon-192.png", "./assets/icon-512.png", "./assets/maskable-512.png", "./assets/apple-touch-icon.png",
  "./data/quran-uthmani.txt", "./data/mushaf-pages.json", "./data/adhkar-morning-evening.json",
  "./data/TANZIL-NOTICE.txt", "./data/ADHKAR-SOURCE.txt",
];
self.addEventListener("install", (e) => {
  // cache:"reload" يتجاوز ذاكرة HTTP حتى لا يُخزَّن ملف قديم داخل الإصدار الجديد
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// من الذاكرة أولاً مع تحديثها بالخلفية؛ الطلبات الخارجية (AlAdhan) تمر دون تخزين من الـ SW
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: true });
    const refresh = fetch(req).then((res) => {
      if (res && res.ok && res.type === "basic") e.waitUntil(cache.put(req, res.clone()));
      return res;
    }).catch(() => null);
    if (cached) { e.waitUntil(refresh); return cached; }
    const res = await refresh;
    if (res) return res;
    if (req.mode === "navigate") { const home = await cache.match("./index.html"); if (home) return home; }
    return Response.error();
  })());
});
