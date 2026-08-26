import { getSession } from '@/lib/auth'
import { EVENT_SLUG } from '@/lib/config'
import { getStandings } from '@/lib/scoring'

export const dynamic = 'force-dynamic'

/** Bungkus nilai agar aman dari CSV injection dan pemisah kolom. */
function cell(value: string | number) {
  const text = String(value)
  const escaped = /^[=+\-@]/.test(text) ? `'${text}` : text
  return `"${escaped.replace(/"/g, '""')}"`
}

export async function GET() {
  const session = await getSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const data = await getStandings(EVENT_SLUG)
  if (!data) return new Response('Not found', { status: 404 })

  const { event, standings } = data
  const categories = event.categories

  const header = ['Peringkat', 'No', 'Tim', 'Sekolah', ...categories.map((c) => c.code), 'Penalti', 'Total', 'Seri']
  const rows = standings.map((s) => [
    s.rank,
    s.number,
    s.name,
    s.school ?? '',
    ...categories.map((c) => s.categories.find((x) => x.categoryId === c.id)?.raw ?? 0),
    s.penalty,
    s.total,
    s.tied ? 'SERI' : '',
  ])

  const csv = [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n')

  return new Response('\uFEFF' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="rekap-${event.slug}.csv"`,
    },
  })
}
