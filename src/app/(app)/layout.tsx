import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { EVENT_SLUG } from '@/lib/config'
import { getSession, hasAtLeast } from '@/lib/auth'
import { logoutAction } from '../login/actions'
import { NavLinks, type NavItem } from './NavLinks'
import { ThemeToggle } from '@/components/ThemeToggle'

const NAV: NavItem[] = [
  { href: '/beranda', label: 'Beranda' },
  { href: '/input', label: 'Input Nilai' },
  { href: '/rekap', label: 'Rekapitulasi' },
]

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  const event = await prisma.event.findUnique({
    where: { slug: EVENT_SLUG },
    select: { name: true, host: true, liveMode: true },
  })

  const nav: NavItem[] = [...NAV]
  if (hasAtLeast(session.role, 'OPERATOR')) nav.push({ href: '/penalti', label: 'Pengurangan' })
  nav.push({ href: '/admin', label: 'Pengaturan' })
  if (hasAtLeast(session.role, 'SUPER_ADMIN')) nav.push({ href: '/admin/rubrik', label: 'Rubrik' })

  const roleLabel: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Admin',
    OPERATOR: 'Operator',
    VIEWER: 'Viewer',
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-card/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
          <Link href="/beranda" className="flex items-center gap-2.5">
            <Image
              src="/logo-mark.png"
              alt="Paskitactical"
              width={596}
              height={414}
              priority
              className="h-9 w-auto drop-shadow-sm"
            />
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-bold tracking-tight">Paskitactical</span>
              <span className="text-[11px] font-medium text-muted-foreground">Penilaian &amp; Rekap Lomba</span>
            </span>
          </Link>

          <NavLinks items={nav} />

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight">{session.name}</p>
              <p className="text-[11px] font-medium text-primary dark:text-blue-300">
                {roleLabel[session.role] ?? session.role}
              </p>
            </div>
            <ThemeToggle />
            <form action={logoutAction}>
              <button className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:border-danger/40 hover:text-danger">
                Keluar
              </button>
            </form>
          </div>
        </div>
        {event && (
          <div
            className={`border-t ${
              event.liveMode ? 'border-red-500/20 bg-red-500/5' : 'border-border/60 bg-muted/30'
            }`}
          >
            <Link
              href="/rekap"
              title={event.host ?? undefined}
              className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-1.5 text-xs transition hover:opacity-80"
            >
              {event.liveMode && (
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-red-600" />
                </span>
              )}
              {event.liveMode && (
                <span className="font-bold tracking-wide text-red-600 dark:text-red-400">LIVE</span>
              )}
              <span className="font-semibold">{event.name}</span>
              {event.host && <span className="text-muted-foreground">· {event.host}</span>}
            </Link>
          </div>
        )}
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">{children}</main>
      <footer className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-4 text-center text-xs text-muted-foreground">
          Developed by{' '}
          <a
            href="https://www.instagram.com/mhmmddrizal/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline dark:text-blue-300"
          >
            Muhammad Rizal Haris
          </a>
        </div>
      </footer>
    </div>
  )
}
