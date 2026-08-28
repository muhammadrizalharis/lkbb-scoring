// Service worker Paskitactical — sengaja MINIMAL & AMAN.
// Hanya meng-cache aset statis immutable (ter-hash Next) + ikon. Halaman, RSC,
// API, dan aksi server SELALU dari jaringan agar skor live tidak pernah basi.
const STATIC_CACHE = 'paskitactical-static-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  const isStatic =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icon-') ||
    url.pathname === '/logo-mark.png'
  if (!isStatic) return

  event.respondWith(
    (async () => {
      const cache = await caches.open(STATIC_CACHE)
      const cached = await cache.match(req)
      if (cached) return cached
      const res = await fetch(req)
      if (res.ok) cache.put(req, res.clone())
      return res
    })(),
  )
})
