/* Service worker — app shell cache for full offline use */
const CACHE = "maths-nathan-v3";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png"
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
function cachePut(req, res){ const c=res.clone(); caches.open(CACHE).then(x=>x.put(req,c)).catch(()=>{}); return res; }
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const isHTML = req.mode === "navigate" || (req.headers.get("accept")||"").includes("text/html");
  if (isHTML){
    // network-first so updates show immediately when online; cache fallback offline
    e.respondWith(
      fetch(req).then(res => cachePut(req, res))
        .catch(() => caches.match(req).then(hit => hit || caches.match("./index.html")))
    );
  } else {
    // cache-first for static assets (icons, manifest)
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => cachePut(req, res)))
    );
  }
});
