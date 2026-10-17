const CACHE = "tcg-v1";
self.addEventListener("install", (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["./", "index.html", "manifest.json", "icon.svg"]))));
// Netz zuerst, Cache als Fallback: Kurse bleiben frisch, offline sieht man den letzten Stand.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        const copy = r.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return r;
      })
      .catch(() => caches.match(e.request)),
  );
});
