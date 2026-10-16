/* Petavira service worker – offline indulás.
   Az oldal (index.html) hálózat-első: online mindig a friss változat jön, offline a mentett.
   Ha az ikonok vagy a manifest változik, növeld a V számát. */
const V = 'petlife-v10';
const LIB = 'petlife-lib-2';
/* az értesítések terve (az app írja, itt csak olvassuk); frissítéskor sem töröljük */
const PUSH = 'petvia-push';
/* a fajképek (img/faj/) első megjelenéskor töltődnek le, és verzióváltáskor is megmaradnak */
const IMG = 'petlife-img-1';
/* A fiókkezelő könyvtár saját tárhelyről (biztonság, A kör). Ugyanaz a fájl legyen, mint az index.html SB_LIB értéke;
   a régi (jsDelivr) gyorsítótár az aktiváláskor törlődik, mert a LIB neve megváltozott. */
const LIB_URL = new URL('./vendor/supabase-js-2.112.4.js', self.registration.scope).href;
const PAGE = './index.html';
const SHELL = ['./', PAGE, './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png', './img/paw-144.webp', './fonts/fraunces-var.woff', './fonts/plusjakartasans-var.woff', './img/kezdo.webp', './img/tile-emlos.webp', './img/tile-madar.webp', './img/tile-gyik.webp', './img/tile-kigyo.webp', './img/tile-teknos.webp', './img/tile-keteltu.webp', './img/tile-hal.webp', './img/tile-gerinctelen.webp', './img/tile-egyeb.webp'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(V).then(c => c.addAll(SHELL))
      /* a könyvtár előtöltése nem feltétele a telepítésnek */
      .then(() => caches.open(LIB).then(c => c.add(LIB_URL)).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== V && k !== LIB && k !== PUSH && k !== IMG).map(k => caches.delete(k))))
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

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.url === LIB_URL) { e.respondWith(cacheFirst(req, LIB)); return; }
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') { e.respondWith(pageFirst(req)); return; }
  if (url.pathname.includes('/img/faj/')) { e.respondWith(cacheFirst(req, IMG)); return; }
  e.respondWith(cacheFirst(req));
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
    await self.registration.showNotification(n && n.t ? String(n.t).slice(0, 80) : 'Petavira', {
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
