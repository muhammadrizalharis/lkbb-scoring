import { getSession, hasAtLeast } from '@/lib/auth'
import { EVENT_SLUG } from '@/lib/config'
import { getRekap } from '@/lib/scoring'

export const dynamic = 'force-dynamic'

/** Bungkus nilai agar aman dari CSV injection dan pemisah kolom. */
function cell(value: string | number) {
  const text = String(value)
  const escaped = /^[=+\-@]/.test(text) ? `'${text}` : text
  return `"${escaped.replace(/"/g, '""')}"`
}

export async function GET() {
  const session = await getSession()
  if (!session || !hasAtLeast(session.role, 'SUPER_ADMIN')) return new Response('Unauthorized', { status: 401 })

  const data = await getRekap(EVENT_SLUG)
  if (!data) return new Response('Not found', { status: 404 })

  const { event, teams, method } = data
  const categories = event.categories.filter((c) => c.includeInOverall)
  const isMedal = method === 'MEDAL_POINTS'

  const header = [
    'Peringkat',
    'No',
    'Tim',
    'Sekolah',
    ...categories.map((c) => c.code),
    'Emas',
    'Perak',
    'Perunggu',
    isMedal ? 'Poin' : 'Total',
    'Seri',
  ]
  const rows = teams.map((t) => [
    t.overallRank,
    t.number,
    t.name,
    t.school ?? '',
    ...categories.map((c) => {
      const cat = t.categories.find((x) => x.categoryId === c.id)
      const medal = cat?.medal ? ({ gold: ' (Emas)', silver: ' (Perak)', bronze: ' (Perunggu)' }[cat.medal]) : ''
      return `${cat?.raw ?? 0}${medal}`
    }),
    t.gold,
    t.silver,
    t.bronze,
    isMedal ? t.medalPoints : t.totalScore,
    t.overallTied ? 'SERI' : '',
  ])

  const csv = [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n')

  return new Response('\uFEFF' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="rekap-${event.slug}.csv"`,
    },
  })
}
