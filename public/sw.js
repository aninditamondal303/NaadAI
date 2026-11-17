/*
 * Offline support for Naad AI. The app, its fonts and the tanpura, tabla and
 * demo recordings are kept in the browser's cache after the first visit, so
 * riyaz works without a connection. Pages are fetched fresh when online.
 */
const CACHE = "naad-v1";
const scope = self.registration.scope;

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const urls = ["", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "samples/demo/yaman-demo.wav"];
    for (const dir of ["samples/tanpura", "samples/tabla"]) {
      try {
        const res = await fetch(`${scope}${dir}/manifest.json`);
        const m = await res.clone().json();
        await cache.put(`${scope}${dir}/manifest.json`, res);
        const files = JSON.stringify(m).match(/[\w.-]+\.(wav|mp3|ogg)/g) || [];
        for (const f of new Set(files)) urls.push(`${dir}/${f}`);
      } catch { /* offline during install: cached later on use */ }
    }
    await Promise.all(urls.map(u => cache.add(`${scope}${u}`).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET" || !req.url.startsWith(scope)) return;
  if (req.mode === "navigate") {
    // network first for the page, so updates arrive; cached copy when offline
    event.respondWith(fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(`${scope}index.html`, copy));
      return res;
    }).catch(() => caches.match(`${scope}index.html`)));
    return;
  }
  // cache first for files (scripts, styles, fonts, recordings); hashed names change on update
  event.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
