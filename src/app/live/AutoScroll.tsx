'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Wadah gulir-otomatis ala papan skor CPNS: konten bergulir turun perlahan,
 * berhenti sejenak di bawah, lalu balik ke atas — terus berulang. Pengguna
 * TIDAK bisa menggulir manual (overflow disembunyikan). Nilai tetap live karena
 * konten (server component) tetap diperbarui tanpa mereset posisi gulir.
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

    const id = setInterval(() => {
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
    }, 1000 / 60)

    return () => clearInterval(id)
  }, [speed, pauseMs])

  return (
    <div ref={ref} className="min-h-0 flex-1 overflow-hidden overscroll-none">
      {children}
    </div>
  )
}
