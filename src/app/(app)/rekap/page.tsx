import Link from 'next/link'
import { getSession, hasAtLeast } from '@/lib/auth'
import { EVENT_SLUG } from '@/lib/config'
import { getRekap, categoryRanking, type Medal, type RekapTeam } from '@/lib/scoring'
import { PrintButton } from './PrintButton'

export const dynamic = 'force-dynamic'

const MEDAL_BADGE: Record<Exclude<Medal, null>, string> = {
  gold: 'bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950',
  silver: 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900',
  bronze: 'bg-gradient-to-br from-orange-300 to-orange-500 text-orange-950',
}
const MEDAL_EMOJI: Record<Exclude<Medal, null>, string> = { gold: '🥇', silver: '🥈', bronze: '🥉' }
const RANK_MEDALS = ['gold', 'silver', 'bronze'] as const

const PODIUM = [
  { label: 'Juara Umum 1', ring: 'ring-amber-400/50', glow: 'from-amber-400/20' },
  { label: 'Juara Umum 2', ring: 'ring-slate-400/50', glow: 'from-slate-400/20' },
  { label: 'Juara Umum 3', ring: 'ring-orange-400/50', glow: 'from-orange-400/20' },
]

export default async function RekapPage() {
  const session = await getSession()
  const isSuperAdmin = !!session && hasAtLeast(session.role, 'SUPER_ADMIN')
  const data = await getRekap(EVENT_SLUG)
  if (!data) return <p>Event tidak ditemukan.</p>

  const { event, teams, method } = data
  const categories = event.categories.filter((c) => c.includeInOverall)
  const isMedal = method === 'MEDAL_POINTS'

  if (teams.length === 0) {
    return <p className="rounded-xl bg-card p-6 shadow-sm">Belum ada tim peserta.</p>
  }

  const anyTie = teams.some((t) => t.overallTied)
  const incomplete = teams.filter((t) => !t.complete).length
  const metric = (t: RekapTeam) => (isMedal ? t.medalPoints : t.totalScore)
  const metricUnit = isMedal ? 'poin' : ''

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rekapitulasi &amp; Juara Umum</h1>
          <p className="text-sm text-muted-foreground">
            {isMedal
              ? `Tiap kategori memberi medali (emas ${event.goldPoints} poin · perak ${event.silverPoints} · perunggu ${event.bronzePoints}). Juara Umum = poin terbanyak.`
              : 'Juara Umum = akumulasi nilai semua kategori (× bobot) dikurangi penalti.'}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Klik nama tim untuk melihat rincian nilai per butir.
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <a
            href="/live"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-input bg-card px-4 py-2 text-sm font-semibold transition hover:bg-accent"
          >
            Tampilan Publik ↗
          </a>
          {isSuperAdmin && <PrintButton />}
          {isSuperAdmin && (
            <a
              href="/api/rekap/csv"
              className="rounded-lg border border-input bg-card px-4 py-2 text-sm font-semibold transition hover:bg-accent"
            >
              Unduh CSV
            </a>
          )}
        </div>
      </div>

      {incomplete > 0 && (
        <p className="rounded-xl bg-warning/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-200 ring-1 ring-warning/30">
          {incomplete} tim belum lengkap lembar nilainya. Peringkat masih bersifat sementara.
        </p>
      )}
      {anyTie && (
        <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-red-700 dark:text-red-300 ring-1 ring-danger/30">
          Ada tim yang identik di semua kriteria (ditandai <b>SERI</b>). Pemenang ditentukan keputusan juri.
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        {teams.slice(0, 3).map((t, i) => (
          <div
            key={t.teamId}
            className={`relative overflow-hidden rounded-2xl bg-card p-5 shadow-sm ring-1 ${PODIUM[i].ring}`}
          >
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${PODIUM[i].glow} to-transparent`} />
            <div className="relative">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {PODIUM[i].label}
              </p>
              <p className="mt-0.5 truncate text-lg font-bold">{t.name}</p>
              <p className="mt-1 text-3xl font-black tabular-nums">
                {metric(t)}
                {metricUnit && <span className="ml-1 text-sm font-normal text-muted-foreground">{metricUnit}</span>}
              </p>
              {isMedal && (
                <p className="mt-1 text-sm tabular-nums">
                  🥇 {t.gold} · 🥈 {t.silver} · 🥉 {t.bronze}
                </p>
              )}
            </div>
          </div>
        ))}
      </section>

      <div className="overflow-x-auto rounded-xl bg-card shadow-sm ring-1 ring-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted/70 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Tim</th>
              {categories.map((c) => (
                <th key={c.id} className="px-3 py-2 text-center whitespace-nowrap">
                  {c.code}
                </th>
              ))}
              {isMedal && <th className="px-3 py-2 text-center whitespace-nowrap">🥇🥈🥉</th>}
              <th className="px-3 py-2 text-right">{isMedal ? 'Poin' : 'Total'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {teams.map((t) => (
              <tr key={t.teamId} className={`transition hover:bg-accent/40 ${t.overallTied ? 'bg-danger/10' : ''}`}>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold tabular-nums ${
                      t.overallRank <= 3 ? MEDAL_BADGE[RANK_MEDALS[t.overallRank - 1]] : 'text-muted-foreground'
                    }`}
                  >
                    {t.overallRank}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className="mr-2 text-muted-foreground tabular-nums">{t.number}</span>
                  <Link href={`/rekap/${t.teamId}`} className="font-medium text-primary underline-offset-2 hover:underline dark:text-blue-300">
                    {t.name}
                  </Link>
                  {t.penalty > 0 && (
                    <span className="ml-2 text-xs font-semibold text-red-600" title="Total pengurangan nilai">
                      −{t.penalty}
                    </span>
                  )}
                  {t.overallTied && (
                    <span className="ml-2 rounded bg-danger/20 px-1.5 py-0.5 text-xs font-bold text-red-700 dark:text-red-300">
                      SERI
                    </span>
                  )}
                  {!t.complete && <span className="ml-2 text-xs text-amber-600">belum lengkap</span>}
                </td>
                {categories.map((c) => {
                  const cell = t.categories.find((x) => x.categoryId === c.id)
                  return (
                    <td key={c.id} className="px-3 py-2 text-center tabular-nums">
                      <div className="flex flex-col items-center leading-tight">
                        <span>{cell?.raw ?? 0}</span>
                        {isMedal && cell?.medal && <span title={cell.medal}>{MEDAL_EMOJI[cell.medal]}</span>}
                      </div>
                    </td>
                  )
                })}
                {isMedal && (
                  <td className="px-3 py-2 text-center tabular-nums whitespace-nowrap">
                    {t.gold}/{t.silver}/{t.bronze}
                  </td>
                )}
                <td className="px-3 py-2 text-right text-lg font-black tabular-nums">{metric(t)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {event.categories.map((c) => {
          const winners = categoryRanking(teams, c.id)
          return (
            <div key={c.id} className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-border">
              <h3 className="font-semibold">
                {c.name}
                {!c.includeInOverall && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">(di luar Juara Umum)</span>
                )}
              </h3>
              <ol className="mt-2 space-y-1 text-sm">
                {winners.map((w, i) => (
                  <li key={w.team.teamId} className="flex items-center justify-between gap-2">
                    <span className="flex-1 truncate">
                      <span className="mr-1.5">{isMedal && w.cat.medal ? MEDAL_EMOJI[w.cat.medal] : `${i + 1}.`}</span>
                      {w.team.name}
                    </span>
                    <span className="font-semibold tabular-nums">{w.cat.raw}</span>
                  </li>
                ))}
              </ol>
            </div>
          )
        })}
      </section>
    </div>
  )
}
