// Offline support. Pages: try the network first so updates show straight away, fall back to the saved copy
// when there is no signal (or the network takes more than 4 seconds). Other files: saved copy first, refreshed in the background.
const CACHE = "road-rally-v15";
const FILES = ["./", "./index.html", "./katan.html", "./ludo.html", "./deal.html", "./ivy-logo.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const timeout = ms => new Promise((_, rej) => setTimeout(() => rej(new Error("slow")), ms));
self.addEventListener("fetch", e => {
  const req = e.request; if(req.method !== "GET") return;
  if(req.mode === "navigate" || req.destination === "document"){
    e.respondWith(caches.open(CACHE).then(c => Promise.race([fetch(req), timeout(4000)])
      .then(r => { if(r && r.ok) c.put(req, r.clone()); return r; })
      .catch(async () => (await c.match(req, {ignoreSearch: true})) || (await c.match("./")))));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req, {ignoreSearch: true});
    const net = fetch(req).then(r => { if(r && (r.ok || r.type === "opaque")) c.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
