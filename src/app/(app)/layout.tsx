import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { EVENT_SLUG } from '@/lib/config'
import { getSession, hasAtLeast } from '@/lib/auth'
import { logoutAction } from '../login/actions'
import { NavLinks, type NavItem } from './NavLinks'
import { ThemeToggle } from './ThemeToggle'

const NAV: NavItem[] = [
  { href: '/', label: 'Beranda' },
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
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-blue-500 text-primary-foreground shadow-lg shadow-primary/25">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5"
              >
                <path d="M8 21h8M12 17v4M6 4h12l-1 8a5 5 0 0 1-10 0L6 4z" />
                <path d="M6 8H4a2 2 0 0 0 0 4h1.5M18 8h2a2 2 0 0 1 0 4h-1.5" />
              </svg>
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-bold tracking-tight">Paskitactical</span>
              <span className="text-[11px] font-medium text-muted-foreground">Penilaian &amp; Rekap Lomba</span>
            </span>
          </Link>

          {event && (
            <Link
              href="/rekap"
              title={event.host ?? undefined}
              className={`hidden items-center gap-2 rounded-full px-3 py-1.5 text-sm transition md:inline-flex ${
                event.liveMode
                  ? 'bg-red-500/10 text-red-600 ring-1 ring-red-500/30 hover:bg-red-500/15 dark:text-red-400'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {event.liveMode && (
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-red-600" />
                </span>
              )}
              {event.liveMode && <span className="font-bold tracking-wide">LIVE</span>}
              <span className="max-w-[14rem] truncate font-semibold">{event.name}</span>
            </Link>
          )}

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
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">{children}</main>
    </div>
  )
}
