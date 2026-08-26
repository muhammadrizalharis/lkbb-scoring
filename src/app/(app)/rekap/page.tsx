import { EVENT_SLUG } from '@/lib/config'
import { getStandings, categoryWinners } from '@/lib/scoring'

export const dynamic = 'force-dynamic'

const MEDALS = ['bg-amber-300 text-amber-950', 'bg-slate-300 text-slate-900', 'bg-orange-300 text-orange-950']

export default async function RekapPage() {
  const data = await getStandings(EVENT_SLUG)
  if (!data) return <p>Event tidak ditemukan.</p>

  const { event, standings } = data
  const categories = event.categories

  if (standings.length === 0) {
    return <p className="rounded-xl bg-white p-6 shadow-sm">Belum ada tim peserta.</p>
  }

  const anyTie = standings.some((s) => s.tied)
  const incomplete = standings.filter((s) => !s.complete).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Rekapitulasi &amp; Peringkat</h1>
          <p className="text-sm text-slate-500">
            Nilai antar juri dijumlahkan. Total = jumlah kategori berbobot dikurangi penalti.
          </p>
        </div>
        <a
          href="/api/rekap/csv"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold transition hover:bg-slate-100"
        >
          Unduh CSV
        </a>
      </div>

      {incomplete > 0 && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          {incomplete} tim belum lengkap lembar nilainya. Peringkat masih bersifat sementara.
        </p>
      )}
      {anyTie && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-900 ring-1 ring-red-200">
          Ada tim dengan total identik (ditandai <b>SERI</b>). Sesuai aturan, pemenang ditentukan oleh
          keputusan juri.
        </p>
      )}

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 text-left">
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Tim</th>
              {categories.map((c) => (
                <th key={c.id} className="px-3 py-2 text-right whitespace-nowrap">
                  {c.code}
                  {c.weight !== 1 && <span className="text-xs text-slate-400"> ×{c.weight}</span>}
                  {!c.includeInOverall && <span className="text-xs text-slate-400"> (luar)</span>}
                </th>
              ))}
              <th className="px-3 py-2 text-right">Penalti</th>
              <th className="px-3 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {standings.map((s) => (
              <tr key={s.teamId} className={s.tied ? 'bg-red-50/60' : undefined}>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full font-bold tabular-nums ${
                      MEDALS[s.rank - 1] ?? 'text-slate-500'
                    }`}
                  >
                    {s.rank}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className="mr-2 text-slate-400 tabular-nums">{s.number}</span>
                  <span className="font-medium">{s.name}</span>
                  {s.tied && (
                    <span className="ml-2 rounded bg-red-200 px-1.5 py-0.5 text-xs font-bold text-red-900">
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
                      <span className="ml-1 text-xs text-slate-400">
                        {cell?.sheetsFinal ?? 0}/{cell?.sheetsExpected ?? 0}
                      </span>
                    </td>
                  )
                })}
                <td className="px-3 py-2 text-right tabular-nums text-red-600">
                  {s.penalty > 0 ? `−${s.penalty}` : '–'}
                </td>
                <td className="px-3 py-2 text-right text-base font-bold tabular-nums">{s.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((c) => {
          const winners = categoryWinners(standings, c.code).slice(0, 3)
          return (
            <div key={c.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <h3 className="font-semibold">Terbaik · {c.name}</h3>
              <ol className="mt-2 space-y-1 text-sm">
                {winners.map((w, i) => (
                  <li key={w.team.teamId} className="flex justify-between gap-2">
                    <span className="truncate">
                      <span className="mr-1.5 text-slate-400">{i + 1}.</span>
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
