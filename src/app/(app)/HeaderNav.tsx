'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/ThemeToggle'
import { logoutAction } from '../login/actions'

export type NavItem = { href: string; label: string }

export function HeaderNav({
  nav,
  userName,
  roleLabel,
}: {
  nav: NavItem[]
  userName: string
  roleLabel: string
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Tutup panel otomatis saat pindah halaman (tanpa efek: cukup bandingkan saat render).
  const [seenPath, setSeenPath] = useState(pathname)
  if (pathname !== seenPath) {
    setSeenPath(pathname)
    if (open) setOpen(false)
  }

  const linkClass = (href: string) => {
    const active = href === '/beranda' ? pathname === '/beranda' : pathname.startsWith(href)
    return active
      ? 'bg-primary/10 text-primary dark:bg-primary/25 dark:text-primary-foreground'
      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
  }

  return (
    <>
      {/* Navigasi desktop */}
      <nav className="hidden flex-1 flex-wrap gap-1 text-sm md:flex">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-lg px-3 py-1.5 font-medium transition ${linkClass(item.href)}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="hidden items-center gap-3 md:flex">
        <div className="text-right">
          <p className="text-sm font-semibold leading-tight">{userName}</p>
          <p className="text-[11px] font-medium text-primary dark:text-blue-300">{roleLabel}</p>
        </div>
        <ThemeToggle />
        <form action={logoutAction}>
          <button className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:border-danger/40 hover:text-danger">
            Keluar
          </button>
        </form>
      </div>

      {/* Kontrol mobile */}
      <div className="ml-auto flex items-center gap-2 md:hidden">
        <ThemeToggle />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Buka menu"
          aria-expanded={open}
          className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:text-foreground"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
          </svg>
        </button>
      </div>

      {/* Panel menu mobile */}
      {open && (
        <div className="w-full md:hidden">
          <div className="mb-2 rounded-lg bg-muted/50 px-3 py-2">
            <p className="text-sm font-semibold leading-tight">{userName}</p>
            <p className="text-[11px] font-medium text-primary dark:text-blue-300">{roleLabel}</p>
          </div>
          <nav className="flex flex-col gap-1 text-sm">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2.5 font-medium transition ${linkClass(item.href)}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <form action={logoutAction} className="mt-2">
            <button className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:border-danger/40 hover:text-danger">
              Keluar
            </button>
          </form>
        </div>
      )}
    </>
  )
}
