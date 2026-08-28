'use client'

import { useEffect } from 'react'

/** Mendaftarkan service worker (hanya cache aset statis; data live tetap dari jaringan). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
    const register = () => navigator.serviceWorker.register('/sw.js').catch(() => {})
    // Efek jalan setelah hidrasi (umumnya sudah 'complete'); daftar langsung, jika belum tunggu load.
    if (document.readyState === 'complete') register()
    else window.addEventListener('load', register, { once: true })
  }, [])
  return null
}
