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
      <div className="rounded-xl bg-amber-50 p-6 text-sm text-amber-900 ring-1 ring-amber-200">
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
        <p className="text-sm text-slate-500">
          Pilih kotak untuk memasukkan lembar nilai. Hijau = selesai, kuning = tersimpan sebagian.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="sticky left-0 z-10 bg-slate-50 px-3 py-2 text-left">Tim</th>
              {event.judges.map((j) => (
                <th key={j.id} className="px-2 py-2 text-center font-medium">
                  <div>{j.code}</div>
                  <div className="text-xs font-normal text-slate-500">{j.category.code}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {event.teams.map((team) => (
              <tr key={team.id}>
                <td className="sticky left-0 z-10 bg-white px-3 py-2 whitespace-nowrap">
                  <span className="mr-2 text-slate-400 tabular-nums">{team.number}</span>
                  {team.name}
                </td>
                {event.judges.map((judge) => {
                  const sheet = sheetMap.get(`${team.id}:${judge.id}`)
                  const tone =
                    sheet?.status === 'FINAL'
                      ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                      : sheet
                        ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
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
