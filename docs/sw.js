const CACHE = "tcg-v2";
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
self.addEventListener("push", (e) => {
  const d = e.data.json();
  e.waitUntil(self.registration.showNotification(d.title, { body: d.body, icon: "icon.svg", data: d.url }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data));
});
