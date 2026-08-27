import { EVENT_SLUG } from '@/lib/config'
import { getStandings, categoryWinners } from '@/lib/scoring'

export const dynamic = 'force-dynamic'

const MEDALS = [
  'bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 ring-2 ring-amber-300/60 shadow',
  'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900 ring-2 ring-slate-300/60 shadow',
  'bg-gradient-to-br from-orange-300 to-orange-500 text-orange-950 ring-2 ring-orange-300/60 shadow',
]

const PODIUM = [
  { label: 'Juara 1', ring: 'ring-amber-400/50', glow: 'from-amber-400/20' },
  { label: 'Juara 2', ring: 'ring-slate-400/50', glow: 'from-slate-400/20' },
  { label: 'Juara 3', ring: 'ring-orange-400/50', glow: 'from-orange-400/20' },
]

export default async function RekapPage() {
  const data = await getStandings(EVENT_SLUG)
  if (!data) return <p>Event tidak ditemukan.</p>

  const { event, standings } = data
  const categories = event.categories

  if (standings.length === 0) {
    return <p className="rounded-xl bg-card p-6 shadow-sm">Belum ada tim peserta.</p>
  }

  const anyTie = standings.some((s) => s.tied)
  const incomplete = standings.filter((s) => !s.complete).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Rekapitulasi &amp; Peringkat</h1>
          <p className="text-sm text-muted-foreground">
            Nilai antar juri dijumlahkan. Total = jumlah kategori berbobot dikurangi penalti.
          </p>
        </div>
        <a
          href="/api/rekap/csv"
          className="rounded-lg border border-input bg-card px-4 py-2 text-sm font-semibold transition hover:bg-accent"
        >
          Unduh CSV
        </a>
      </div>

      {incomplete > 0 && (
        <p className="rounded-xl bg-warning/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-200 ring-1 ring-warning/30">
          {incomplete} tim belum lengkap lembar nilainya. Peringkat masih bersifat sementara.
        </p>
      )}
      {anyTie && (
        <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-red-700 dark:text-red-300 ring-1 ring-danger/30">
          Ada tim dengan total identik (ditandai <b>SERI</b>). Sesuai aturan, pemenang ditentukan oleh
          keputusan juri.
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        {standings.slice(0, 3).map((s, i) => (
          <div
            key={s.teamId}
            className={`relative overflow-hidden rounded-2xl bg-card p-5 shadow-sm ring-1 ${PODIUM[i].ring}`}
          >
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${PODIUM[i].glow} to-transparent`} />
            <div className="relative flex items-center gap-4">
              <span
                className={`grid size-12 shrink-0 place-items-center rounded-xl text-lg font-black tabular-nums ${MEDALS[i]}`}
              >
                {s.rank}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {PODIUM[i].label}
                </p>
                <p className="truncate font-bold">{s.name}</p>
                <p className="text-2xl font-black tabular-nums">{s.total}</p>
              </div>
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
                <th key={c.id} className="px-3 py-2 text-right whitespace-nowrap">
                  {c.code}
                  {c.weight !== 1 && <span className="text-xs text-muted-foreground"> ×{c.weight}</span>}
                  {!c.includeInOverall && <span className="text-xs text-muted-foreground"> (luar)</span>}
                </th>
              ))}
              <th className="px-3 py-2 text-right">Penalti</th>
              <th className="px-3 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {standings.map((s) => (
              <tr
                key={s.teamId}
                className={`transition hover:bg-accent/40 ${s.tied ? 'bg-danger/10' : ''}`}
              >
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full font-bold tabular-nums ${
                      MEDALS[s.rank - 1] ?? 'text-muted-foreground'
                    }`}
                  >
                    {s.rank}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className="mr-2 text-muted-foreground tabular-nums">{s.number}</span>
                  <span className="font-medium">{s.name}</span>
                  {s.tied && (
                    <span className="ml-2 rounded bg-danger/20 px-1.5 py-0.5 text-xs font-bold text-red-700 dark:text-red-300">
                      SERI
                    </span>
                  )}
                  {!s.complete && <span className="ml-2 text-xs text-amber-600">belum lengkap</span>}
                </td>
                {categories.map((c) => {
                  const cell = s.categories.find((x) => x.categoryId === c.id)
                  return (
                    <td key={c.id} className="px-3 py-2 text-right tabular-nums">
                      {cell?.raw ?? 0}
                      <span className="ml-1 text-xs text-muted-foreground">
                        {cell?.sheetsFinal ?? 0}/{cell?.sheetsExpected ?? 0}
                      </span>
                    </td>
                  )
                })}
                <td className="px-3 py-2 text-right tabular-nums text-red-600">
                  {s.penalty > 0 ? `−${s.penalty}` : '–'}
                </td>
                <td className="px-3 py-2 text-right text-lg font-black tabular-nums">{s.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((c) => {
          const winners = categoryWinners(standings, c.code).slice(0, 3)
          return (
            <div key={c.id} className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-border">
              <h3 className="font-semibold">Terbaik · {c.name}</h3>
              <ol className="mt-2 space-y-1 text-sm">
                {winners.map((w, i) => (
                  <li key={w.team.teamId} className="flex justify-between gap-2">
                    <span className="truncate">
                      <span className="mr-1.5 text-muted-foreground">{i + 1}.</span>
                      {w.team.name}
                    </span>
                    <span className="font-semibold tabular-nums">{w.value}</span>
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
