import { EVENT_SLUG } from '@/lib/config'
import { getLiveBoard } from '@/lib/live-board'
import { AutoRefresh } from './AutoRefresh'
import { AutoScroll } from './AutoScroll'
import { PublicHeader } from './PublicHeader'

export const dynamic = 'force-dynamic'

export default async function LivePage() {
  const data = await getLiveBoard(EVENT_SLUG)

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-muted-foreground">
        Belum ada lomba yang tersedia.
      </div>
    )
  }

  const { event } = data
  const categories = event.categories
  // Urut berdasarkan NOMOR URUT tampil (bukan peringkat).
  const teams = [...data.teams].sort((a, b) => a.number - b.number)
  // Nilai hanya terbuka saat mode LIVE; sebelum itu semua tampil 0.
  const live = event.liveMode

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background">
      <AutoRefresh intervalMs={live ? 1200 : 4000} />
      <PublicHeader name={event.name} host={event.host} liveMode={event.liveMode} />
      {!live ? (
        <div className="flex flex-1 items-center justify-center p-6 text-center">
          <div className="max-w-md">
            <span className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-muted text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-8">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z" />
                <circle cx="12" cy="12" r="3" />
                <line x1="3" y1="3" x2="21" y2="21" />
              </svg>
            </span>
            <p className="text-lg font-bold sm:text-2xl">
              &ldquo;{event.name}&rdquo; belum melakukan live score
            </p>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Papan skor tampil otomatis begitu panitia mengaktifkan Live. Halaman ini memperbarui sendiri.
            </p>
          </div>
        </div>
      ) : teams.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-6 text-center text-muted-foreground">
          Belum ada data peserta.
        </div>
      ) : (
        <AutoScroll>
          <div className="mx-auto w-full max-w-[110rem] px-1 sm:px-4 lg:px-8">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur">
                <tr className="border-b border-border text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs sm:tracking-wider">
                  <th className="px-1.5 py-2.5 text-center sm:px-4 sm:py-3 xl:py-4">No</th>
                  <th className="px-1.5 py-2.5 sm:px-4 sm:py-3 xl:py-4">Tim</th>
                  {categories.map((c) => (
                    <th key={c.id} className="px-0.5 py-2.5 text-center whitespace-nowrap sm:px-3 sm:py-3 xl:py-4" title={c.name}>
                      {c.code}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teams.map((t, i) => (
                  <tr key={t.teamId} className={i % 2 ? 'bg-muted/30' : ''}>
                    <td className="px-1.5 py-2 text-center sm:px-4 sm:py-3 xl:py-4">
                      <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-black tabular-nums text-primary dark:text-blue-300 sm:size-8 sm:text-sm xl:size-11 xl:text-lg">
                        {t.number}
                      </span>
                    </td>
                    <td className="px-1.5 py-2 sm:px-4 sm:py-3 xl:py-4">
                      <span className="block max-w-[34vw] truncate text-xs font-semibold sm:max-w-[52vw] sm:text-base lg:max-w-none lg:text-lg xl:text-xl">
                        {t.name}
                      </span>
                    </td>
                    {categories.map((c) => {
                      const cell = t.categories.find((x) => x.categoryId === c.id)
                      return (
                        <td key={c.id} className="px-0.5 py-2 text-center text-xs font-bold tabular-nums sm:px-3 sm:py-3 sm:text-base lg:text-lg xl:py-4 xl:text-xl">
                          {cell?.raw ?? 0}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AutoScroll>
      )}
    </div>
  )
}
