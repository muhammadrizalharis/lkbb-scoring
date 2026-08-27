import Link from 'next/link'
import { prisma } from '@/lib/db'
import { EVENT_SLUG } from '@/lib/config'
import { getRekap } from '@/lib/scoring'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const data = await getRekap(EVENT_SLUG)
  if (!data) {
    return (
      <p className="rounded-xl bg-card p-6 shadow-sm">
        Event belum tersedia. Jalankan seed terlebih dahulu.
      </p>
    )
  }

  const { event, teams, method } = data
  const judgeCount = await prisma.judge.count({ where: { eventId: event.id } })
  const expected = event.teams.length * judgeCount
  const finalSheets = event.sheets.filter((s) => s.status === 'FINAL').length
  const progress = expected > 0 ? Math.round((finalSheets / expected) * 100) : 0
  const top = teams.slice(0, 5)
  const metricLabel = method === 'MEDAL_POINTS' ? 'poin' : ''

  const stats = [
    { label: 'Tim peserta', value: event.teams.length, href: '/admin/tim', tone: 'from-blue-500/15 text-blue-600 dark:text-blue-300', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
    { label: 'Juri', value: judgeCount, href: '/admin/juri', tone: 'from-indigo-500/15 text-indigo-600 dark:text-indigo-300', icon: 'M20 6L9 17l-5-5' },
    { label: 'Lembar nilai selesai', value: `${finalSheets} / ${expected}`, href: '/input', tone: 'from-emerald-500/15 text-emerald-600 dark:text-emerald-300', icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' },
    { label: 'Progres', value: `${progress}%`, href: '/input', tone: 'from-amber-500/15 text-amber-600 dark:text-amber-300', icon: 'M22 12A10 10 0 1 1 12 2v10z' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{event.name}</h1>
        <p className="text-sm text-muted-foreground">
          Rekapitulasi dihitung otomatis setiap lembar nilai disimpan.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group relative overflow-hidden rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border transition hover:-translate-y-0.5 hover:shadow-lg hover:ring-primary/40"
          >
            <div className={`pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-gradient-to-br ${s.tone} to-transparent blur-xl`} />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-3xl font-black tabular-nums">{s.value}</p>
              </div>
              <span className={`grid size-10 place-items-center rounded-xl bg-gradient-to-br ${s.tone} to-transparent`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
                  <path d={s.icon} />
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </div>

      {expected === 0 && (
        <div className="rounded-xl bg-warning/10 p-4 text-sm text-amber-700 dark:text-amber-200 ring-1 ring-warning/30">
          Langkah awal: tambahkan <Link href="/admin/tim" className="font-semibold underline">tim peserta</Link> dan{' '}
          <Link href="/admin/juri" className="font-semibold underline">juri</Link> terlebih dahulu.
        </div>
      )}

      <section className="rounded-xl bg-card shadow-sm ring-1 ring-border">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-semibold">Peringkat sementara</h2>
          <Link href="/rekap" className="text-sm text-muted-foreground underline">
            Lihat rekap lengkap
          </Link>
        </div>
        {top.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">Belum ada data.</p>
        ) : (
          <ul className="divide-y divide-border">
            {top.map((s) => (
              <li key={s.teamId} className="flex items-center gap-4 px-4 py-3 transition hover:bg-accent/40">
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-lg text-sm font-black tabular-nums ${
                    s.overallRank === 1
                      ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950'
                      : s.overallRank === 2
                        ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900'
                        : s.overallRank === 3
                          ? 'bg-gradient-to-br from-orange-300 to-orange-500 text-orange-950'
                          : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {s.overallRank}
                </span>
                <span className="flex-1">
                  <span className="font-medium">{s.name}</span>
                  {method === 'MEDAL_POINTS' && (s.gold > 0 || s.silver > 0 || s.bronze > 0) && (
                    <span className="ml-2 text-xs text-muted-foreground tabular-nums">
                      🥇{s.gold} 🥈{s.silver} 🥉{s.bronze}
                    </span>
                  )}
                  {s.overallTied && (
                    <span className="ml-2 rounded bg-amber-500/15 px-1.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                      SERI
                    </span>
                  )}
                </span>
                <span className="text-lg font-black tabular-nums">
                  {method === 'MEDAL_POINTS' ? s.medalPoints : s.totalScore}
                  {metricLabel && <span className="ml-1 text-xs font-normal text-muted-foreground">{metricLabel}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
