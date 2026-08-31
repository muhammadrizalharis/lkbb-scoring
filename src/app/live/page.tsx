import { EVENT_SLUG } from '@/lib/config'
import { getLiveBoard } from '@/lib/live-board'
import { AutoRefresh } from './AutoRefresh'
import { AutoScroll } from './AutoScroll'
import { OrientationToggle } from './OrientationToggle'
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
    <>
      {/* Tombol orientasi: mengambang & DI LUAR area yang dirotasi → selalu tegak & terlihat. */}
      <OrientationToggle />
      <div className="live-force-landscape fixed inset-0 flex flex-col overflow-hidden bg-background">
      {/* Terapkan preferensi orientasi sebelum paint agar tak ada kedipan landscape→potret. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `try{if(localStorage.getItem('lkbb_live_orient')==='portrait')document.documentElement.setAttribute('data-live-orient','portrait')}catch(e){}`,
        }}
      />
      <AutoRefresh intervalMs={live ? 1200 : 4000} />
      <PublicHeader name={event.name} host={event.host} liveMode={event.liveMode} />
      {teams.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-6 text-center text-muted-foreground">
          Belum ada data peserta.
        </div>
      ) : (
        <div className="relative flex min-h-0 flex-1 flex-col">
          <AutoScroll>
          <div className="mx-auto w-full max-w-[110rem] px-1 sm:px-4 lg:px-8">
            <table className="w-full table-fixed border-collapse">
              <colgroup>
                <col className="w-8 sm:w-14 xl:w-20" />
                <col className="w-[32%] sm:w-[30%] lg:w-[24%]" />
                {categories.map((c) => (
                  <col key={c.id} />
                ))}
              </colgroup>
              <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur">
                <tr className="border-b border-border text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs sm:tracking-wider">
                  <th className="px-1.5 py-2.5 text-center sm:px-4 sm:py-3 xl:py-4">No</th>
                  <th className="px-1.5 py-2.5 sm:px-4 sm:py-3 xl:py-4">Tim</th>
                  {categories.map((c) => (
                    <th key={c.id} className="px-0.5 py-2.5 text-center leading-tight break-words hyphens-none sm:px-3 sm:py-3 xl:py-4" title={c.name}>
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
                      <span className="block break-words leading-tight text-xs font-semibold sm:text-base lg:text-lg xl:text-xl">
                        {t.name}
                      </span>
                    </td>
                    {categories.map((c) => {
                      const cell = t.categories.find((x) => x.categoryId === c.id)
                      return (
                        <td key={c.id} className={`px-0.5 py-2 text-center text-xs font-bold tabular-nums sm:px-3 sm:py-3 sm:text-base lg:text-lg xl:py-4 xl:text-xl ${live ? '' : 'text-muted-foreground/40'}`}>
                          {live ? (cell?.raw ?? 0) : 0}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </AutoScroll>
          {!live && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-background/75 p-6 text-center">
              <div className="max-w-md rounded-2xl bg-card px-6 py-5 shadow-2xl ring-1 ring-border">
                <span className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-7">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z" />
                    <circle cx="12" cy="12" r="3" />
                    <line x1="3" y1="3" x2="21" y2="21" />
                  </svg>
                </span>
                <p className="text-lg font-bold sm:text-2xl">
                  &ldquo;{event.name}&rdquo; belum melakukan live score
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Papan akan aktif otomatis begitu panitia menyalakan Mode LIVE.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
    </>
  )
}
