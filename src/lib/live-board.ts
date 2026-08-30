import 'server-only'
import { getRekap } from './scoring'

type Board = Awaited<ReturnType<typeof getRekap>>

// Cache super-singkat + koalisi in-flight untuk papan publik /live.
// Tujuan: saat ratusan penonton refresh SERENTAK (thundering herd), agregasi
// berat getRekap hanya jalan SEKALI per TTL, sisanya berbagi hasil yang sama.
let cache: { at: number; data: Board } | null = null
let inflight: Promise<Board> | null = null
const TTL_MS = 1000

export async function getLiveBoard(eventSlug: string): Promise<Board> {
  const now = Date.now()
  if (cache && now - cache.at < TTL_MS) return cache.data
  // Koalisi: permintaan bersamaan menunggu satu query yang sama, bukan masing-masing.
  if (inflight) return inflight

  inflight = getRekap(eventSlug)
    .then((data) => {
      cache = { at: Date.now(), data }
      return data
    })
    .finally(() => {
      inflight = null
    })

  return inflight
}
