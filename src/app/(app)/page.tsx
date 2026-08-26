import Link from 'next/link'
import { prisma } from '@/lib/db'
import { EVENT_SLUG } from '@/lib/config'
import { getStandings } from '@/lib/scoring'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const data = await getStandings(EVENT_SLUG)
  if (!data) {
    return (
      <p className="rounded-xl bg-white p-6 shadow-sm">
        Event belum tersedia. Jalankan seed terlebih dahulu.
      </p>
    )
  }

  const { event, standings } = data
  const judgeCount = await prisma.judge.count({ where: { eventId: event.id } })
  const expected = event.teams.length * judgeCount
  const finalSheets = event.sheets.filter((s) => s.status === 'FINAL').length
  const progress = expected > 0 ? Math.round((finalSheets / expected) * 100) : 0
  const top = standings.slice(0, 5)

  const stats = [
    { label: 'Tim peserta', value: event.teams.length, href: '/admin/tim' },
    { label: 'Juri', value: judgeCount, href: '/admin/juri' },
    { label: 'Lembar nilai selesai', value: `${finalSheets} / ${expected}`, href: '/input' },
    { label: 'Progres', value: `${progress}%`, href: '/input' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{event.name}</h1>
        <p className="text-sm text-slate-500">
          Rekapitulasi dihitung otomatis setiap lembar nilai disimpan.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:ring-slate-400"
          >
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{s.value}</p>
          </Link>
        ))}
      </div>

      {expected === 0 && (
        <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
          Langkah awal: tambahkan <Link href="/admin/tim" className="font-semibold underline">tim peserta</Link> dan{' '}
          <Link href="/admin/juri" className="font-semibold underline">juri</Link> terlebih dahulu.
        </div>
      )}

      <section className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold">Peringkat sementara</h2>
          <Link href="/rekap" className="text-sm text-slate-600 underline">
            Lihat rekap lengkap
          </Link>
        </div>
        {top.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500">Belum ada data.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {top.map((s) => (
              <li key={s.teamId} className="flex items-center gap-4 px-4 py-3">
                <span className="w-8 text-center text-lg font-bold tabular-nums">{s.rank}</span>
                <span className="flex-1">
                  <span className="font-medium">{s.name}</span>
                  {s.tied && (
                    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-800">
                      SERI
                    </span>
                  )}
                </span>
                <span className="text-lg font-bold tabular-nums">{s.total}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
