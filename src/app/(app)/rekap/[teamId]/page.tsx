import Link from 'next/link'
import { Fragment } from 'react'
import { notFound } from 'next/navigation'
import { getSession, hasAtLeast } from '@/lib/auth'
import { EVENT_SLUG } from '@/lib/config'
import { getTeamDetail } from '@/lib/scoring'
import { PrintButton } from '../PrintButton'

export const dynamic = 'force-dynamic'

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ teamId: string }>
}) {
  const { teamId } = await params
  const session = await getSession()
  const isSuperAdmin = !!session && hasAtLeast(session.role, 'SUPER_ADMIN')
  const data = await getTeamDetail(EVENT_SLUG, teamId)
  if (!data) notFound()

  const { event, team, categories, penalty } = data
  const grandTotal = categories.reduce((sum, c) => sum + c.total, 0) - penalty

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/rekap" className="text-sm text-muted-foreground underline">
          ← Kembali ke Rekapitulasi
        </Link>
        {isSuperAdmin && <PrintButton />}
      </div>

      <div className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
        <p className="text-sm text-muted-foreground">{event.name} · Rincian Nilai per Butir</p>
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-muted-foreground tabular-nums">{team.number}.</span> {team.name}
        </h1>
        {team.school && <p className="text-sm text-muted-foreground">{team.school}</p>}
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <span>
            Total nilai:{' '}
            <b className="tabular-nums">{categories.reduce((s, c) => s + c.total, 0)}</b>
          </span>
          {penalty > 0 && (
            <span className="text-red-600">
              Penalti: <b className="tabular-nums">−{penalty}</b>
            </span>
          )}
          <span>
            Total akhir: <b className="tabular-nums">{grandTotal}</b>
          </span>
        </div>
      </div>

      {categories.map((category) => (
        <section key={category.categoryId} className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/50 px-4 py-2.5">
            <h2 className="font-semibold">{category.name}</h2>
            <span className="text-sm text-muted-foreground">
              {category.penalty > 0 ? (
                <>
                  Total: <b className="text-foreground tabular-nums">{category.total}</b>
                  <span className="text-red-600"> − {category.penalty}</span> ={' '}
                  <b className="text-foreground tabular-nums">{Math.max(0, category.total - category.penalty)}</b>
                </>
              ) : (
                <>
                  Total kategori: <b className="text-foreground tabular-nums">{category.total}</b>
                </>
              )}
            </span>
          </div>

          {category.judges.length === 0 ? (
            <p className="px-4 py-4 text-sm text-muted-foreground">Belum ada juri untuk kategori ini.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2">Butir Penilaian</th>
                    {category.judges.map((j) => (
                      <th key={j.id} className="px-3 py-2 text-right whitespace-nowrap">
                        {j.code}
                        <span className="block text-[10px] font-normal normal-case text-muted-foreground">
                          {j.name}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {category.groups.map((group) => (
                    <Fragment key={group.id}>
                      <tr className="bg-muted/30">
                        <td
                          colSpan={1 + category.judges.length}
                          className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                        >
                          {group.code ? `${group.code}. ` : ''}
                          {group.name}
                        </td>
                      </tr>
                      {group.criteria.map((c) => (
                        <tr key={c.criterionId} className="align-top">
                          <td className="px-4 py-1.5">
                            {c.name}
                            <span className="ml-1 text-xs text-muted-foreground">
                              (maks {Math.max(...c.options)})
                            </span>
                            {c.notes.map((n, i) =>
                              n ? (
                                <div key={i} className="mt-0.5 text-xs italic text-muted-foreground">
                                  {category.judges.length > 1 ? `${category.judges[i]?.code}: ` : 'Ket: '}“{n}”
                                </div>
                              ) : null,
                            )}
                          </td>
                          {c.values.map((v, i) => (
                            <td key={i} className="px-3 py-1.5 text-right font-semibold tabular-nums">
                              {v ?? <span className="text-muted-foreground">–</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/40 font-bold">
                    <td className="px-4 py-2">Jumlah per juri</td>
                    {category.judges.map((j) => (
                      <td key={j.id} className="px-3 py-2 text-right tabular-nums">
                        {j.total}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>
      ))}
    </div>
  )
}
