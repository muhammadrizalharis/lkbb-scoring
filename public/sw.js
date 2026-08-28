// SW "self-destruct": versi sebelumnya (cache aset) bermasalah di balik ngrok
// (interstitial ter-cache → tampilan polos). Versi ini menghapus SEMUA cache,
// membatalkan registrasi dirinya, lalu memuat ulang halaman agar aset segar.
self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys()
        await Promise.all(keys.map((k) => caches.delete(k)))
        await self.registration.unregister()
        const clients = await self.clients.matchAll({ type: 'window' })
        for (const client of clients) client.navigate(client.url)
      } catch {}
    })(),
  )
})
