import { EVENT_SLUG } from '@/lib/config'
import { getRekap, categoryRanking, type Medal, type RekapTeam } from '@/lib/scoring'
import { AutoRefresh } from './AutoRefresh'
import { PublicHeader } from './PublicHeader'

export const dynamic = 'force-dynamic'

const MEDAL_EMOJI: Record<Exclude<Medal, null>, string> = { gold: '🥇', silver: '🥈', bronze: '🥉' }
const RANK_MEDAL = [
  'bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950',
  'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900',
  'bg-gradient-to-br from-orange-300 to-orange-500 text-orange-950',
]

export default async function LivePage() {
  const data = await getRekap(EVENT_SLUG)

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-muted-foreground">
        Belum ada lomba yang tersedia.
      </div>
    )
  }

  const { event, teams, method } = data
  const categories = event.categories.filter((c) => c.includeInOverall)
  const isMedal = method === 'MEDAL_POINTS'
  const metric = (t: RekapTeam) => (isMedal ? t.medalPoints : t.totalScore)
  const unit = isMedal ? ' poin' : ''

  return (
    <div className="flex min-h-full flex-col">
      <AutoRefresh seconds={15} />
      <PublicHeader name={event.name} host={event.host} liveMode={event.liveMode} />

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 p-4 sm:p-6">
        {teams.length === 0 ? (
          <p className="rounded-xl bg-card p-6 text-center text-muted-foreground shadow-sm ring-1 ring-border">
            Belum ada data peserta.
          </p>
        ) : (
          <>
            {/* Podium */}
            <section className="grid gap-4 sm:grid-cols-3">
              {teams.slice(0, 3).map((t, i) => (
                <div
                  key={t.teamId}
                  className={`relative overflow-hidden rounded-2xl bg-card p-5 text-center shadow-sm ring-1 ${
                    ['ring-amber-400/50', 'ring-slate-400/50', 'ring-orange-400/50'][i]
                  } ${i === 0 ? 'sm:order-2 sm:scale-105' : i === 1 ? 'sm:order-1' : 'sm:order-3'}`}
                >
                  <div className={`mx-auto mb-2 grid size-12 place-items-center rounded-full text-lg font-black tabular-nums ${RANK_MEDAL[i]}`}>
                    {t.overallRank}
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Juara Umum {i + 1}
                  </p>
                  <p className="truncate font-bold">{t.name}</p>
                  <p className="mt-1 text-2xl font-black tabular-nums">
                    {metric(t)}
                    <span className="text-sm font-normal text-muted-foreground">{unit}</span>
                  </p>
                  {isMedal && (
                    <p className="text-sm tabular-nums">🥇 {t.gold} · 🥈 {t.silver} · 🥉 {t.bronze}</p>
                  )}
                </div>
              ))}
            </section>

            {/* Tabel peringkat */}
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
                    <th className="px-3 py-2 text-right">{isMedal ? 'Poin' : 'Total'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {teams.map((t) => (
                    <tr key={t.teamId} className="transition hover:bg-accent/40">
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold tabular-nums ${
                            t.overallRank <= 3 ? RANK_MEDAL[t.overallRank - 1] : 'text-muted-foreground'
                          }`}
                        >
                          {t.overallRank}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="mr-2 text-muted-foreground tabular-nums">{t.number}</span>
                        <span className="font-medium">{t.name}</span>
                        {t.penalty > 0 && <span className="ml-2 text-xs font-semibold text-red-600">−{t.penalty}</span>}
                      </td>
                      {categories.map((c) => {
                        const cell = t.categories.find((x) => x.categoryId === c.id)
                        return (
                          <td key={c.id} className="px-3 py-2 text-center tabular-nums">
                            {cell?.raw ?? 0}
                            {isMedal && cell?.medal && <span> {MEDAL_EMOJI[cell.medal]}</span>}
                          </td>
                        )
                      })}
                      <td className="px-3 py-2 text-right text-lg font-black tabular-nums">{metric(t)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Terbaik per kategori */}
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {event.categories.map((c) => {
                const winners = categoryRanking(teams, c.id).slice(0, 3)
                return (
                  <div key={c.id} className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-border">
                    <h3 className="font-semibold">{c.name}</h3>
                    <ol className="mt-2 space-y-1 text-sm">
                      {winners.map((w, i) => (
                        <li key={w.team.teamId} className="flex items-center justify-between gap-2">
                          <span className="flex-1 truncate">
                            <span className="mr-1.5">{isMedal ? ['🥇', '🥈', '🥉'][i] : `${i + 1}.`}</span>
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

            <p className="text-center text-xs text-muted-foreground">
              Skor diperbarui otomatis setiap 15 detik
            </p>
          </>
        )}
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-muted-foreground">
          Developed by{' '}
          <a href="https://www.instagram.com/mhmmddrizal/" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline dark:text-blue-300">
            Muhammad Rizal Haris
          </a>
        </div>
      </footer>
    </div>
  )
}
