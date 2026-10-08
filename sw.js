/* PetLife service worker – offline indulás.
   Az oldal (index.html) hálózat-első: online mindig a friss változat jön, offline a mentett.
   Ha az ikonok vagy a manifest változik, növeld a V számát. */
const V = 'petlife-v1';
const FONTS = 'petlife-fonts';
const LIB = 'petlife-lib';
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
      .then(keys => Promise.all(keys.filter(k => k !== V && k !== FONTS && k !== LIB).map(k => caches.delete(k))))
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
