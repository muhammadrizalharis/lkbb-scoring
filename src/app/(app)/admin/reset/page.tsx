import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getSession, hasAtLeast } from '@/lib/auth'
import { EVENT_SLUG } from '@/lib/config'
import { ResetForm } from './ResetForm'

export const dynamic = 'force-dynamic'

export default async function ResetPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (!hasAtLeast(session.role, 'SUPER_ADMIN')) redirect('/admin')

  const event = await prisma.event.findUnique({
    where: { slug: EVENT_SLUG },
    include: {
      _count: { select: { teams: true, judges: true, sheets: true, penalties: true } },
    },
  })
  if (!event) return <p>Event tidak ditemukan.</p>

  const c = event._count

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/admin" className="text-sm text-muted-foreground underline">
        ← Kembali ke Pengaturan
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reset Data Lomba</h1>
        <p className="text-sm text-muted-foreground">
          Mengosongkan seluruh data lomba untuk memulai event baru dari nol.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Tim', value: c.teams },
          { label: 'Juri', value: c.judges },
          { label: 'Lembar nilai', value: c.sheets },
          { label: 'Penalti', value: c.penalties },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-card p-4 text-center shadow-sm ring-1 ring-border">
            <p className="text-2xl font-black tabular-nums">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-danger/30">
        <div className="mb-4 flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-danger/10 text-danger">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5"
            >
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />
            </svg>
          </span>
          <div>
            <h2 className="font-semibold text-danger">Zona berbahaya</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tindakan ini <b>menghapus permanen</b> semua tim, juri, lembar nilai, dan penalti pada
              event ini. <b>Rubrik (format penilaian) dan akun pengguna tetap aman.</b> Aksi tidak bisa
              dibatalkan.
            </p>
          </div>
        </div>
        <ResetForm />
      </div>
    </div>
  )
}
