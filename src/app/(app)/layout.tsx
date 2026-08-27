import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession, hasAtLeast } from '@/lib/auth'
import { logoutAction } from '../login/actions'
import { NavLinks, type NavItem } from './NavLinks'
import { ThemeToggle } from './ThemeToggle'

const NAV: NavItem[] = [
  { href: '/', label: 'Beranda' },
  { href: '/input', label: 'Input Nilai' },
  { href: '/rekap', label: 'Rekapitulasi' },
  { href: '/admin', label: 'Pengaturan' },
]

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  const nav = hasAtLeast(session.role, 'SUPER_ADMIN')
    ? [...NAV, { href: '/admin/rubrik', label: 'Rubrik' }]
    : NAV

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
              <span className="text-sm font-bold tracking-tight">Rekap Nilai LKBB</span>
              <span className="text-[11px] font-medium text-muted-foreground">Sistem Penjurian</span>
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
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">{children}</main>
    </div>
  )
}
