import { prisma } from '@/lib/db'
import { EVENT_SLUG } from '@/lib/config'

export const dynamic = 'force-dynamic'

// Cache singkat agar banyak penonton yang polling tidak membanjiri DB.
let cache: { v: string; at: number } | null = null
const TTL_MS = 400
// Boleh di-cache CDN (mis. Cloudflare) ~1 dtk → polling ratusan penonton di-serve
// dari edge, origin cukup ~1 hit/dtk. Tanpa CDN: max-age=0 = browser tetap revalidate.
const CDN_CACHE = 'public, max-age=0, s-maxage=1, stale-while-revalidate=2'

/**
 * Sidik jari data live yang murah (agregat terindeks), bukan seluruh rekap.
 * Klien membandingkannya tiap ~0,8 dtk dan hanya refresh penuh saat berubah.
 */
export async function GET() {
  const now = Date.now()
  if (cache && now - cache.at < TTL_MS) {
    return Response.json({ v: cache.v }, { headers: { 'Cache-Control': CDN_CACHE } })
  }

  const event = await prisma.event.findUnique({
    where: { slug: EVENT_SLUG },
    select: {
      id: true,
      name: true,
      host: true,
      liveMode: true,
      overallMethod: true,
      goldPoints: true,
      silverPoints: true,
      bronzePoints: true,
      medalPlaces: true,
    },
  })

  if (!event) {
    cache = { v: '0', at: now }
    return Response.json({ v: '0' }, { headers: { 'Cache-Control': CDN_CACHE } })
  }

  const [sheet, penalty, teams] = await Promise.all([
    prisma.scoreSheet.aggregate({ where: { eventId: event.id }, _count: true, _max: { updatedAt: true } }),
    prisma.penalty.aggregate({ where: { eventId: event.id }, _count: true, _max: { createdAt: true } }),
    prisma.team.count({ where: { eventId: event.id } }),
  ])

  const v = [
    event.name,
    event.host ?? '',
    event.liveMode ? 1 : 0,
    event.overallMethod,
    event.goldPoints,
    event.silverPoints,
    event.bronzePoints,
    event.medalPlaces,
    sheet._count,
    sheet._max.updatedAt?.getTime() ?? 0,
    penalty._count,
    penalty._max.createdAt?.getTime() ?? 0,
    teams,
  ].join('|')

  cache = { v, at: now }
  return Response.json({ v }, { headers: { 'Cache-Control': CDN_CACHE } })
}
