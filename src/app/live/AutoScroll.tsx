'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Papan skor gulir-otomatis ala CAT/CPNS: konten bergulir turun perlahan, jeda di
 * bawah, lalu kembali ke atas — terus-menerus selama live. Berlaku SAMA di HP maupun
 * desktop; pengguna TIDAK bisa menggulir manual (overflow terkunci). Berhenti otomatis
 * saat halaman tak terlihat (layar mati / tab di latar) demi hemat baterai, lanjut lagi
 * begitu terlihat.
 */
export function AutoScroll({
  children,
  speed = 26,
  pauseMs = 2200,
}: {
  children: ReactNode
  speed?: number
  pauseMs?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let prev = performance.now()
    let hold = pauseMs // jeda awal di atas
    let atBottom = false
    let id: ReturnType<typeof setInterval> | null = null

    const step = () => {
      const now = performance.now()
      const dt = Math.min(now - prev, 100)
      prev = now
      const max = el.scrollHeight - el.clientHeight
      if (max <= 4) return

      if (hold > 0) {
        hold -= dt
        if (hold <= 0 && atBottom) {
          el.scrollTop = 0
          atBottom = false
          hold = pauseMs
        }
      } else if (el.scrollTop >= max - 1) {
        atBottom = true
        hold = pauseMs
      } else {
        el.scrollTop += (speed * dt) / 1000
      }
    }

    const start = () => {
      if (id != null) return
      prev = performance.now()
      id = setInterval(step, 1000 / 60)
    }
    const stop = () => {
      if (id != null) {
        clearInterval(id)
        id = null
      }
    }
    // Hemat baterai: hanya bergulir saat halaman benar-benar terlihat.
    const onVisibility = () => (document.hidden ? stop() : start())

    document.addEventListener('visibilitychange', onVisibility)
    if (!document.hidden) start()

    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [speed, pauseMs])

  return (
    <div ref={ref} className="min-h-0 flex-1 overflow-hidden overscroll-none">
      {children}
    </div>
  )
}


