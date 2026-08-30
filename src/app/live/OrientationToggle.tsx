'use client'

import { useState } from 'react'

const KEY = 'lkbb_live_orient'

/**
 * Pilihan tampilan papan /live di HP: "landscape" (papan diputar otomatis, default)
 * atau "potret" (tegak apa adanya). Preferensi disimpan di localStorage dan
 * dikendalikan lewat atribut data-live-orient pada <html> (dibaca oleh CSS rotate).
 * Hanya tampil di layar kecil (HP) — di tablet/desktop rotasi memang tak berlaku.
 */
export function OrientationToggle() {
  const [mode, setMode] = useState<'landscape' | 'portrait' | null>(null)

  // Baca preferensi tersimpan sekali di render pertama sisi klien (pola "adjust state
  // during render", bukan useEffect — agar lolos aturan set-state-in-effect).
  if (mode === null && typeof window !== 'undefined') {
    setMode(localStorage.getItem(KEY) === 'portrait' ? 'portrait' : 'landscape')
  }

  const current = mode ?? 'landscape'
  const target = current === 'landscape' ? 'portrait' : 'landscape'

  function apply() {
    setMode(target)
    try {
      localStorage.setItem(KEY, target)
    } catch {}
    if (target === 'portrait') document.documentElement.setAttribute('data-live-orient', 'portrait')
    else document.documentElement.removeAttribute('data-live-orient')
  }

  return (
    <button
      type="button"
      onClick={apply}
      aria-label={`Ganti tampilan ke mode ${target === 'portrait' ? 'potret' : 'landscape'}`}
      className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-accent max-md:inline-flex"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 shrink-0">
        <path d="M23 4v6h-6" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
      </svg>
      {target === 'portrait' ? 'Potret' : 'Landscape'}
    </button>
  )
}

