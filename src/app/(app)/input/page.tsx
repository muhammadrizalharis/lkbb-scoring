import Link from 'next/link'
import { prisma } from '@/lib/db'
import { EVENT_SLUG } from '@/lib/config'

export const dynamic = 'force-dynamic'

export default async function InputIndexPage() {
  const event = await prisma.event.findUnique({
    where: { slug: EVENT_SLUG },
    include: {
      teams: { orderBy: { number: 'asc' } },
      judges: { orderBy: { code: 'asc' }, include: { category: true } },
      sheets: { select: { teamId: true, judgeId: true, status: true, total: true } },
    },
  })

  if (!event) return <p>Event tidak ditemukan.</p>

  if (event.teams.length === 0 || event.judges.length === 0) {
    return (
      <div className="rounded-xl bg-warning/10 p-6 text-sm text-amber-700 dark:text-amber-200 ring-1 ring-warning/30">
        Tambahkan <Link href="/admin/tim" className="font-semibold underline">tim</Link> dan{' '}
        <Link href="/admin/juri" className="font-semibold underline">juri</Link> dulu sebelum memasukkan nilai.
      </div>
    )
  }

  const sheetMap = new Map(event.sheets.map((s) => [`${s.teamId}:${s.judgeId}`, s]))

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Input Nilai</h1>
        <p className="text-sm text-muted-foreground">
          Pilih kotak untuk memasukkan lembar nilai. Hijau = selesai, kuning = tersimpan sebagian.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl bg-card shadow-sm ring-1 ring-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="sticky left-0 z-10 bg-muted px-3 py-2 text-left">Tim</th>
              {event.judges.map((j) => (
                <th key={j.id} className="px-2 py-2 text-center font-medium">
                  <div>{j.code}</div>
                  <div className="text-xs font-normal text-muted-foreground">{j.category.code}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {event.teams.map((team) => (
              <tr key={team.id}>
                <td className="sticky left-0 z-10 bg-card px-3 py-2 whitespace-nowrap">
                  <span className="mr-2 text-muted-foreground tabular-nums">{team.number}</span>
                  {team.name}
                </td>
                {event.judges.map((judge) => {
                  const sheet = sheetMap.get(`${team.id}:${judge.id}`)
                  const tone =
                    sheet?.status === 'FINAL'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25'
                      : sheet
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-200 hover:bg-amber-500/25'
                        : 'bg-muted text-muted-foreground hover:bg-accent'
                  return (
                    <td key={judge.id} className="px-1 py-1 text-center">
                      <Link
                        href={`/input/${team.id}/${judge.id}`}
                        className={`block rounded-md px-2 py-2 font-semibold tabular-nums transition ${tone}`}
                      >
                        {sheet ? sheet.total : '–'}
                      </Link>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
