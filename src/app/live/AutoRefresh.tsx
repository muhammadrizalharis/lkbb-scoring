'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Polling ringan: cek "versi" data tiap `intervalMs`; lakukan refresh penuh
 * HANYA saat versi berubah. Jauh lebih hemat dari router.refresh() berkala,
 * sehingga interval bisa sub-detik tanpa membebani server.
 */
export function AutoRefresh({ intervalMs = 800, url = '/api/live/version' }: { intervalMs?: number; url?: string }) {
  const router = useRouter()
  const last = useRef<string | null>(null)

  useEffect(() => {
    let stopped = false

    async function check() {
      if (document.visibilityState === 'hidden') return
      try {
        const res = await fetch(url, { cache: 'no-store' })
        if (!res.ok || stopped) return
        const { v } = (await res.json()) as { v: string }
        if (stopped) return
        if (last.current === null) last.current = v
        else if (v !== last.current) {
          last.current = v
          router.refresh()
        }
      } catch {}
    }

    const id = setInterval(check, intervalMs)
    const onVisible = () => {
      if (document.visibilityState === 'visible') check()
    }
    document.addEventListener('visibilitychange', onVisible)
    check()

    return () => {
      stopped = true
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [intervalMs, url, router])

  return null
}
