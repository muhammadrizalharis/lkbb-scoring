import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession, hasAtLeast } from '@/lib/auth'
import { logoutAction } from '../login/actions'

const NAV = [
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

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/" className="font-bold">
            Rekap LKBB
          </Link>
          <nav className="flex flex-1 flex-wrap gap-1 text-sm">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-500">
              {session.name} · {session.role.toLowerCase()}
            </span>
            <form action={logoutAction}>
              <button className="rounded-md px-3 py-1.5 text-slate-600 transition hover:bg-slate-100">
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
