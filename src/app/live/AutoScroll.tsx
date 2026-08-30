'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Wadah papan skor, dioptimalkan untuk penonton HP/tablet:
 * - Layar besar (pointer halus: proyektor/desktop) → gulir-otomatis ala papan CPNS,
 *   terkunci (pengguna tak menggulir manual).
 * - HP/tablet (pointer kasar) → pengguna BISA menggulir manual untuk mencari &
 *   mencatat timnya; gulir-otomatis berhenti saat disentuh, lanjut lagi setelah diam.
 * Loop pakai requestAnimationFrame → otomatis berhenti saat layar mati / tab di latar
 * (hemat baterai HP), bukan setInterval yang jalan terus.
 */
export function AutoScroll({
  children,
  speed = 26,
  pauseMs = 2200,
  resumeAfterMs = 4000,
}: {
  children: ReactNode
  speed?: number
  pauseMs?: number
  resumeAfterMs?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const touch = window.matchMedia('(pointer: coarse)').matches
    // HP/tablet boleh gulir manual; layar besar tetap terkunci (papan pasif).
    el.style.overflowY = touch ? 'auto' : 'hidden'

    let raf = 0
    let prev = performance.now()
    let hold = pauseMs // jeda awal di atas
    let atBottom = false
    let userUntil = 0 // saat pengguna menyentuh (HP), auto-scroll ditunda sampai ini

    const nudge = () => {
      userUntil = performance.now() + resumeAfterMs
    }
    if (touch) {
      el.addEventListener('touchstart', nudge, { passive: true })
      el.addEventListener('touchmove', nudge, { passive: true })
      el.addEventListener('wheel', nudge, { passive: true })
    }

    const tick = (now: number) => {
      const dt = Math.min(now - prev, 100)
      prev = now
      const max = el.scrollHeight - el.clientHeight

      // Diam saja bila konten muat penuh, atau pengguna baru saja menyentuh.
      if (max > 4 && now >= userUntil) {
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
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('touchstart', nudge)
      el.removeEventListener('touchmove', nudge)
      el.removeEventListener('wheel', nudge)
    }
  }, [speed, pauseMs, resumeAfterMs])

  return (
    <div ref={ref} className="min-h-0 flex-1 overflow-hidden overscroll-none">
      {children}
    </div>
  )
}

