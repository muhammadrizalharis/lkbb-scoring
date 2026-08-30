'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Polling ringan: cek "versi" data tiap ~`intervalMs`; refresh penuh HANYA saat
 * versi berubah. Untuk RATUSAN penonton serentak, dua hal penting:
 *  - JITTER interval polling → poll tidak sinkron (tak ada lonjakan bersamaan).
 *  - STAGGER refresh: saat versi berubah, tunda router.refresh() dengan delay
 *    acak (0..spreadMs) → ratusan refresh tersebar, bukan menerjang server sekaligus.
 */
export function AutoRefresh({
  intervalMs = 1200,
  spreadMs = 1500,
  url = '/api/live/version',
}: {
  intervalMs?: number
  spreadMs?: number
  url?: string
}) {
  const router = useRouter()
  const last = useRef<string | null>(null)

  useEffect(() => {
    let stopped = false
    let timer: ReturnType<typeof setTimeout>
    let refreshTimer: ReturnType<typeof setTimeout>
    // ±30% jitter agar polling antar-klien tidak sefase.
    const jitter = () => intervalMs * (0.7 + Math.random() * 0.6)

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
          // Sebar refresh acak dalam jendela spreadMs → hindari thundering herd.
          clearTimeout(refreshTimer)
          refreshTimer = setTimeout(() => !stopped && router.refresh(), Math.random() * spreadMs)
        }
      } catch {}
    }

    function loop() {
      timer = setTimeout(async () => {
        await check()
        if (!stopped) loop()
      }, jitter())
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') check()
    }
    document.addEventListener('visibilitychange', onVisible)
    check()
    loop()

    return () => {
      stopped = true
      clearTimeout(timer)
      clearTimeout(refreshTimer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [intervalMs, spreadMs, url, router])

  return null
}

