import 'server-only'
import { prisma } from './db'

export type CategoryBreakdown = {
  categoryId: string
  code: string
  name: string
  weight: number
  includeInOverall: boolean
  /** Jumlah nilai dari seluruh juri kategori ini. */
  raw: number
  /** raw dikali bobot kategori. */
  weighted: number
  sheetsFinal: number
  sheetsExpected: number
}

export type TeamStanding = {
  teamId: string
  number: number
  name: string
  school: string | null
  categories: CategoryBreakdown[]
  penalty: number
  total: number
  rank: number
  /** true bila ada tim lain dengan total identik — butuh keputusan juri. */
  tied: boolean
  complete: boolean
}

export async function getStandings(eventSlug: string) {
  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    include: {
      categories: { orderBy: { order: 'asc' }, include: { judges: true } },
      teams: { orderBy: { number: 'asc' } },
      penalties: true,
      sheets: { include: { items: true } },
    },
  })
  if (!event) return null

  const standings: TeamStanding[] = event.teams.map((team) => {
    const categories = event.categories.map((category) => {
      const sheets = event.sheets.filter((s) => s.teamId === team.id && s.categoryId === category.id)
      const raw = sheets.reduce((sum, s) => sum + s.total, 0)
      return {
        categoryId: category.id,
        code: category.code,
        name: category.name,
        weight: category.weight,
        includeInOverall: category.includeInOverall,
        raw,
        weighted: raw * category.weight,
        sheetsFinal: sheets.filter((s) => s.status === 'FINAL').length,
        sheetsExpected: category.judges.length,
      } satisfies CategoryBreakdown
    })

    const penalty = event.penalties
      .filter((p) => p.teamId === team.id)
      .reduce((sum, p) => sum + p.points, 0)

    const total =
      categories.filter((c) => c.includeInOverall).reduce((sum, c) => sum + c.weighted, 0) - penalty

    return {
      teamId: team.id,
      number: team.number,
      name: team.name,
      school: team.school,
      categories,
      penalty,
      total,
      rank: 0,
      tied: false,
      complete: categories.every((c) => c.sheetsExpected > 0 && c.sheetsFinal >= c.sheetsExpected),
    }
  })

  standings.sort((a, b) => b.total - a.total || a.number - b.number)

  // Peringkat kompetisi standar: nilai sama berbagi peringkat (1, 2, 2, 4).
  let lastTotal: number | null = null
  let lastRank = 0
  standings.forEach((s, i) => {
    if (lastTotal !== null && s.total === lastTotal) {
      s.rank = lastRank
    } else {
      s.rank = i + 1
      lastRank = s.rank
      lastTotal = s.total
    }
  })

  const counts = new Map<number, number>()
  for (const s of standings) counts.set(s.total, (counts.get(s.total) ?? 0) + 1)
  for (const s of standings) s.tied = (counts.get(s.total) ?? 0) > 1

  return { event, standings }
}

/** Juara per kategori, berguna untuk Best Danton / Best Varfor / Best Kostum. */
export function categoryWinners(standings: TeamStanding[], categoryCode: string) {
  return [...standings]
    .map((s) => ({ team: s, value: s.categories.find((c) => c.code === categoryCode)?.raw ?? 0 }))
    .sort((a, b) => b.value - a.value || a.team.number - b.team.number)
}
