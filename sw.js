/* PetVia service worker – offline indulás.
   Az oldal (index.html) hálózat-első: online mindig a friss változat jön, offline a mentett.
   Ha az ikonok vagy a manifest változik, növeld a V számát. */
const V = 'petlife-v3';
const FONTS = 'petlife-fonts-2';
const LIB = 'petlife-lib';
/* az értesítések terve (az app írja, itt csak olvassuk); frissítéskor sem töröljük */
const PUSH = 'petvia-push';
/* A fiókkezelő könyvtár. Ugyanaz a cím legyen, mint az index.html SB_LIB értéke. */
const LIB_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.4';
const PAGE = './index.html';
const SHELL = ['./', PAGE, './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(V).then(c => c.addAll(SHELL))
      /* a könyvtár előtöltése nem feltétele a telepítésnek */
      .then(() => caches.open(LIB).then(c => c.add(new Request(LIB_URL, { mode: 'cors', credentials: 'omit' }))).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== V && k !== FONTS && k !== LIB && k !== PUSH).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function pageFirst(req) {
  const cache = await caches.open(V);
  const cached = await cache.match(PAGE);
  try {
    const wait = cached ? 4000 : 30000;
    const res = await Promise.race([
      fetch(req),
      new Promise((_, no) => setTimeout(() => no(new Error('timeout')), wait))
    ]);
    if (res && res.ok) { cache.put(PAGE, res.clone()); return res; }
    return cached || res;
  } catch (err) {
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(req, name) {
  const cache = await caches.open(name || V);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && res.ok) cache.put(req, res.clone());
  return res;
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(FONTS);
  const hit = await cache.match(req);
  const fresh = fetch(req).then(res => { if (res && res.ok) cache.put(req, res.clone()); return res; });
  if (hit) { fresh.catch(() => {}); return hit; }
  return fresh;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const font = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (req.url === LIB_URL) { e.respondWith(cacheFirst(req, LIB)); return; }
  if (url.origin !== self.location.origin && !font) return;
  if (req.mode === 'navigate') { e.respondWith(pageFirst(req)); return; }
  e.respondWith(font ? staleWhileRevalidate(req) : cacheFirst(req));
});

/* Értesítés: a push tartalom nélküli; a mai szöveget az app által elmentett tervből olvassuk.
   Minden push után kötelező értesítést mutatni (különben a böngésző visszavonhatja az engedélyt). */
const pad = n => String(n).padStart(2, '0');
self.addEventListener('push', e => {
  e.waitUntil((async () => {
    let n = null;
    try {
      const c = await caches.open(PUSH), r = await c.match(new URL('push-plan.json', self.registration.scope).href);
      if (r) { const p = await r.json(), d = new Date(); n = p && p.days && p.days[`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`]; }
    } catch (err) { /* nincs terv */ }
    await self.registration.showNotification(n && n.t ? String(n.t).slice(0, 80) : 'PetVia', {
      body: n && n.b ? String(n.b).slice(0, 300) : 'Nézd meg a mai teendőket és tippeket.',
      icon: './icons/icon-192.png', tag: 'petvia-daily', data: { url: './' }
    });
  })());
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) if ('focus' in c) return c.focus();
    return self.clients.openWindow(new URL('./', self.registration.scope).href);
  }));
});
