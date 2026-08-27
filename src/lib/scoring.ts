import 'server-only'
import { prisma } from './db'

export type Medal = 'gold' | 'silver' | 'bronze' | null
export type OverallMethod = 'MEDAL_POINTS' | 'TOTAL_SCORE'

export type CategoryResult = {
  categoryId: string
  code: string
  name: string
  includeInOverall: boolean
  /** Jumlah nilai dari seluruh juri kategori ini. */
  raw: number
  /** Peringkat tim di dalam kategori ini (berdasarkan nilai mentah). */
  categoryRank: number
  medal: Medal
  sheetsFinal: number
  sheetsExpected: number
}

export type RekapTeam = {
  teamId: string
  number: number
  name: string
  school: string | null
  categories: CategoryResult[]
  penalty: number
  /** Jumlah kategori berbobot dikurangi penalti (untuk metode TOTAL_SCORE & tie-break). */
  totalScore: number
  gold: number
  silver: number
  bronze: number
  medalPoints: number
  overallRank: number
  /** true bila ada tim lain yang identik di semua kunci tie-break — butuh keputusan juri. */
  overallTied: boolean
  complete: boolean
}

export async function getRekap(eventSlug: string) {
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

  const method: OverallMethod = event.overallMethod === 'TOTAL_SCORE' ? 'TOTAL_SCORE' : 'MEDAL_POINTS'
  const medalCap = Math.max(1, Math.min(3, event.medalPlaces))

  // 1. Nilai mentah per tim per kategori.
  const teams: RekapTeam[] = event.teams.map((team) => {
    const categories: CategoryResult[] = event.categories.map((category) => {
      const sheets = event.sheets.filter((s) => s.teamId === team.id && s.categoryId === category.id)
      const raw = sheets.reduce((sum, s) => sum + s.total, 0)
      return {
        categoryId: category.id,
        code: category.code,
        name: category.name,
        includeInOverall: category.includeInOverall,
        raw,
        categoryRank: 0,
        medal: null,
        sheetsFinal: sheets.filter((s) => s.status === 'FINAL').length,
        sheetsExpected: category.judges.length,
      }
    })
    const penalty = event.penalties
      .filter((p) => p.teamId === team.id)
      .reduce((sum, p) => sum + p.points, 0)
    const totalScore =
      categories
        .filter((c) => c.includeInOverall)
        .reduce((sum, c) => {
          const cat = event.categories.find((e) => e.id === c.categoryId)
          return sum + c.raw * (cat?.weight ?? 1)
        }, 0) - penalty

    return {
      teamId: team.id,
      number: team.number,
      name: team.name,
      school: team.school,
      categories,
      penalty,
      totalScore,
      gold: 0,
      silver: 0,
      bronze: 0,
      medalPoints: 0,
      overallRank: 0,
      overallTied: false,
      complete: categories.every((c) => c.sheetsExpected > 0 && c.sheetsFinal >= c.sheetsExpected),
    }
  })

  // 2. Medali per kategori: rank tim berdasarkan nilai mentah kategori (peringkat kompetisi standar).
  for (const category of event.categories) {
    if (!category.includeInOverall) continue
    const entries = teams
      .map((t) => ({ team: t, cat: t.categories.find((c) => c.categoryId === category.id)! }))
      .filter((e) => e.cat.raw > 0)
      .sort((a, b) => b.cat.raw - a.cat.raw || a.team.number - b.team.number)

    let lastRaw: number | null = null
    let lastRank = 0
    entries.forEach((e, i) => {
      const rank = lastRaw !== null && e.cat.raw === lastRaw ? lastRank : i + 1
      lastRaw = e.cat.raw
      lastRank = rank
      e.cat.categoryRank = rank
      if (rank <= medalCap) {
        const medal: Medal = rank === 1 ? 'gold' : rank === 2 ? 'silver' : 'bronze'
        e.cat.medal = medal
        if (medal === 'gold') e.team.gold += 1
        else if (medal === 'silver') e.team.silver += 1
        else e.team.bronze += 1
      }
    })
  }

  // 3. Poin medali.
  for (const t of teams) {
    t.medalPoints =
      t.gold * event.goldPoints + t.silver * event.silverPoints + t.bronze * event.bronzePoints
  }

  // 4. Peringkat Juara Umum sesuai metode + tie-break berjenjang.
  const sorted = [...teams].sort((a, b) => {
    if (method === 'MEDAL_POINTS') {
      return (
        b.medalPoints - a.medalPoints ||
        b.gold - a.gold ||
        b.silver - a.silver ||
        b.bronze - a.bronze ||
        b.totalScore - a.totalScore ||
        a.number - b.number
      )
    }
    return b.totalScore - a.totalScore || a.number - b.number
  })

  const keyOf = (t: RekapTeam) =>
    method === 'MEDAL_POINTS'
      ? `${t.medalPoints}|${t.gold}|${t.silver}|${t.bronze}|${t.totalScore}`
      : `${t.totalScore}`

  let lastKey: string | null = null
  let lastRank = 0
  sorted.forEach((t, i) => {
    const k = keyOf(t)
    if (lastKey !== null && k === lastKey) t.overallRank = lastRank
    else {
      t.overallRank = i + 1
      lastRank = i + 1
      lastKey = k
    }
  })
  const keyCounts = new Map<string, number>()
  for (const t of sorted) keyCounts.set(keyOf(t), (keyCounts.get(keyOf(t)) ?? 0) + 1)
  for (const t of sorted) t.overallTied = (keyCounts.get(keyOf(t)) ?? 0) > 1

  return { event, method, teams: sorted }
}

/** Peringkat per kategori berdasarkan nilai mentah (untuk daftar "Terbaik per kategori"). */
export function categoryRanking(teams: RekapTeam[], categoryId: string) {
  return [...teams]
    .map((t) => ({ team: t, cat: t.categories.find((c) => c.categoryId === categoryId)! }))
    .filter((e) => e.cat)
    .sort((a, b) => b.cat.raw - a.cat.raw || a.team.number - b.team.number)
}

