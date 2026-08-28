'use client'

import { useEffect } from 'react'

/**
 * Membersihkan service worker lama (yang sempat meng-cache aset & bermasalah di
 * balik ngrok). Membatalkan semua registrasi + menghapus cache dari sisi halaman.
 * Tidak mendaftarkan SW baru.
 */
export function ServiceWorkerCleanup() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => Promise.all(regs.map((r) => r.unregister())))
      .then(async () => {
        if (typeof caches !== 'undefined') {
          const keys = await caches.keys()
          await Promise.all(keys.map((k) => caches.delete(k)))
        }
      })
      .catch(() => {})
  }, [])
  return null
}
